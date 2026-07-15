package com.demo.matching.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * SOOP OAuth 연동 전까지, 삭제처럼 되돌릴 수 없는 요청만 최소한으로 막는다.
 * 등록/생성 등 나머지 API는 기획대로 계속 공개로 둔다.
 */
@Component
public class AdminAuthFilter extends OncePerRequestFilter {

    private static final String ADMIN_KEY_HEADER = "X-Admin-Key";

    @Value("${app.admin-api-key:}")
    private String adminApiKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (requiresAdminKey(request) && !isAuthorized(request)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"관리자 권한이 필요합니다.\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean requiresAdminKey(HttpServletRequest request) {
        if (!"DELETE".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        String path = request.getRequestURI();
        return path.startsWith("/api/streamers/") || path.startsWith("/api/teams/");
    }

    private boolean isAuthorized(HttpServletRequest request) {
        if (adminApiKey == null || adminApiKey.isBlank()) {
            return false;
        }
        String provided = request.getHeader(ADMIN_KEY_HEADER);
        if (provided == null) {
            return false;
        }
        return MessageDigest.isEqual(
                provided.getBytes(StandardCharsets.UTF_8),
                adminApiKey.getBytes(StandardCharsets.UTF_8)
        );
    }
}
