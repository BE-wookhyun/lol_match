package com.demo.matching.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "team_cheers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TeamCheer {

    @Id
    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "team_seq", nullable = false)
    private Long teamSeq;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
