"use client";

import { RocketLeaguePlayer } from "@/app/lib/rocket-league/types";
import PlayerStats from "./PlayerStats";
import PlayerRank from "./PlayerRank";

interface PlayerProfileProps {
  player: RocketLeaguePlayer;
  onClose: () => void;
}

export default function PlayerProfile({
  player,
  onClose,
}: PlayerProfileProps) {
  const isBot =
    player.PrimaryId === "Unknown|0|0";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020203]/80 p-4 backdrop-blur-md"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-profile-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/8 bg-[#0a0a0c]/95 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_80px_rgba(0,0,0,0.65),0_0_100px_rgba(94,106,210,0.1)] sm:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[#5E6AD2]/12 to-transparent"
        />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6872D9]">
              Player profile
            </div>

            <h2
              id="player-profile-title"
              className="mt-2 text-2xl font-semibold tracking-tight text-[#EDEDEF]"
            >
              {player.Name}
            </h2>

            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full border border-white/8 bg-white/4 px-2 py-1 font-mono text-[10px] text-[#8A8F98]">
                {isBot ? "Bot" : "Player"}
              </span>

              <span className="font-mono text-[10px] text-[#8A8F98]">
                Team {player.TeamNum + 1}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close player profile"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/4 text-[#8A8F98] transition duration-200 hover:bg-white/8 hover:text-[#EDEDEF] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/60"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="relative z-10 mt-7 grid grid-cols-2 gap-3">
          <ProfileMetric
            label="Score"
            value={String(player.Score)}
          />

          <ProfileMetric
            label="Speed"
            value={`${Math.round(player.Speed ?? 0)}`}
          />

          <ProfileMetric
            label="Boost"
            value={`${Math.round(player.Boost ?? 0)}%`}
          />

          <ProfileMetric
            label="Shortcut"
            value={String(player.Shortcut ?? "—")}
          />
        </div>

        <div className="relative z-10 mt-6">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A8F98]">
            Match statistics
          </div>

          <PlayerStats player={player} />
        </div>

        <div className="relative z-10 mt-6 rounded-xl border border-white/8 bg-white/2 p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6872D9]">
            Rank
          </div>

          {isBot ? (
            <p className="mt-2 text-sm leading-relaxed text-[#8A8F98]">
              Pas de données de rang pour les bots.
            </p>
          ) : (
            <PlayerRank primaryId={player.PrimaryId} />
          )}
        </div>

        <div className="relative z-10 mt-6 border-t border-white/6 pt-4">
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#8A8F98]">
            Primary ID
          </div>

          <div className="mt-2 break-all font-mono text-[10px] leading-relaxed text-[#EDEDEF]">
            {player.PrimaryId}
          </div>
        </div>
      </section>
    </div>
  );
}

interface ProfileMetricProps {
  label: string;
  value: string;
}

function ProfileMetric({
  label,
  value,
}: ProfileMetricProps) {
  return (
    <div className="rounded-xl border border-white/6 bg-white/2.5 p-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#8A8F98]">
        {label}
      </div>

      <div className="mt-2 text-xl font-semibold tracking-tight text-[#EDEDEF]">
        {value}
      </div>
    </div>
  );
}