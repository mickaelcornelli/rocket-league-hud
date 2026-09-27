"use client";

import { useEffect, useState } from "react";
import { MatchState } from "../lib/rocket-league/state";
import MatchHud from "../components/hud/MatchHud";

const WEBSOCKET_URL =
  "ws://127.0.0.1:3000/rl";

export default function HudPage() {
  const [state, setState] =
    useState<MatchState | null>(null);

  const [socketConnected, setSocketConnected] =
    useState(false);

  useEffect(() => {
    let socket: WebSocket | null = null;

    let reconnectTimer:
      | ReturnType<typeof setTimeout>
      | null = null;

    let stopped = false;

    const clearReconnectTimer = () => {
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const connect = () => {
      if (stopped) {
        return;
      }

      console.log(
        "[HUD] Connecting to backend..."
      );

      socket = new WebSocket(WEBSOCKET_URL);

      socket.onopen = () => {
        console.log(
          "[HUD] WebSocket connected"
        );

        setSocketConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(
            event.data
          ) as {
            type?: string;
            data?: MatchState;
          };

          if (
            message.type !== "state" ||
            !message.data
          ) {
            return;
          }

          setState(message.data);
        } catch (error) {
          console.error(
            "[HUD] Invalid WebSocket message:",
            error
          );
        }
      };

      socket.onerror = (error) => {
        console.error(
          "[HUD] WebSocket error:",
          error
        );
      };

      socket.onclose = () => {
        console.log(
          "[HUD] WebSocket disconnected"
        );

        setSocketConnected(false);

        if (stopped) {
          return;
        }

        clearReconnectTimer();

        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connect();
        }, 3000);
      };
    };

    connect();

    return () => {
      stopped = true;

      clearReconnectTimer();

      socket?.close();
      socket = null;
    };
  }, []);

  if (!state) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050506] text-[#EDEDEF]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]"
        />

        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/3 h-125 w-175 -translate-x-1/2 rounded-full bg-[#5E6AD2]/8 blur-[150px]"
        />

        <section className="relative z-10 w-full max-w-sm px-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-white/4 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_0_40px_rgba(94,106,210,0.12)]">
            <span className="text-lg font-semibold text-[#6872D9]">
              RL
            </span>
          </div>

          <h1 className="mt-6 bg-linear-to-b from-white via-white/95 to-white/60 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
            Rocket League HUD
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[#8A8F98]">
            Waiting for a connection to the local
            match service.
          </p>

          <div className="mt-6 rounded-xl border border-white/6 bg-white/2.5 p-4">
            <div className="flex items-center justify-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  socketConnected
                    ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                    : "animate-pulse bg-[#6872D9]"
                }`}
              />

              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A8F98]">
                {socketConnected
                  ? "Connected · Waiting for data"
                  : "Connecting to local server"}
              </span>
            </div>

            <div className="mt-3 font-mono text-[10px] text-[#8A8F98]">
              ws://127.0.0.1:3000/rl
            </div>
          </div>
        </section>
      </main>
    );
  }

  return <MatchHud state={state} />;
}