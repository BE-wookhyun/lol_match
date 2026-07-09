package com.demo.matching.riot;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RiotAccountDto(String puuid, String gameName, String tagLine) {
}
