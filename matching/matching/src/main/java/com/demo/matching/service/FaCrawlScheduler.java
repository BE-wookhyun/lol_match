package com.demo.matching.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FaCrawlScheduler {

    private final FaCrawlSyncService faCrawlSyncService;

    public FaCrawlScheduler(FaCrawlSyncService faCrawlSyncService) {
        this.faCrawlSyncService = faCrawlSyncService;
    }

    @Scheduled(fixedRateString = "${crawling.interval-ms:3600000}")
    public void run() {
        faCrawlSyncService.syncFaList();
    }
}
