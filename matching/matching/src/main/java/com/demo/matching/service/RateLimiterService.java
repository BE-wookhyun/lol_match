package com.demo.matching.service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Service;

/**
 * 인스턴스 로컬 메모리 기반 고정 윈도우 rate limiter.
 * 여러 인스턴스로 스케일아웃하면 인스턴스별로 카운트가 분리되므로, 분산 환경에서는 Redis 등으로 교체 필요.
 */
@Service
public class RateLimiterService {

    private static final int MAX_REQUESTS = 10;
    private static final long WINDOW_SECONDS = 60;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public boolean isAllowed(String key) {
        long now = Instant.now().getEpochSecond();
        Window window = windows.compute(key, (k, existing) -> {
            if (existing == null || now - existing.windowStart >= WINDOW_SECONDS) {
                return new Window(now);
            }
            existing.count.incrementAndGet();
            return existing;
        });
        return window.count.get() <= MAX_REQUESTS;
    }

    private static class Window {
        private final long windowStart;
        private final AtomicInteger count;

        private Window(long windowStart) {
            this.windowStart = windowStart;
            this.count = new AtomicInteger(1);
        }
    }
}
