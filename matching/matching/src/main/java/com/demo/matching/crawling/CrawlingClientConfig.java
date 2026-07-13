package com.demo.matching.crawling;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class CrawlingClientConfig {

    @Bean
    public RestClient crawlingClient(CrawlingProperties crawlingProperties) {
        return RestClient.builder()
                .baseUrl(crawlingProperties.getBaseUrl())
                .build();
    }
}
