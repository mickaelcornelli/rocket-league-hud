import { createServer } from "http";
import next from "next";
import { parse } from "url";

import {
  WebSocketServer,
  WebSocket,
} from "ws";

import {
  getRocketLeagueService,
} from "./server/rocket-league";

const dev =
  process.env.NODE_ENV !== "production";

const hostname =
  "127.0.0.1";

const port =
  Number(process.env.PORT) || 3000;

async function bootstrap() {
  const app = next({
    dev,
    hostname,
    port,
  });

  const handle =
    app.getRequestHandler();

  await app.prepare();

  const httpServer =
    createServer((req, res) => {
      const parsedUrl =
        parse(req.url ?? "", true);

      handle(
        req,
        res,
        parsedUrl
      );
    });

  /*httpServer.on("connection", (socket) => {
    console.log("[DEBUG] TCP connection reçue, port local:", socket.localPort);
  });*/

  const wss =
    new WebSocketServer({
      noServer: true,
    });

  const rocketLeague =
    getRocketLeagueService();

  httpServer.on(
    "upgrade",
    (request, socket, head) => {
      const { pathname } =
        parse(request.url ?? "");

      console.log(
        `[HTTP] WebSocket upgrade: ${pathname}`
      );

      if (pathname !== "/rl") {
        return;
      }

      wss.handleUpgrade(
        request,
        socket,
        head,
        (ws) => {
          console.log(
            "[Browser] HUD WebSocket connected"
          );

          wss.emit(
            "connection",
            ws,
            request
          );
        }
      );
    }
  );

  const BROADCAST_INTERVAL_MS = 100; // 10 fps, ajustable si besoin

const hudClients = new Set<WebSocket>();

const broadcastState = () => {
  if (hudClients.size === 0) {
    return;
  }

  const payload = JSON.stringify({
    type: "state",
    data: rocketLeague.state.getState(),
  });

  for (const client of hudClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
};

setInterval(broadcastState, BROADCAST_INTERVAL_MS);

wss.on(
  "connection",
  (ws) => {
    console.log(
      "[Browser] HUD connected"
    );

    hudClients.add(ws);

    // Envoi immédiat pour ne pas attendre le premier tick de l'interval
    ws.send(
      JSON.stringify({
        type: "state",
        data: rocketLeague.state.getState(),
      })
    );

    ws.on("close", () => {
      console.log(
        "[Browser] HUD disconnected"
      );

      hudClients.delete(ws);
    });
  }
);

  httpServer.listen(
    port,
    hostname,
    () => {
      console.log(
        `\n🚀 Rocket League HUD`
      );

      console.log(
        `→ http://${hostname}:${port}`
      );

      console.log(
        `→ ws://${hostname}:${port}/rl`
      );

      console.log(
        `→ Rocket League: ws://127.0.0.1:49124\n`
      );
    }
  );
}

bootstrap().catch(
  console.error
);