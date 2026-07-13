package com.demo.matching.crawling;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class CrawlingClientConfig {

    @Bean
    public RestClient crawlingClient(CrawlingProperties crawlingProperties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(10_000);
        requestFactory.setReadTimeout(5 * 60 * 1000);

        return RestClient.builder()
                .baseUrl(crawlingProperties.getBaseUrl())
                .requestFactory(requestFactory)
                .build();
    }
}
