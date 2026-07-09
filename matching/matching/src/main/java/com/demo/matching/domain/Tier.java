package com.demo.matching.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tiers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long seq;

    @Column(name = "streamer_seq", nullable = false)
    private Long streamerSeq;

    @Enumerated(EnumType.STRING)
    @Column(name = "lol_tier", nullable = false)
    private LolTier lolTier;

    @Enumerated(EnumType.STRING)
    @Column(name = "lol_rank")
    private LolDivision lolRank;

    @Column(name = "lp")
    private Integer lp;

    @Column(name = "season")
    private String season;

    @Column(name = "fetched_at")
    private LocalDateTime fetchedAt;

    @Builder
    private Tier(Long streamerSeq, LolTier lolTier, LolDivision lolRank, Integer lp, String season) {
        this.streamerSeq = streamerSeq;
        this.lolTier = lolTier;
        this.lolRank = lolRank;
        this.lp = lp;
        this.season = season;
    }

    @PrePersist
    private void prePersist() {
        this.fetchedAt = LocalDateTime.now();
    }
}
