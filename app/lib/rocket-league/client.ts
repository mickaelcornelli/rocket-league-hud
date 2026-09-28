import WebSocket from "ws";
import type {
    RocketLeagueMessage,
    UpdateState,
} from "./types";

type EventHandler = (
    data: unknown
) => void;

export class RocketLeagueClient {
    private socket: WebSocket | null = null;

    private readonly url: string;

    private reconnectTimer: NodeJS.Timeout | null = null;

    private handlers = new Map<string, Set<EventHandler>>();

    private connected = false;

    constructor(
        url = process.env.ROCKET_LEAGUE_WS_URL ??
            "ws://127.0.0.1:49124"
    ) {
        this.url = url;
    }

    connect() {
        if (
            this.socket &&
            (this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING)
        ) {
            return;
        }

        console.log(
            `[RocketLeague] Connecting to ${this.url}`
        );

        this.socket = new WebSocket(this.url);

        this.socket.on("open", () => {
            this.connected = true;

            console.log(
                "[RocketLeague] Connected"
            );

            this.emit("connected", null);
        });

        this.socket.on("message", (raw) => {
            this.handleMessage(raw.toString());
        });

        this.socket.on("close", () => {
            this.connected = false;

            console.log(
                "[RocketLeague] Disconnected"
            );

            this.emit("disconnected", null);

            this.scheduleReconnect();
        });

        this.socket.on("error", (error) => {
            console.log(
                "[RocketLeague] WebSocket error:",
                error.message
            );
        });
    }

    private handleMessage(raw: string) {
        try {
            const message =
                JSON.parse(raw) as RocketLeagueMessage;
    
            if (!message.Event) {
                return;
            }
    
            let data = message.Data;
    
            // Rocket League peut envoyer Data comme
            // une chaîne contenant elle-même du JSON.
            if (typeof data === "string") {
                data = JSON.parse(data);
            }
    
/*             // Debug lisible
            if (message.Event === "UpdateState") {
                console.log(
                    "\n[RocketLeague] UpdateState:"
                );
            
                console.log(
                    JSON.stringify(
                        data,
                        null,
                        2
                    )
                );
            } */
    
            this.emit(
                message.Event,
                data
            );
        } catch {
            console.error(
                "\n[RocketLeague] Invalid message:"
            );
    
            console.error(
                raw
            );
        }
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) {
            return;
        }

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, 3000);
    }

    on(
        event: string,
        handler: EventHandler
    ) {
        if (!this.handlers.has(event)) {
            this.handlers.set(
                event,
                new Set()
            );
        }

        this.handlers
            .get(event)!
            .add(handler);

        return () => {
            this.handlers
                .get(event)
                ?.delete(handler);
        };
    }

    private emit(
        event: string,
        data: unknown
    ) {
        const handlers =
            this.handlers.get(event);

        if (!handlers) {
            return;
        }

        for (const handler of handlers) {
            handler(data);
        }
    }

    send(
        command: string,
        data: unknown = {}
    ) {
        if (
            !this.socket ||
            this.socket.readyState !== WebSocket.OPEN
        ) {
            return false;
        }

        this.socket.send(
            JSON.stringify({
                Command: command,
                Data: data,
            })
        );

        return true;
    }

    isConnected() {
        return this.connected;
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        this.socket?.close();
        this.socket = null;
    }
}