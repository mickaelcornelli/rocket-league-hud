"use client";

import { RocketLeaguePlayer } from "@/app/lib/rocket-league/types";
import PlayerStats from "./PlayerStats";

interface PlayerCardProps {
  player: RocketLeaguePlayer;
  variant: "blue" | "orange";
  onSelect: (player: RocketLeaguePlayer) => void;
}

export default function PlayerCard({
  player,
  variant,
  onSelect,
}: PlayerCardProps) {
  const isBot =
    player.PrimaryId === "Unknown|0|0";

  const boost = Math.max(
    0,
    Math.min(100, player.Boost ?? 0)
  );

  const accent =
    variant === "blue"
      ? "#60A5FA"
      : "#FB923C";

  const boostColor =
    boost > 60
      ? "bg-emerald-400"
      : boost > 30
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <button
      type="button"
      onClick={() => onSelect(player)}
      className="group relative w-full overflow-hidden cursor-pointer rounded-xl border border-white/6 bg-linear-to-b from-white/6.5 to-white/2 p-4 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_2px_20px_rgba(0,0,0,0.35),0_0_35px_rgba(0,0,0,0.15)] transition duration-300 ease-out hover:-translate-y-1 hover:border-white/12 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_40px_rgba(0,0,0,0.5),0_0_60px_rgba(94,106,210,0.08)] focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/60 focus:ring-offset-2 focus:ring-offset-[#050506]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px opacity-70"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        }}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-semibold"
            style={{
              borderColor: `${accent}35`,
              backgroundColor: `${accent}10`,
              color: accent,
            }}
          >
            {player.Name
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-[#EDEDEF]">
                {player.Name}
              </h3>

              {isBot && (
                <span className="rounded-full border border-white/8 bg-white/4 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-[#8A8F98]">
                  Bot
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#8A8F98]">
                #{player.Shortcut ?? "—"}
              </span>

              <span className="h-1 w-1 rounded-full bg-white/20" />

              <span className="text-[10px] text-[#8A8F98]">
                {getPlayerStatus(player)}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xl font-semibold tracking-tight text-[#EDEDEF]">
            {player.Score}
          </div>

          <div className="font-mono text-[9px] uppercase tracking-widest text-[#8A8F98]">
            Score
          </div>
        </div>
      </div>

      {/* Boost */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#8A8F98]">
            Boost
          </span>

          <span className="font-mono text-xs text-[#EDEDEF]">
            {Math.round(boost)}
            <span className="ml-0.5 text-[#8A8F98]">
              %
            </span>
          </span>
        </div>

        <div
          className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
          role="progressbar"
          aria-label={`Boost de ${player.Name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(boost)}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${boostColor}`}
            style={{
              width: `${boost}%`,
            }}
          />
        </div>
      </div>

      <PlayerStats player={player} />

      <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8A8F98]">
            Vitesse
          </span>

          <span className="font-mono text-xs text-[#EDEDEF]">
            {Math.round(player.Speed ?? 0)}
          </span>
        </div>

        <span className="text-[10px] text-[#8A8F98] transition-colors group-hover:text-[#6872D9]">
          Voir le profil →
        </span>
      </div>
    </button>
  );
}

function getPlayerStatus(
  player: RocketLeaguePlayer
) {
  if (player.bDemolished) {
    return "Demolished";
  }

  if (player.bSupersonic) {
    return "Supersonic";
  }

  if (player.bOnWall) {
    return "On wall";
  }

  if (player.bOnGround) {
    return "On ground";
  }

  if (player.bHasCar === false) {
    return "No car";
  }

  return "In air";
}