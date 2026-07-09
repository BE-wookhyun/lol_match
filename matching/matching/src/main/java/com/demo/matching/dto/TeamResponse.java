package com.demo.matching.dto;

import com.demo.matching.domain.Line;
import com.demo.matching.domain.Team;
import com.demo.matching.domain.VsRecord;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record TeamResponse(
        Long seq,
        String teamName,
        String captainStreamerName,
        Map<Line, String> lineup,
        int wins,
        int losses,
        double winRate,
        List<VsRecord> vsRecords,
        LocalDateTime createdAt
) {
    public static TeamResponse of(Team team) {
        int wins = team.getWins();
        int losses = team.getLosses();
        int totalGames = wins + losses;
        double winRate = totalGames == 0 ? 0.0 : (double) wins / totalGames * 100;

        return new TeamResponse(
                team.getSeq(),
                team.getTeamName(),
                team.getCaptainStreamerName(),
                team.getLineup(),
                wins,
                losses,
                winRate,
                team.getVsRecords(),
                team.getCreatedAt()
        );
    }
}
