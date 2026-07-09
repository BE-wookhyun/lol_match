package com.demo.matching.riot;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RiotClientConfig {

    @Bean
    public RestClient riotAccountClient(RiotProperties riotProperties) {
        return RestClient.builder()
                .baseUrl(riotProperties.getRegionalHost())
                .defaultHeader("X-Riot-Token", riotProperties.getApiKey())
                .build();
    }

    @Bean
    public RestClient riotPlatformClient(RiotProperties riotProperties) {
        return RestClient.builder()
                .baseUrl(riotProperties.getPlatformHost())
                .defaultHeader("X-Riot-Token", riotProperties.getApiKey())
                .build();
    }
}
