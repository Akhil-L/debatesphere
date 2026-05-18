package com.debatesphere.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
@RequiredArgsConstructor
public class DebateWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;

    private final Map<Long, Set<WebSocketSession>> debateSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long debateId = getDebateId(session);
        if (debateId != null) {
            debateSessions.computeIfAbsent(debateId, k -> new CopyOnWriteArraySet<>()).add(session);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long debateId = getDebateId(session);
        if (debateId != null) {
            Set<WebSocketSession> sessions = debateSessions.get(debateId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    debateSessions.remove(debateId);
                }
            }
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // Echo back for ping/pong keepalive
        try {
            session.sendMessage(message);
        } catch (IOException e) {
            // ignore
        }
    }

    public void broadcastToDebate(Long debateId, String type, Object payload) {
        Set<WebSocketSession> sessions = debateSessions.get(debateId);
        if (sessions == null || sessions.isEmpty()) return;
        try {
            String json = objectMapper.writeValueAsString(Map.of("type", type, "data", payload));
            TextMessage message = new TextMessage(json);
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(message);
                    } catch (IOException e) {
                        // ignore individual send failures
                    }
                }
            }
        } catch (Exception e) {
            // ignore serialization errors
        }
    }

    private Long getDebateId(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) return null;
        String query = uri.getQuery();
        if (query == null) return null;
        for (String param : query.split("&")) {
            String[] kv = param.split("=", 2);
            if (kv.length == 2 && "debateId".equals(kv[0])) {
                try {
                    return Long.parseLong(kv[1]);
                } catch (NumberFormatException e) {
                    return null;
                }
            }
        }
        return null;
    }
}
