package com.demo.matching.dto;

import com.demo.matching.domain.Line;
import com.demo.matching.domain.LolDivision;
import com.demo.matching.domain.LolTier;
import com.demo.matching.domain.Streamer;
import com.demo.matching.domain.Tier;

public record StreamerResponse(
        Long seq,
        String streamerName,
        String streamerIconUrl,
        String lolId,
        String lolTag,
        Line line,
        LolTier tier,
        LolDivision division,
        Integer lp
) {
    public static StreamerResponse of(Streamer streamer, Tier tier) {
        return new StreamerResponse(
                streamer.getSeq(),
                streamer.getStreamerName(),
                streamer.getStreamerIconUrl(),
                streamer.getLolId(),
                streamer.getLolTag(),
                streamer.getLine(),
                tier == null ? null : tier.getLolTier(),
                tier == null ? null : tier.getLolRank(),
                tier == null ? null : tier.getLp()
        );
    }
}
