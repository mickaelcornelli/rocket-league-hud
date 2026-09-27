"use client";

import { RocketLeaguePlayer } from "@/app/lib/rocket-league/types";


interface PlayerStatsProps {
  player: RocketLeaguePlayer;
}

export default function PlayerStats({
  player,
}: PlayerStatsProps) {
  const stats = [
    {
      label: "Goals",
      value: player.Goals,
    },
    {
      label: "Shots",
      value: player.Shots,
    },
    {
      label: "Assists",
      value: player.Assists,
    },
    {
      label: "Saves",
      value: player.Saves,
    },
    {
      label: "Touches",
      value: player.Touches,
    },
    {
      label: "Demos",
      value: player.Demos,
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-white/4 bg-black/20 px-2 py-2.5 text-center transition-colors duration-200 group-hover:border-white/8"
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
  );
}