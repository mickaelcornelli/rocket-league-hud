interface CachedRank {
    data: PlayerRankData | null;
    fetchedAt: number;
}

export interface PlayerPlaylistRank {
    playlistLabel: string; // "1v1", "2v2", "3v3"
    tier: string | null; // ex: "Diamond II"
    division: string | null; // ex: "Div III"
    rating: number | null; // MMR / RP
    winStreak: number | null; // positif = win streak, négatif = losing streak
}

export interface PlayerRankData {
    primaryId: string;
    platform: string;
    platformId: string;
    playlists: PlayerPlaylistRank[];
    fetchedAt: number;
}

type TrackerPlatform = "steam" | "epic" | "psn" | "xbl";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const cache = new Map<string, CachedRank>();

const inFlight = new Map<string, Promise<PlayerRankData | null>>();

// IDs de playlist ranked connus côté Rocket League (Duel/Doubles/Standard).
// À ajuster si le nom de segment renvoyé par l'API diffère de ce qu'on attend.
const RANKED_PLAYLIST_IDS: Record<number, string> = {
    10: "1v1",
    11: "2v2",
    13: "3v3",
};

/**
 * Convertit un PrimaryId Rocket League ("Steam|76561198056861280|0",
 * "Epic|0cce...|0", etc.) vers le couple (platform, platformId) attendu
 * par l'API Tracker.gg.
 * Retourne null si la plateforme n'est pas reconnue/supportée, ou si
 * le joueur est un bot (Unknown|0|0).
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
        // Ces préfixes pour PSN/Xbox sont des hypothèses courantes
        // (à confirmer/ajuster selon ce que Rocket League envoie réellement).
        case "psyonix":
        case "psn":
        case "ps4":
        case "ps5":
            return { platform: "psn", platformId: id };
        case "xbox":
        case "xboxlive":
        case "xbl":
            return { platform: "xbl", platformId: id };
        default:
            return null;
    }
}

/**
 * Appelle l'API Tracker.gg (non-officielle) pour un couple platform/platformId
 * donné. Ne fait AUCUN cache ici — voir getPlayerRankByPrimaryId pour la
 * version mise en cache, à utiliser en pratique.
 */
export async function getPlayerRank(
    platform: TrackerPlatform,
    platformId: string
): Promise<PlayerRankData | null> {
    const url = `https://api.tracker.gg/api/v2/rocket-league/standard/profile/${platform}/${encodeURIComponent(
        platformId
    )}/`;

    console.log("[PlayerService] Tracker URL:", url);

    try {
        const response = await fetch(url, {
            headers: {
                Accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "fr,fr-FR;q=0.9,en-US;q=0.8,en;q=0.7",
                "Accept-Encoding": "gzip, deflate, br",
                "Upgrade-Insecure-Requests": "1",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:156.0) Gecko/20100101 Firefox/156.0",
            },
        });

        const body = await response.text();

        console.log("STATUS:", response.status);
        console.log("HEADERS:", Object.fromEntries(response.headers.entries()));
        console.log("BODY:", body);

        /* console.log(
            "[PlayerService] Tracker response:",
            response.status,
            response.statusText
        ); */

        if (!response.ok) {
            console.warn(
                `[PlayerService] Tracker.gg a répondu ${response.status} pour ${platform}/${platformId}`
            );

            return null;
        }

        const json = await response.json();

        console.log("[PlayerService] Tracker data:", json);

        return parseTrackerGgResponse(json, platform, platformId);
    } catch (error) {
        console.warn(
            `[PlayerService] Échec de récupération du rang pour ${platform}/${platformId}:`,
            error instanceof Error ? error.message : error
        );

        return null;
    }
}

/**
 * Parsing isolé exprès : c'est ici qu'il faudra ajuster les chemins de
 * champs une fois qu'on aura confirmé la vraie forme du JSON renvoyé.
 * Structure supposée (à valider) :
 * json.data.segments[] avec segment.attributes.playlistId,
 * segment.stats.tier.metadata.name, segment.stats.division.metadata.name,
 * segment.stats.rating.value, segment.stats.winStreak.value
 */
function parseTrackerGgResponse(
    json: unknown,
    platform: TrackerPlatform,
    platformId: string
): PlayerRankData | null {
    try {
        const segments = (json as any)?.data?.segments;

        if (!Array.isArray(segments)) {
            return null;
        }

        const playlists: PlayerPlaylistRank[] = [];

        for (const segment of segments) {
            const playlistId = segment?.attributes?.playlistId;
            const label = RANKED_PLAYLIST_IDS[playlistId];

            if (!label) {
                continue; // pas une playlist ranked 1v1/2v2/3v3 qu'on suit
            }

            const stats = segment?.stats ?? {};

            playlists.push({
                playlistLabel: label,
                tier: stats?.tier?.metadata?.name ?? null,
                division: stats?.division?.metadata?.name ?? null,
                rating:
                    typeof stats?.rating?.value === "number"
                        ? stats.rating.value
                        : null,
                winStreak:
                    typeof stats?.winStreak?.value === "number"
                        ? stats.winStreak.value
                        : null,
            });
        }

        return {
            primaryId: "", // rempli par l'appelant (getPlayerRankByPrimaryId)
            platform,
            platformId,
            playlists,
            fetchedAt: Date.now(),
        };
    } catch (error) {
        console.warn(
            "[PlayerService] Impossible de parser la réponse Tracker.gg:",
            error instanceof Error ? error.message : error
        );
        return null;
    }
}

/**
 * Point d'entrée à utiliser en pratique : mapping + cache mémoire par
 * PrimaryId, avec dédoublonnage des requêtes en vol.
 */
export async function getPlayerRankByPrimaryId(
    primaryId: string
): Promise<PlayerRankData | null> {
    const mapped = mapPrimaryIdToPlatform(primaryId);

    if (!mapped) {
        return null; // bot, ou plateforme non supportée
    }

    const cached = cache.get(primaryId);

    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.data;
    }

    const existingRequest = inFlight.get(primaryId);

    if (existingRequest) {
        return existingRequest;
    }

    const request = getPlayerRank(mapped.platform, mapped.platformId)
        .then((data) => {
            const finalData = data ? { ...data, primaryId } : null;

            cache.set(primaryId, {
                data: finalData,
                fetchedAt: Date.now(),
            });

            return finalData;
        })
        .finally(() => {
            inFlight.delete(primaryId);
        });

    inFlight.set(primaryId, request);

    return request;
}