// Enrichissement des joueurs avec des données de rang externes.
// Indépendant du WebSocket Rocket League : l'identifiant utilisé partout
// est le PrimaryId ("Steam|123|0", "Epic|456|0", ...).

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface PlayerPlaylistPeak {
    rating: number; // meilleur MMR connu, toutes saisons confondues
    tier: string | null; // ex: "Grand Champion III"
    division: string | null; // ex: "Division I"
    season: string | null; // ex: "Season 23 (37)"
    iconUrl: string | null;
}

export interface PlayerPlaylistRank {
    playlistLabel: string; // "1v1", "2v2", "3v3"
    tier: string | null; // ex: "Grand Champion II"
    division: string | null; // ex: "Division II"
    rating: number | null; // MMR actuel
    iconUrl: string | null; // icône du rang actuel
    matchesPlayed: number | null; // matchs de la saison en cours
    totalMatches: number | null; // matchs classés, toutes saisons
    winStreak: number | null; // positif = win streak, négatif = losing streak
    peak: PlayerPlaylistPeak | null; // highest rank de la playlist
}

export interface PlayerProfileInfo {
    handle: string | null; // pseudo sur la plateforme
    avatarUrl: string | null;
    currentSeason: number | null;
    lastUpdated: string | null; // ISO, date de mise à jour côté Tracker
}

export interface PlayerLifetimeStats {
    wins: number | null;
    goals: number | null;
    saves: number | null;
    assists: number | null;
    mvps: number | null;
    shots: number | null;
    shotAccuracy: number | null; // pourcentage (buts / tirs)
}

export interface PlayerRankData {
    primaryId: string;
    platform: string;
    platformId: string;
    profile: PlayerProfileInfo;
    lifetime: PlayerLifetimeStats;
    playlists: PlayerPlaylistRank[];
    best2v2Mmr: number | null;
    fetchedAt: number;
}

// Valeurs acceptées par Parse.bot pour le paramètre "platform".
type TrackerPlatform = "steam" | "epic" | "psn" | "xbox";

type RankLookupResult =
    | { status: "ok"; data: PlayerRankData }
    | { status: "not_found" }
    | { status: "error"; reason: string };

/**
 * Fournisseur de rangs. Permet de remplacer Parse.bot par une autre source
 * sans toucher au cache ni à la route API.
 */
interface RankProvider {
    fetchRank(
        platform: TrackerPlatform,
        platformId: string
    ): Promise<RankLookupResult>;
}

interface CacheEntry {
    data: PlayerRankData | null;
    fetchedAt: number;
    ttlMs: number;
}

/* -------------------------------------------------------------------------- */
/*                               Configuration                                */
/* -------------------------------------------------------------------------- */

const PARSE_BASE_URL =
    "https://api.parse.bot/scraper/d0dcf8e8-3a72-4b21-bffb-8fa735257835";

const PARSE_SNAPSHOT_VERSION = "7";

const REQUEST_TIMEOUT_MS = 40000;

// Chaque appel Parse.bot coûte un crédit : on garde les succès longtemps,
// les erreurs (souvent temporaires) très peu.
const TTL_OK_MS = 30 * 60 * 1000;
const TTL_NOT_FOUND_MS = 10 * 60 * 1000;
const TTL_ERROR_MS = 60 * 1000;

// Playlists ranked suivies (IDs Rocket League / Tracker).
const RANKED_PLAYLIST_LABELS: Record<number, string> = {
    10: "1v1",
    11: "2v2",
    13: "3v3",
};

const cache = new Map<string, CacheEntry>();

const inFlight = new Map<string, Promise<PlayerRankData | null>>();

let missingKeyWarned = false;

/* -------------------------------------------------------------------------- */
/*                         PrimaryId -> plateforme                            */
/* -------------------------------------------------------------------------- */

/**
 * Convertit un PrimaryId Rocket League ("Steam|76561198056861280|0",
 * "Epic|0cce...|0", ...) vers le couple (platform, platformId).
 *
 * La doc officielle ne documente que les exemples Steam et Epic. Les autres
 * préfixes ci-dessous (consoles) sont des hypothèses : les préfixes non
 * reconnus sont loggés pour pouvoir compléter ce mapping avec de vraies données.
 *
 * Retourne null pour les bots (Unknown|0|0) et les plateformes non supportées.
 */
export function mapPrimaryIdToPlatform(
    primaryId: string
): { platform: TrackerPlatform; platformId: string } | null {
    if (!primaryId || primaryId.startsWith("Unknown|")) {
        return null;
    }

    const [rawPlatform, id] = primaryId.split("|");

    if (!rawPlatform || !id) {
        return null;
    }

    switch (rawPlatform.toLowerCase()) {
        case "steam":
            return { platform: "steam", platformId: id };

        case "epic":
            return { platform: "epic", platformId: id };

        case "psn":
            return { platform: "psn", platformId: id };
        case "ps4":
            return { platform: "psn", platformId: id };
        case "ps5":
            return { platform: "psn", platformId: id };

        case "xboxone":
            return { platform: "xbox", platformId: id };
        case "xbox":
            return { platform: "xbox", platformId: id };
        case "xboxlive":
            return { platform: "xbox", platformId: id };
        case "xbl":
            return { platform: "xbox", platformId: id };

        default:
            console.log(
                `[PlayerService] Plateforme non supportée ou inconnue, PrimaryId reçu: ${primaryId}`
            );
            return null;
    }
}

/* -------------------------------------------------------------------------- */
/*                         Helpers de lecture défensive                       */
/* -------------------------------------------------------------------------- */

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
    return typeof value === "object" && value !== null && !Array.isArray(value)
        ? (value as UnknownRecord)
        : null;
}

function readString(value: unknown): string | null {
    return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readHttpsUrl(value: unknown): string | null {
    return typeof value === "string" && value.startsWith("https://")
        ? value
        : null;
}

function readStat(stats: UnknownRecord | null, key: string): number | null {
    return readNumber(asRecord(stats?.[key])?.value);
}

/* -------------------------------------------------------------------------- */
/*                              Provider Parse.bot                            */
/* -------------------------------------------------------------------------- */

/**
 * Parsing isolé exprès. Structure validée sur deux vraies réponses
 * get_player_profile (Steam et Epic, saison 38) :
 *
 * - platformInfo.platformUserHandle / avatarUrl (avatarUrl null sur Epic)
 * - metadata.currentSeason, metadata.lastUpdated.value
 *
 * - segments[] type "overview" (lifetime) :
 *     stats.wins / goals / saves / assists / mVPs / shots / goalShotRatio (.value)
 *
 * - segments[] type "playlist", saison en cours :
 *     attributes.playlistId (10 = 1v1, 11 = 2v2, 13 = 3v3)
 *     stats.tier.metadata.name        -> "Grand Champion II"
 *     stats.division.metadata.name    -> "Division II"
 *     stats.rating.value              -> MMR actuel
 *     stats.rating.metadata.iconUrl   -> icône du rang
 *     stats.matchesPlayed.value       -> matchs de la saison
 *     stats.winStreak.value           -> TOUJOURS positif
 *     stats.winStreak.metadata.type   -> "win" | "loss" (donne le signe)
 *
 * - segments[] type "peak-rating" (un par playlist, toutes saisons) :
 *     attributes.playlistId
 *     stats.peakRating.value          -> MMR maximum
 *     stats.peakRating.metadata       -> name (tier), division, season, iconUrl
 *
 * - segments[] type "playlistAverage" :
 *     attributes.playlist, stats.matches.value -> matchs classés au total
 *
 * Attention : stats.tier.value / stats.division.value sont des indices
 * numériques, et leur displayName ("Matches") est trompeur : on lit
 * uniquement metadata.name.
 */
function parseProfile(
    payload: UnknownRecord,
    platform: TrackerPlatform,
    platformId: string
): PlayerRankData | null {
    const segments = payload.segments;

    if (!Array.isArray(segments)) {
        return null;
    }

    const peaks = new Map<number, PlayerPlaylistPeak>();
    const totalMatches = new Map<number, number>();

    let lifetime: PlayerLifetimeStats = {
        wins: null,
        goals: null,
        saves: null,
        assists: null,
        mvps: null,
        shots: null,
        shotAccuracy: null,
    };

    // 1) Segments annexes : lifetime, highest rank, total de matchs.
    for (const rawSegment of segments) {
        const segment = asRecord(rawSegment);

        if (!segment) {
            continue;
        }

        const attributes = asRecord(segment.attributes);
        const stats = asRecord(segment.stats);

        if (segment.type === "overview") {
            lifetime = {
                wins: readStat(stats, "wins"),
                goals: readStat(stats, "goals"),
                saves: readStat(stats, "saves"),
                assists: readStat(stats, "assists"),
                mvps: readStat(stats, "mVPs"),
                shots: readStat(stats, "shots"),
                shotAccuracy: readStat(stats, "goalShotRatio"),
            };
        } else if (segment.type === "peak-rating") {
            const playlistId = readNumber(attributes?.playlistId);

            if (
                playlistId === null ||
                !(playlistId in RANKED_PLAYLIST_LABELS)
            ) {
                continue;
            }

            const peakStat = asRecord(stats?.peakRating);
            const rating = readNumber(peakStat?.value);

            if (rating === null) {
                continue;
            }

            const meta = asRecord(peakStat?.metadata);

            peaks.set(playlistId, {
                rating,
                tier: readString(meta?.name),
                division: readString(meta?.division),
                season: readString(meta?.season),
                iconUrl: readHttpsUrl(meta?.iconUrl),
            });
        } else if (segment.type === "playlistAverage") {
            const playlistId = readNumber(attributes?.playlist);
            const matches = readStat(stats, "matches");

            if (playlistId !== null && matches !== null) {
                totalMatches.set(playlistId, matches);
            }
        }
    }

    // 2) Rang actuel par playlist (saison en cours).
    const ranked: Array<{ playlistId: number; rank: PlayerPlaylistRank }> = [];

    for (const rawSegment of segments) {
        const segment = asRecord(rawSegment);

        if (!segment || segment.type !== "playlist") {
            continue;
        }

        const playlistId = readNumber(
            asRecord(segment.attributes)?.playlistId
        );

        if (playlistId === null) {
            continue;
        }

        const label = RANKED_PLAYLIST_LABELS[playlistId];

        if (!label) {
            continue; // pas une playlist ranked 1v1/2v2/3v3
        }

        const stats = asRecord(segment.stats) ?? {};

        // La valeur de winStreak est toujours positive : le signe vient
        // de metadata.type ("loss" => série de défaites).
        const streakStat = asRecord(stats.winStreak);
        const streakValue = readNumber(streakStat?.value);
        const streakType = readString(asRecord(streakStat?.metadata)?.type);

        const winStreak =
            streakValue === null
                ? null
                : streakType === "loss"
                    ? 0 - streakValue
                    : streakValue;

        ranked.push({
            playlistId,
            rank: {
                playlistLabel: label,
                tier: readString(asRecord(asRecord(stats.tier)?.metadata)?.name),
                division: readString(
                    asRecord(asRecord(stats.division)?.metadata)?.name
                ),
                rating: readNumber(asRecord(stats.rating)?.value),
                iconUrl: readHttpsUrl(
                    asRecord(asRecord(stats.rating)?.metadata)?.iconUrl
                ),
                matchesPlayed: readStat(stats, "matchesPlayed"),
                totalMatches: totalMatches.get(playlistId) ?? null,
                winStreak,
                peak: peaks.get(playlistId) ?? null,
            },
        });
    }

    ranked.sort((a, b) => a.playlistId - b.playlistId);

    const platformInfo = asRecord(payload.platformInfo);
    const metadata = asRecord(payload.metadata);

    return {
        primaryId: "", // rempli par l'appelant (getPlayerRankByPrimaryId)
        platform,
        platformId,
        profile: {
            handle: readString(platformInfo?.platformUserHandle),
            avatarUrl: readHttpsUrl(platformInfo?.avatarUrl),
            currentSeason: readNumber(metadata?.currentSeason),
            lastUpdated: readString(asRecord(metadata?.lastUpdated)?.value),
        },
        lifetime,
        playlists: ranked.map((entry) => entry.rank),
        best2v2Mmr: readNumber(payload.best_2v2_mmr),
        fetchedAt: Date.now(),
    };
}

const parseBotProvider: RankProvider = {
    async fetchRank(platform, platformId) {
        // Lue à chaque appel (et non au chargement du module) pour ne pas
        // dépendre de l'ordre de chargement des variables d'environnement.
        const apiKey = process.env.PARSE_API_KEY;

        if (!apiKey) {
            if (!missingKeyWarned) {
                missingKeyWarned = true;
                console.log(
                    "[PlayerService] PARSE_API_KEY manquante (.env.local) : aucun rang ne sera récupéré."
                );
            }

            return {
                status: "error",
                reason: "missing_api_key",
            };
        }

        const url = new URL(`${PARSE_BASE_URL}/get_player_profile`);
        url.searchParams.set("platform", platform);
        url.searchParams.set("username", platformId);

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "X-API-Key": apiKey,
                    "API-Snapshot-Version": PARSE_SNAPSHOT_VERSION,
                },
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                cache: "no-store",
            });

            /*
             * 404 - Joueur introuvable
             *
             * Ce n'est pas une erreur technique : le cache utilisera
             * TTL_NOT_FOUND_MS.
             */
            if (response.status === 404) {
                return {
                    status: "not_found",
                };
            }

            /*
             * Toutes les erreurs HTTP documentées par Parse.bot.
             */
            if (!response.ok) {
                let errorBody: Record<string, unknown> | null = null;

                try {
                    errorBody = asRecord(await response.json());
                } catch {
                    // Certaines erreurs peuvent ne pas retourner de JSON.
                }

                switch (response.status) {
                    case 400:
                        console.log(
                            `[PlayerService] Parse.bot 400 Bad Request pour ${platform}/${platformId}`
                        );

                        return {
                            status: "error",
                            reason: "http_400_bad_request",
                        };

                    case 401:
                        console.log(
                            `[PlayerService] Parse.bot 401 Unauthorized : clé API invalide pour ${platform}/${platformId}`
                        );

                        return {
                            status: "error",
                            reason: "http_401_unauthorized",
                        };

                    case 402:
                        console.log(
                            `[PlayerService] Parse.bot 402 Credits Exhausted`
                        );

                        return {
                            status: "error",
                            reason: "http_402_credits_exhausted",
                        };

                    case 422:
                        console.log(
                            `[PlayerService] Parse.bot 422 Unprocessable Entity pour ${platform}/${platformId}`
                        );

                        return {
                            status: "error",
                            reason: "http_422_unprocessable_entity",
                        };

                    case 429: {
                        const retryAfter =
                            response.headers.get("Retry-After");

                        console.log(
                            `[PlayerService] Parse.bot 429 Rate Limited pour ${platform}/${platformId}` +
                            (retryAfter
                                ? ` - Retry-After: ${retryAfter}`
                                : "")
                        );

                        return {
                            status: "error",
                            reason: "http_429_rate_limited",
                        };
                    }

                    case 500:
                        console.error(
                            "[PlayerService] Parse.bot 500 Internal Error"
                        );

                        return {
                            status: "error",
                            reason: "http_500_internal_error",
                        };

                    case 502: {
                        const upstreamStatusCode =
                            errorBody?.upstream_status_code;

                        const upstreamSnippet =
                            typeof errorBody?.upstream_snippet === "string"
                                ? errorBody.upstream_snippet
                                : null;

                        console.log(
                            `[PlayerService] Parse.bot 502 Upstream Error` +
                            (upstreamStatusCode !== undefined
                                ? ` - upstream_status_code=${String(upstreamStatusCode)}`
                                : "") +
                            (upstreamSnippet
                                ? ` - ${upstreamSnippet}`
                                : "")
                        );

                        return {
                            status: "error",
                            reason: "http_502_upstream_error",
                        };
                    }

                    case 503: {
                        const retryAfter =
                            errorBody?.retry_after ??
                            response.headers.get("Retry-After");

                        console.log(
                            `[PlayerService] Parse.bot 503 Blocked` +
                            (retryAfter !== undefined && retryAfter !== null
                                ? ` - retry_after=${String(retryAfter)}`
                                : "")
                        );

                        return {
                            status: "error",
                            reason: "http_503_blocked",
                        };
                    }

                    default:
                        console.log(
                            `[PlayerService] Parse.bot a répondu ${response.status} pour ${platform}/${platformId}`
                        );

                        return {
                            status: "error",
                            reason: `http_${response.status}`,
                        };
                }
            }

            const json = asRecord(await response.json());

            if (!json) {
                return {
                    status: "error",
                    reason: "invalid_json",
                };
            }

            if (
                json.status !== undefined &&
                json.status !== "success"
            ) {
                return {
                    status: "error",
                    reason: "api_status_not_success",
                };
            }

            // La doc montre une enveloppe { data: {...}, status: "success" }.
            const payload = asRecord(json.data) ?? json;

            const data = parseProfile(
                payload,
                platform,
                platformId
            );

            return data
                ? { status: "ok", data }
                : { status: "not_found" };
        } catch (error) {
            console.log(
                `[PlayerService] Échec de récupération du rang pour ${platform}/${platformId}:`,
                error instanceof Error ? error.message : error
            );

            return {
                status: "error",
                reason: "network",
            };
        }
    },
};


// Point unique où changer de fournisseur.
const rankProvider: RankProvider = parseBotProvider;

/* -------------------------------------------------------------------------- */
/*                         Point d'entrée avec cache                          */
/* -------------------------------------------------------------------------- */

/**
 * À utiliser en pratique : mapping + cache mémoire par PrimaryId, avec
 * dédoublonnage des requêtes en vol. Les bots et plateformes inconnues
 * retournent null sans aucun appel externe.
 */
export async function getPlayerRankByPrimaryId(
    primaryId: string
): Promise<PlayerRankData | null> {
    const mapped = mapPrimaryIdToPlatform(primaryId);
    console.log("mapped", mapped)
    if (!mapped) {
        return null;
    }

    const cached = cache.get(primaryId);

    if (cached && Date.now() - cached.fetchedAt < cached.ttlMs) {
        return cached.data;
    }

    const existingRequest = inFlight.get(primaryId);

    if (existingRequest) {
        return existingRequest;
    }

    const request = rankProvider
        .fetchRank(mapped.platform, mapped.platformId)
        .then((result): PlayerRankData | null => {
            const now = Date.now();

            if (result.status === "ok") {
                const data = { ...result.data, primaryId };

                cache.set(primaryId, {
                    data,
                    fetchedAt: now,
                    ttlMs: TTL_OK_MS,
                });

                return data;
            }

            cache.set(primaryId, {
                data: null,
                fetchedAt: now,
                ttlMs:
                    result.status === "not_found"
                        ? TTL_NOT_FOUND_MS
                        : TTL_ERROR_MS,
            });

            return null;
        })
        .finally(() => {
            inFlight.delete(primaryId);
        });

    inFlight.set(primaryId, request);

    return request;
}