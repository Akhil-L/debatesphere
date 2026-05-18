import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, Server } from "http";
import { logger } from "./logger";

interface DebateClient {
  ws: WebSocket;
  debateId: string;
  userId?: number;
}

const clients: Set<DebateClient> = new Set();

export function setupWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const debateId = url.searchParams.get("debateId") ?? "global";

    const client: DebateClient = { ws, debateId };
    clients.add(client);
    logger.info({ debateId }, "WebSocket client connected");

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        broadcastToDebate(debateId, message, ws);
      } catch {
        logger.warn("Invalid WebSocket message");
      }
    });

    ws.on("close", () => {
      clients.delete(client);
      logger.info({ debateId }, "WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      logger.error({ err }, "WebSocket error");
      clients.delete(client);
    });

    ws.send(JSON.stringify({ type: "connected", debateId }));
  });

  return wss;
}

export function broadcastToDebate(debateId: string, message: unknown, exclude?: WebSocket): void {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.debateId === debateId && client.ws !== exclude && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

export function broadcastNewArgument(debateId: number, argument: unknown): void {
  broadcastToDebate(String(debateId), { type: "new_argument", argument });
}
