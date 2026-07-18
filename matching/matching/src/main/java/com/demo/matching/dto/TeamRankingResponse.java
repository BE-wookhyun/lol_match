package com.demo.matching.dto;

public record TeamRankingResponse(
        Long teamSeq,
        String teamName,
        long cheerCount
) {
}
