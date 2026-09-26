"use client";

import { useEffect, useState } from "react";
import { MatchState } from "./lib/rocket-league/state";



export default function Home() {
  const [state, setState] = useState<MatchState | null>(null);

  const [wsConnected, setWsConnected] =
    useState(false);

  useEffect(() => {
    const socket = new WebSocket(
      "ws://127.0.0.1:3000/rl"
    );

    socket.onopen = () => {
      console.log(
        "[HUD] Connected to backend"
      );

      setWsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const message =
          JSON.parse(event.data);

        if (message.type === "state") {
          setState(message.data);
        }
      } catch (error) {
        console.error(
          "[HUD] Invalid message",
          error
        );
      }
    };

    socket.onclose = () => {
      console.log(
        "[HUD] Backend disconnected"
      );

      setWsConnected(false);
    };

    socket.onerror = () => {
      console.error(
        "[HUD] WebSocket connection failed"
      );
    };

    return () => {
      socket.close();
    };
  }, []);

  const formatTime = (
    seconds: number
  ) => {
    const minutes =
      Math.floor(seconds / 60);

    const remainingSeconds =
      Math.floor(seconds % 60);

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>
        Rocket League HUD
      </h1>

      <p>
        Backend :{" "}
        {wsConnected
          ? "🟢 connecté"
          : "🔴 déconnecté"}
      </p>

      <p>
        Rocket League :{" "}
        {state?.connected
          ? "🟢 connecté"
          : "🔴 déconnecté"}
      </p>

      {!state?.matchGuid ? (
        <p>
          En attente d'un match...
        </p>
      ) : (
        <>
          <section
            style={{
              marginTop: 30,
              padding: 20,
              background: "#222",
              borderRadius: 12,
            }}
          >
            <h2>
              Match
            </h2>

            <p>
              Arena :{" "}
              {state.game?.Arena}
            </p>

            <p>
              Playlist :{" "}
              {state.game?.PlaylistId}
            </p>

            <p>
              Temps :{" "}
              {formatTime(
                state.game?.TimeSeconds ?? 0
              )}
            </p>

            <p>
              Overtime :{" "}
              {state.game?.bOvertime
                ? "Oui"
                : "Non"}
            </p>

            <p
              style={{
                fontSize: 12,
                opacity: 0.5,
              }}
            >
              MatchGuid :{" "}
              {state.matchGuid}
            </p>
          </section>

          <section
            style={{
              marginTop: 30,
              display: "flex",
              gap: 20,
            }}
          >
            {state.game?.Teams.map(
              (team) => (
                <div
                  key={
                    team.TeamNum
                  }
                  style={{
                    flex: 1,
                    padding: 30,
                    background:
                      "#222",
                    borderRadius:
                      12,
                    textAlign:
                      "center",
                  }}
                >
                  <h2>
                    {team.Name}
                  </h2>

                  <div
                    style={{
                      fontSize: 48,
                      fontWeight:
                        "bold",
                    }}
                  >
                    {
                      team.Score
                    }
                  </div>
                </div>
              )
            )}
          </section>

          <section
            style={{
              marginTop: 30,
            }}
          >
            <h2>
              Joueurs
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, 1fr)",
                gap: 15,
              }}
            >
              {state.players.map(
                (player) => (
                  <div
                    key={`${player.PrimaryId}-${player.Shortcut}-${player.Name}`}
                    style={{
                      padding: 20,
                      background: "#222",
                      borderRadius: 12,
                    }}
                  >
                    <h3>
                      {
                        player.Name
                      }
                    </h3>

                    <p>
                      Équipe :{" "}
                      {
                        player.TeamNum ===
                          0
                          ? "Bleu"
                          : "Orange"
                      }
                    </p>

                    <p>
                      Score :{" "}
                      {
                        player.Score
                      }
                    </p>

                    <p>
                      Buts :{" "}
                      {
                        player.Goals
                      }
                    </p>

                    <p>
                      Tirs :{" "}
                      {
                        player.Shots
                      }
                    </p>

                    <p>
                      Saves :{" "}
                      {
                        player.Saves
                      }
                    </p>

                    <p>
                      Touches :{" "}
                      {
                        player.Touches
                      }
                    </p>

                    <p>
                      Boost :{" "}
                      {
                        player.Boost ??
                        "-"
                      }
                    </p>

                    <p>
                      Vitesse :{" "}
                      {player.Speed !==
                        undefined
                        ? player.Speed.toFixed(
                          0
                        )
                        : "-"}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}