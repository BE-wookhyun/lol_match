package com.demo.matching.controller;

import com.demo.matching.riot.RiotApiService;
import com.demo.matching.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/riot")
public class RiotController {

    private static final Logger log = LoggerFactory.getLogger(RiotController.class);

    private final RiotApiService riotApiService;
    private final RateLimiterService rateLimiterService;

    public RiotController(RiotApiService riotApiService, RateLimiterService rateLimiterService) {
        this.riotApiService = riotApiService;
        this.rateLimiterService = rateLimiterService;
    }

    @GetMapping("/summoner")
    public ResponseEntity<?> getSummoner(
            @RequestParam String gameName,
            @RequestParam String tagLine,
            HttpServletRequest request) {

        // server.forward-headers-strategy=native가 Caddy의 X-Forwarded-For를 검증해 반영하므로
        // 클라이언트가 보낸 헤더를 직접 신뢰하지 않는다.
        String ip = request.getRemoteAddr();

        if (!rateLimiterService.isAllowed("riot:" + ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."));
        }

        try {
            return ResponseEntity.ok(riotApiService.getSummonerInfo(gameName, tagLine));
        } catch (Exception e) {
            log.warn("Riot summoner preview lookup failed: gameName={}, tagLine={}", gameName, tagLine, e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Riot API 조회에 실패했습니다."));
        }
    }
}
