"use client";

import { useEffect, useState, type ReactNode } from "react";
import type {
  PlayerLifetimeStats,
  PlayerPlaylistRank,
  PlayerProfileInfo,
  PlayerRankData,
} from "@/server/player-service";

interface PlayerRankProps {
  primaryId: string;
}

interface RankResult {
  primaryId: string;
  rank: PlayerRankData | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  steam: "Steam",
  epic: "Epic",
  psn: "PlayStation",
  xbox: "Xbox",
};

export default function PlayerRank({ primaryId }: PlayerRankProps) {
  const [result, setResult] = useState<RankResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/player-rank?primaryId=${encodeURIComponent(primaryId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setResult({ primaryId, rank: json.data ?? null });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ primaryId, rank: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [primaryId]);

  // undefined = le résultat reçu ne correspond pas (encore) à ce joueur.
  const rank =
    result !== null && result.primaryId === primaryId
      ? result.rank
      : undefined;

  if (rank === undefined) {
    return (
      <p className="mt-2 text-sm leading-relaxed text-[#8A8F98]">
        Chargement du rang…
      </p>
    );
  }

  if (rank === null || rank.playlists.length === 0) {
    return (
      <p className="mt-2 text-sm leading-relaxed text-[#8A8F98]">
        Aucune donnée de rang disponible pour ce joueur.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-4">
      <IdentityHeader
        profile={rank.profile}
        platform={rank.platform}
      />

      <div>
        <SectionLabel>
          Ranked
          {rank.profile.currentSeason !== null
            ? ` · saison ${rank.profile.currentSeason}`
            : ""}
        </SectionLabel>

        <div className="mt-2 space-y-2">
          {rank.playlists.map((playlist) => (
            <PlaylistRankRow
              key={playlist.playlistLabel}
              playlist={playlist}
            />
          ))}
        </div>
      </div>

      <LifetimeStats lifetime={rank.lifetime} />

      <FreshnessNote lastUpdated={rank.profile.lastUpdated} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Identité                                  */
/* -------------------------------------------------------------------------- */

interface IdentityHeaderProps {
  profile: PlayerProfileInfo;
  platform: string;
}

function IdentityHeader({ profile, platform }: IdentityHeaderProps) {
  const handle = profile.handle ?? "Profil inconnu";

  return (
    <div className="flex items-center gap-3">
      <Avatar url={profile.avatarUrl} name={handle} />

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-[#EDEDEF]">
          {handle}
        </div>

        <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#8A8F98]">
          {PLATFORM_LABELS[platform] ?? platform}
        </div>
      </div>
    </div>
  );
}

interface AvatarProps {
  url: string | null;
  name: string;
}

function Avatar({ url, name }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#5E6AD2]/30 bg-[#5E6AD2]/10 text-xs font-semibold text-[#6872D9]"
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`Avatar de ${name}`}
      width={40}
      height={40}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-10 w-10 shrink-0 rounded-xl border border-white/8 object-cover"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                               Rang par playlist                            */
/* -------------------------------------------------------------------------- */

interface PlaylistRankRowProps {
  playlist: PlayerPlaylistRank;
}

function PlaylistRankRow({ playlist }: PlaylistRankRowProps) {
  const { peak, winStreak, matchesPlayed, totalMatches } = playlist;

  return (
    <div className="rounded-xl border border-white/6 bg-white/2.5 p-3">
      <div className="flex items-center gap-3">
        <RankIcon
          url={playlist.iconUrl}
          fallback={playlist.playlistLabel}
        />

        <div className="min-w-0 flex-1">
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#6872D9]">
            {playlist.playlistLabel}
          </div>

          <div className="mt-1 truncate text-sm font-semibold text-[#EDEDEF]">
            {playlist.tier ?? "Non classé"}
            {playlist.division ? ` · ${playlist.division}` : ""}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-2">
            {winStreak !== null && winStreak !== 0 && (
              <StreakBadge streak={winStreak} />
            )}

            <span className="text-lg font-semibold tabular-nums tracking-tight text-[#EDEDEF]">
              {playlist.rating ?? "—"}
            </span>
          </div>

          <div className="font-mono text-[9px] uppercase tracking-widest text-[#8A8F98]">
            MMR
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/6 pt-2.5 text-[10px] text-[#8A8F98]">
        {peak ? (
          <span className="min-w-0 truncate">
            <span className="font-mono uppercase tracking-[0.14em]">
              Peak Rating
            </span>{" "}
            <span className="font-mono text-[#EDEDEF]">
              {peak.rating}
            </span>
            {peak.tier ? ` · ${peak.tier}` : ""}
            {peak.division ? ` ${peak.division}` : ""}
            {peak.season ? ` · ${peak.season}` : ""}
          </span>
        ) : (
          <span>Peak indisponible</span>
        )}

        
      </div>
    </div>
  );
}

interface RankIconProps {
  url: string | null;
  fallback: string;
}

function RankIcon({ url, fallback }: RankIconProps) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/4 font-mono text-[9px] uppercase text-[#8A8F98]"
      >
        {fallback}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={40}
      height={40}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-10 w-10 shrink-0 object-contain"
    />
  );
}

interface StreakBadgeProps {
  streak: number;
}

function StreakBadge({ streak }: StreakBadgeProps) {
  const isWin = streak > 0;

  return (
    <span
      className={`rounded-full border px-1.5 py-0.5 font-mono text-[11px] ${
        isWin
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
          : "border-red-400/30 bg-red-400/10 text-red-400"
      }`}
      title={isWin ? "Série de victoires" : "Série de défaites"}
    >
      {isWin ? `W/${streak}` : `L/${Math.abs(streak)}`}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Lifetime                                 */
/* -------------------------------------------------------------------------- */

interface LifetimeStatsProps {
  lifetime: PlayerLifetimeStats;
}

function LifetimeStats({ lifetime }: LifetimeStatsProps) {
  const stats = [
    { label: "Victoires", value: formatNumber(lifetime.wins) },
    { label: "Buts", value: formatNumber(lifetime.goals) },
    { label: "Arrêts", value: formatNumber(lifetime.saves) },
    { label: "Passes", value: formatNumber(lifetime.assists) },
    { label: "MVPs", value: formatNumber(lifetime.mvps) },
    {
      label: "% tir",
      value:
        lifetime.shotAccuracy === null
          ? "—"
          : `${lifetime.shotAccuracy.toFixed(1)}%`,
    },
  ];

  if (stats.every((stat) => stat.value === "—")) {
    return null;
  }

  return (
    <div>
      <SectionLabel>Stats globales du compte</SectionLabel>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-white/4 bg-black/20 px-2 py-2.5 text-center"
          >
            <div className="text-sm font-semibold tabular-nums text-[#EDEDEF]">
              {stat.value}
            </div>

            <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#8A8F98]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#8A8F98]">
      {children}
    </div>
  );
}

interface FreshnessNoteProps {
  lastUpdated: string | null;
}

function FreshnessNote({ lastUpdated }: FreshnessNoteProps) {
  if (!lastUpdated) {
    return null;
  }

  const date = new Date(lastUpdated);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return (
    <p className="text-[10px] text-[#8A8F98]">
      Données Tracker mises à jour le{" "}
      {date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </p>
  );
}

function formatNumber(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("fr-FR");
}
