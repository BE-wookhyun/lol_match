package com.demo.matching.config;

import com.demo.matching.websocket.TeamRankingWebSocketHandler;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    private final TeamRankingWebSocketHandler teamRankingWebSocketHandler;

    public WebSocketConfig(TeamRankingWebSocketHandler teamRankingWebSocketHandler) {
        this.teamRankingWebSocketHandler = teamRankingWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(teamRankingWebSocketHandler, "/api/ws/team-ranking")
                .setAllowedOrigins(List.of(allowedOrigins.split(",")).toArray(String[]::new));
    }
}
