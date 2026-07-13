package com.demo.matching.crawling;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record FaEntryDto(
        @JsonProperty("streamer_name") String streamerName,
        @JsonProperty("streamer_id") String streamerId,
        @JsonProperty("lol_id") String lolId,
        @JsonProperty("lol_tag") String lolTag,
        @JsonProperty("peak_tier") String peakTier,
        @JsonProperty("score") BigDecimal score,
        @JsonProperty("score_adjustment") BigDecimal scoreAdjustment,
        @JsonProperty("position") String position
) {
}
