package com.demo.matching.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "teams")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long seq;

    @Column(name = "team_name", nullable = false)
    private String teamName;

    @Column(name = "captain_streamer_name", nullable = false)
    private String captainStreamerName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "lineup", nullable = false, columnDefinition = "jsonb")
    private Map<Line, String> lineup;

    @Column(name = "wins", nullable = false)
    private Integer wins;

    @Column(name = "losses", nullable = false)
    private Integer losses;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "vs_records", columnDefinition = "jsonb")
    private List<VsRecord> vsRecords;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "visible", nullable = false, columnDefinition = "boolean not null default true")
    private boolean visible;

    @Builder
    private Team(String teamName, String captainStreamerName, Map<Line, String> lineup) {
        this.teamName = teamName;
        this.captainStreamerName = captainStreamerName;
        this.lineup = new HashMap<>(lineup);
        this.wins = 0;
        this.losses = 0;
        this.vsRecords = new ArrayList<>();
        this.visible = true;
    }

    @PrePersist
    private void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.vsRecords == null) {
            this.vsRecords = new ArrayList<>();
        }
    }

    public void updateLineup(Map<Line, String> lineup) {
        this.lineup = new HashMap<>(lineup);
    }

    public void setVsRecord(String opponentTeamName, int wins, int losses) {
        if (this.vsRecords == null) {
            this.vsRecords = new ArrayList<>();
        }
        int accumulatedWins = wins;
        int accumulatedLosses = losses;
        VsRecord existing = this.vsRecords.stream()
                .filter(r -> r.opponentTeamName().equals(opponentTeamName))
                .findFirst()
                .orElse(null);
        if (existing != null) {
            accumulatedWins += existing.wins();
            accumulatedLosses += existing.losses();
        }

        this.vsRecords.removeIf(r -> r.opponentTeamName().equals(opponentTeamName));
        this.vsRecords.add(new VsRecord(opponentTeamName, accumulatedWins, accumulatedLosses));

        this.wins = this.vsRecords.stream().mapToInt(VsRecord::wins).sum();
        this.losses = this.vsRecords.stream().mapToInt(VsRecord::losses).sum();
    }
}
