"use client";

import { useEffect, useState } from "react";
import type { PlayerRankData } from "@/server/player-service";

interface PlayerRankProps {
  primaryId: string;
}

export default function PlayerRank({ primaryId }: PlayerRankProps) {
  const [rank, setRank] = useState<PlayerRankData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    fetch(`/api/player-rank?primaryId=${encodeURIComponent(primaryId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setRank(json.data ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRank(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [primaryId]);

  if (loading) {
    return (
      <p className="mt-2 text-sm leading-relaxed text-[#8A8F98]">
        Chargement du rang…
      </p>
    );
  }

  if (!rank || rank.playlists.length === 0) {
    return (
      <p className="mt-2 text-sm leading-relaxed text-[#8A8F98]">
        Aucune donnée de rang disponible pour ce joueur.
      </p>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
      {rank.playlists.map((playlist) => (
        <div
          key={playlist.playlistLabel}
          className="rounded-xl border border-white/6 bg-white/2.5 p-3"
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#8A8F98]">
            {playlist.playlistLabel}
          </div>

          <div className="mt-1 text-sm font-semibold text-[#EDEDEF]">
            {playlist.tier ?? "Non classé"}
            {playlist.division ? ` · ${playlist.division}` : ""}
          </div>

          <div className="mt-1 flex items-center justify-between text-[10px] text-[#8A8F98]">
            <span>{playlist.rating ?? "—"} RP</span>

            {playlist.winStreak !== null && (
              <span
                className={
                  playlist.winStreak >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              >
                {playlist.winStreak >= 0
                  ? `W${playlist.winStreak}`
                  : `L${Math.abs(playlist.winStreak)}`}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}