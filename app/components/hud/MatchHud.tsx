"use client";

import { useMemo, useState } from "react";

import PlayerCard from "./PlayerCard";
import PlayerProfile from "./PlayerProfile";
import TeamScore from "./TeamScore";
import { MatchState } from "@/app/lib/rocket-league/state";
import { RocketLeaguePlayer } from "@/app/lib/rocket-league/types";

interface MatchHudProps {
  state: MatchState;
}

export default function MatchHud({
  state,
}: MatchHudProps) {
  const [selectedPlayer, setSelectedPlayer] =
    useState<RocketLeaguePlayer | null>(null);

  const game = state.game;

  const teams = useMemo(() => {
    return game?.Teams ?? [];
  }, [game]);

  const blueTeam = teams.find(
    (team) => team.TeamNum === 0
  );

  const orangeTeam = teams.find(
    (team) => team.TeamNum === 1
  );

  const bluePlayers = state.players.filter(
    (player) => player.TeamNum === 0
  );

  const orangePlayers = state.players.filter(
    (player) => player.TeamNum === 1
  );

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(
      0,
      Math.floor(seconds)
    );

    const minutes = Math.floor(
      safeSeconds / 60
    );

    const remainingSeconds =
      safeSeconds % 60;

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050506] text-[#EDEDEF]">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]" />

        <div className="hud-ambient-primary absolute left-1/2 top-105 h-225 w-300 -translate-x-1/2 rounded-full bg-[#5E6AD2]/12 blur-[150px]" />

        <div className="hud-ambient-secondary absolute left-75 top-[25%] h-175 w-150 rounded-full bg-indigo-700/8 blur-[130px]" />

        <div className="hud-ambient-tertiary absolute right-62.5 top-[35%] h-175 w-150 rounded-full bg-blue-700/6 blur-[120px]" />

        <div className="absolute inset-0 opacity-[0.025] bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] bg-size-[64px_64px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020203_100%)]" />
      </div>

      <div className="relative z-10 mx-auto min-h-screen max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        {/* Top navigation */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <span className="text-sm font-semibold text-[#6872D9]">
                RL
              </span>
            </div>

            <div>
              <div className="text-sm font-semibold tracking-tight">
                Rocket League
              </div>

              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A8F98]">
                HUD Tracker
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/6 bg-white/[0.035] px-3 py-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${state.connected
                ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                : "bg-red-400"
                }`}
            />

            <span className="font-mono text-[10px] uppercase tracking-widest text-[#8A8F98]">
              {state.connected
                ? "En ligne"
                : "Hors ligne"}
            </span>
          </div>
        </header>

        {/* Match header */}
        <section className="mb-6 rounded-2xl border border-white/6 bg-linear-to-b from-white/[0.07] to-white/2 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_2px_20px_rgba(0,0,0,0.4),0_0_60px_rgba(0,0,0,0.2)] sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6872D9]">
                  Match en cours
                </span>

                <span className="h-px w-8 bg-[#5E6AD2]/40" />
              </div>

              <h1 className="bg-linear-to-b from-white via-white/95 to-white/60 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
                {game?.Arena ?? "Waiting for match"}
              </h1>

              <p className="mt-2 text-sm text-[#8A8F98]">
                {game
                  ? `Playlist ${game.PlaylistId}`
                  : "En attente des données du jeu"}
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-center">
              <div
                className={`font-mono text-4xl font-semibold tracking-[-0.04em] sm:text-5xl ${game?.bOvertime
                  ? "text-[#6872D9]"
                  : "text-[#EDEDEF]"
                  }`}
              >
                {game
                  ? game.bOvertime
                    ? "OT"
                    : formatTime(game.TimeSeconds)
                  : "--:--"}
              </div>

              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A8F98]">
                {game?.bOvertime
                  ? "Overtime"
                  : "Match time"}
              </div>
            </div>

            <div className="lg:text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A8F98]">
                ID du match
              </div>

              <div className="mt-2 max-w-65 truncate font-mono text-xs text-[#EDEDEF]">
                {state.matchGuid ?? "Not available"}
              </div>

              <div className="mt-2 text-xs text-[#8A8F98]">
                {state.players.length} joueurs détectés
              </div>
            </div>
          </div>

          <div className="mt-6 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MatchMetric
              label="Joueurs"
              value={String(state.players.length)}
            />

            <MatchMetric
              label="Map"
              value={game?.Arena ?? "—"}
            />

            <MatchMetric
              label="Overtime"
              value={game?.bOvertime ? "Actif" : "Inactif"}
            />

            <MatchMetric
              label="Replay"
              value={game?.bReplay ? "Actif" : "Inactif"}
            />
          </div>
        </section>

        {/* Team scores */}
        <section className="mb-6 grid gap-4 lg:grid-cols-2">
          <TeamScore
            team={blueTeam}
            players={bluePlayers}
            variant="blue"
          />

          <TeamScore
            team={orangeTeam}
            players={orangePlayers}
            variant="orange"
          />
        </section>

        {/* Player list */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6872D9]">
                Performance en direct
              </div>

              <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#EDEDEF]">
                Joueurs
              </h2>
            </div>

            <div className="text-xs text-[#8A8F98]">
              Voir le profil du joueur
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <PlayerTeamSection
              label="Equipe bleu"
              players={bluePlayers}
              variant="blue"
              onSelect={setSelectedPlayer}
            />

            <PlayerTeamSection
              label="Equipe orange"
              players={orangePlayers}
              variant="orange"
              onSelect={setSelectedPlayer}
            />
          </div>
        </section>
      </div>

      {/* Player profile overlay */}
      {selectedPlayer && (
        <PlayerProfile
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </main>
  );
}

interface MatchMetricProps {
  label: string;
  value: string;
}

function MatchMetric({
  label,
  value,
}: MatchMetricProps) {
  return (
    <div className="min-w-0 rounded-xl border border-white/5 bg-black/20 px-3 py-3">
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#8A8F98]">
        {label}
      </div>

      <div className="mt-1 truncate text-xs font-medium text-[#EDEDEF]">
        {value}
      </div>
    </div>
  );
}

interface PlayerTeamSectionProps {
  label: string;
  players: RocketLeaguePlayer[];
  variant: "blue" | "orange";
  onSelect: (player: RocketLeaguePlayer) => void;
}

function PlayerTeamSection({
  label,
  players,
  variant,
  onSelect,
}: PlayerTeamSectionProps) {
  const accent =
    variant === "blue"
      ? "text-blue-300"
      : "text-orange-300";

  return (
    <div className="rounded-2xl border border-white/6 bg-white/2.5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_2px_20px_rgba(0,0,0,0.3)] sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3
          className={`font-mono text-[10px] uppercase tracking-[0.18em] ${accent}`}
        >
          {label}
        </h3>

        <span className="font-mono text-[10px] text-[#8A8F98]">
          {players.length.toString().padStart(2, "0")}
        </span>
      </div>

      <div className="space-y-3">
        {players.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-sm text-[#8A8F98]">
            Aucun joueur détecté
          </div>
        ) : (
          players.map((player) => (
            <PlayerCard
              key={`${player.PrimaryId}-${player.Shortcut}-${player.Name}`}
              player={player}
              variant={variant}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}