"use client";

import { RocketLeaguePlayer, RocketLeagueTeam } from "@/app/lib/rocket-league/types";

interface TeamScoreProps {
  team?: RocketLeagueTeam;
  players: RocketLeaguePlayer[];
  variant: "blue" | "orange";
}

export default function TeamScore({
  team,
  players,
  variant,
}: TeamScoreProps) {
  const isBlue = variant === "blue";

  const accent = isBlue
    ? "#60A5FA"
    : "#FB923C";

  const teamName =
    team?.Name ??
    (isBlue ? "Blue" : "Orange");

  const score = team?.Score ?? 0;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_2px_20px_rgba(0,0,0,0.4),0_0_50px_rgba(0,0,0,0.2)] sm:p-6"
      style={{
        borderColor: `${accent}25`,
        background: `linear-gradient(135deg, ${accent}0A, rgba(255,255,255,0.025) 60%, rgba(255,255,255,0.01))`,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute -right-25 -top-30 h-70 w-70 rounded-full blur-[100px]"
        style={{
          backgroundColor: `${accent}12`,
        }}
      />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl border"
            style={{
              borderColor: `${accent}35`,
              backgroundColor: `${accent}10`,
            }}
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: accent,
                boxShadow: `0 0 18px ${accent}70`,
              }}
            />
          </div>

          <div>
            <div
              className="font-mono text-[10px] uppercase tracking-[0.2em]"
              style={{
                color: accent,
              }}
            >
              Team {isBlue ? "01" : "02"}
            </div>

            <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#EDEDEF]">
              {teamName}
            </h2>
          </div>
        </div>

        <div className="text-right">
          <div className="text-4xl font-semibold tracking-[-0.04em] text-[#EDEDEF]">
            {score}
          </div>

          <div className="font-mono text-[9px] uppercase tracking-widest text-[#8A8F98]">
            Score
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-white/6 pt-4">
        <div className="text-xs text-[#8A8F98]">
          {players.length} player
          {players.length !== 1 ? "s" : ""}
        </div>

        <div className="flex -space-x-2">
          {players.slice(0, 4).map((player) => (
            <div
              key={`${player.PrimaryId}-${player.Shortcut}-${player.Name}`}
              title={player.Name}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0a0a0c] text-[9px] font-semibold"
              style={{
                backgroundColor: `${accent}18`,
                color: accent,
              }}
            >
              {player.Name
                .slice(0, 1)
                .toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}