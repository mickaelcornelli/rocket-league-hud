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

  wss.on(
    "connection",
    (ws) => {
      console.log(
        "[Browser] HUD connected"
      );

      const sendState = () => {
        if (
          ws.readyState !==
          WebSocket.OPEN
        ) {
          return;
        }

        ws.send(
          JSON.stringify({
            type: "state",
            data:
              rocketLeague.state.getState(),
          })
        );
      };

      sendState();

      const unsubscribe =
        rocketLeague.state.onState(
          sendState
        );

      ws.on("close", () => {
        console.log(
          "[Browser] HUD disconnected"
        );

        unsubscribe();
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