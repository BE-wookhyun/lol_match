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
@Table(name = "streamers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Streamer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long seq;

    @Column(name = "streamer_name", nullable = false)
    private String streamerName;

    @Column(name = "streamer_id", unique = true)
    private String streamerId;

    @Column(name = "streamer_icon_url")
    private String streamerIconUrl;

    @Column(name = "lol_id", nullable = false)
    private String lolId;

    @Column(name = "lol_tag", nullable = false)
    private String lolTag;

    @Enumerated(EnumType.STRING)
    @Column(name = "line", nullable = false)
    private Line line;

    @Column(name = "soop_channel_id")
    private String soopChannelId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    private Streamer(String streamerName, String streamerId, String streamerIconUrl,
                      String lolId, String lolTag, Line line, String soopChannelId) {
        this.streamerName = streamerName;
        this.streamerId = streamerId;
        this.streamerIconUrl = streamerIconUrl;
        this.lolId = lolId;
        this.lolTag = lolTag;
        this.line = line;
        this.soopChannelId = soopChannelId;
    }

    @PrePersist
    private void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void updateFromCrawl(String streamerName, String lolId, String lolTag, Line line) {
        this.streamerName = streamerName;
        this.lolId = lolId;
        this.lolTag = lolTag;
        this.line = line;
    }
}
