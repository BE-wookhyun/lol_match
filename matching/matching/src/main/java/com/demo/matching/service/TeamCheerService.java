package com.demo.matching.service;

import com.demo.matching.domain.Team;
import com.demo.matching.dto.MyCheerResponse;
import com.demo.matching.dto.TeamRankingResponse;
import com.demo.matching.repository.TeamCheerCountProjection;
import com.demo.matching.repository.TeamCheerRepository;
import com.demo.matching.repository.TeamRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TeamCheerService {

    private final TeamCheerRepository teamCheerRepository;
    private final TeamRepository teamRepository;

    public TeamCheerService(TeamCheerRepository teamCheerRepository, TeamRepository teamRepository) {
        this.teamCheerRepository = teamCheerRepository;
        this.teamRepository = teamRepository;
    }

    public MyCheerResponse getMyVote(String ipAddress) {
        return teamCheerRepository.findById(ipAddress)
                .map(cheer -> new MyCheerResponse(cheer.getTeamSeq()))
                .orElse(new MyCheerResponse(null));
    }

    @Transactional
    public List<TeamRankingResponse> vote(Long teamSeq, String ipAddress) {
        if (!teamRepository.existsById(teamSeq)) {
            throw new TeamNotFoundException(teamSeq);
        }
        teamCheerRepository.upsertVote(ipAddress, teamSeq);
        return getRanking();
    }

    public List<TeamRankingResponse> getRanking() {
        List<Team> teams = teamRepository.findAllByVisibleTrueOrderByCreatedAtDesc();
        Map<Long, Long> counts = teamCheerRepository.countGroupedByTeam().stream()
                .collect(Collectors.toMap(TeamCheerCountProjection::getTeamSeq, TeamCheerCountProjection::getCheerCount));

        return teams.stream()
                .map(team -> new TeamRankingResponse(team.getSeq(), team.getTeamName(), counts.getOrDefault(team.getSeq(), 0L)))
                .sorted(Comparator.comparingLong(TeamRankingResponse::cheerCount).reversed()
                        .thenComparing(TeamRankingResponse::teamName))
                .toList();
    }
}
