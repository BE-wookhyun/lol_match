package com.demo.matching.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "scores")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long seq;

    @Column(name = "streamer_seq", nullable = false)
    private Long streamerSeq;

    @Column(name = "peak_tier", nullable = false)
    private String peakTier;

    @Column(name = "score", nullable = false)
    private BigDecimal score;

    @Column(name = "score_adjustment")
    private BigDecimal scoreAdjustment;

    @Enumerated(EnumType.STRING)
    @Column(name = "line")
    private Line line;

    @Column(name = "season", nullable = false)
    private String season;

    @Column(name = "fetched_at")
    private LocalDateTime fetchedAt;

    @Builder
    private Score(Long streamerSeq, String peakTier, BigDecimal score, BigDecimal scoreAdjustment,
                  Line line, String season) {
        this.streamerSeq = streamerSeq;
        this.peakTier = peakTier;
        this.score = score;
        this.scoreAdjustment = scoreAdjustment;
        this.line = line;
        this.season = season;
    }

    @PrePersist
    private void prePersist() {
        this.fetchedAt = LocalDateTime.now();
    }

    @PreUpdate
    private void preUpdate() {
        this.fetchedAt = LocalDateTime.now();
    }

    public void updateFromCrawl(String peakTier, BigDecimal score, BigDecimal scoreAdjustment, Line line) {
        this.peakTier = peakTier;
        this.score = score;
        this.scoreAdjustment = scoreAdjustment;
        this.line = line;
    }
}
