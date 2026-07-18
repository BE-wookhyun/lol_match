package com.demo.matching.websocket;

import com.demo.matching.dto.TeamRankingResponse;
import com.demo.matching.service.TeamCheerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class TeamRankingWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(TeamRankingWebSocketHandler.class);

    private final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>();
    private final TeamCheerService teamCheerService;
    private final ObjectMapper objectMapper;

    public TeamRankingWebSocketHandler(TeamCheerService teamCheerService, ObjectMapper objectMapper) {
        this.teamCheerService = teamCheerService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        sendRanking(session, teamCheerService.getRanking());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

    public void broadcast(List<TeamRankingResponse> ranking) {
        for (WebSocketSession session : sessions) {
            sendRanking(session, ranking);
        }
    }

    private void sendRanking(WebSocketSession session, List<TeamRankingResponse> ranking) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(ranking)));
            }
        } catch (IOException e) {
            log.warn("Failed to send team ranking to session {}: {}", session.getId(), e.getMessage());
            sessions.remove(session);
        }
    }
}
