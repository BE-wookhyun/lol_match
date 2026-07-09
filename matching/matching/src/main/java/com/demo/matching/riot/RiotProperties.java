package com.demo.matching.riot;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "riot")
public class RiotProperties {

    private String apiKey;
    private String regionalHost = "https://asia.api.riotgames.com";
    private String platformHost = "https://kr.api.riotgames.com";
    private String season = "2025";

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getRegionalHost() {
        return regionalHost;
    }

    public void setRegionalHost(String regionalHost) {
        this.regionalHost = regionalHost;
    }

    public String getPlatformHost() {
        return platformHost;
    }

    public void setPlatformHost(String platformHost) {
        this.platformHost = platformHost;
    }

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
    }
}
