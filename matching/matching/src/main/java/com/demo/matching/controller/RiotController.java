package com.demo.matching.controller;

import com.demo.matching.riot.RiotApiService;
import com.demo.matching.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/riot")
public class RiotController {

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

        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null) {
            ip = request.getRemoteAddr();
        }

        if (!rateLimiterService.isAllowed("riot:" + ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."));
        }

        try {
            return ResponseEntity.ok(riotApiService.getSummonerInfo(gameName, tagLine));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Riot API 조회 실패: " + e.getMessage()));
        }
    }
}
