package com.demo.matching.crawling;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class CrawlingApiService {

    private static final Logger log = LoggerFactory.getLogger(CrawlingApiService.class);

    private final RestClient crawlingClient;

    public CrawlingApiService(RestClient crawlingClient) {
        this.crawlingClient = crawlingClient;
    }

    public List<FaEntryDto> fetchFaList(String season) {
        long startedAt = System.currentTimeMillis();
        List<FaEntryDto> entries = crawlingClient.get()
                .uri("/crawl/fa/{season}", season)
                .retrieve()
                .body(new ParameterizedTypeReference<List<FaEntryDto>>() {
                });
        log.info("FA 크롤링 조회 완료: season={}, count={}, durationMs={}",
                season, entries == null ? 0 : entries.size(), System.currentTimeMillis() - startedAt);
        return entries == null ? List.of() : entries;
    }
}
