package com.demo.matching.service;

import com.demo.matching.domain.Line;
import com.demo.matching.domain.Streamer;
import com.demo.matching.domain.Team;
import com.demo.matching.dto.LineupValidationResponse;
import com.demo.matching.dto.TeamCreateRequest;
import com.demo.matching.dto.TeamLineupUpdateRequest;
import com.demo.matching.dto.TeamMatchResultRequest;
import com.demo.matching.dto.TeamResponse;
import com.demo.matching.repository.StreamerRepository;
import com.demo.matching.repository.TeamRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TeamService {

    private final TeamRepository teamRepository;
    private final StreamerRepository streamerRepository;

    public TeamService(TeamRepository teamRepository, StreamerRepository streamerRepository) {
        this.teamRepository = teamRepository;
        this.streamerRepository = streamerRepository;
    }

    @Transactional
    public TeamResponse create(TeamCreateRequest request) {
        findStreamerByName(request.captainStreamerName());
        assertLineupValid(request.lineup(), request.forceLineMismatch());

        Team team = Team.builder()
                .teamName(request.teamName())
                .captainStreamerName(request.captainStreamerName())
                .lineup(request.lineup())
                .build();
        teamRepository.save(team);

        return TeamResponse.of(team);
    }

    public TeamResponse findBySeq(Long seq) {
        Team team = teamRepository.findById(seq)
                .orElseThrow(() -> new TeamNotFoundException(seq));
        return TeamResponse.of(team);
    }

    public List<TeamResponse> findAll() {
        return teamRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(TeamResponse::of)
                .toList();
    }

    @Transactional
    public TeamResponse updateLineup(Long seq, TeamLineupUpdateRequest request) {
        Team team = teamRepository.findById(seq)
                .orElseThrow(() -> new TeamNotFoundException(seq));
        assertLineupValid(request.lineup(), request.forceLineMismatch());
        team.updateLineup(request.lineup());

        return TeamResponse.of(team);
    }

    @Transactional
    public void recordMatchResult(TeamMatchResultRequest request) {
        Team team = teamRepository.findByTeamName(request.teamName())
                .orElseThrow(() -> new TeamNotFoundException(request.teamName()));
        Team opponent = teamRepository.findByTeamName(request.opponentTeamName())
                .orElseThrow(() -> new TeamNotFoundException(request.opponentTeamName()));

        team.setVsRecord(request.opponentTeamName(), request.wins(), request.losses());
        opponent.setVsRecord(request.teamName(), request.losses(), request.wins());
    }

    public LineupValidationResponse validateLineup(String streamerName, Line targetLine) {
        Streamer streamer = findStreamerByName(streamerName);

        if (streamer.getLine() == targetLine) {
            return new LineupValidationResponse(true, null);
        }
        return new LineupValidationResponse(
                false,
                "%s님은 %s 라인 스트리머가 아닙니다.".formatted(streamer.getStreamerName(), targetLine)
        );
    }

    private void assertLineupValid(Map<Line, String> lineup, boolean forceLineMismatch) {
        Set<String> uniqueNames = new HashSet<>(lineup.values());
        if (uniqueNames.size() != lineup.size()) {
            throw new InvalidLineupException("한 명의 스트리머를 여러 라인에 중복 배치할 수 없습니다.");
        }

        for (Map.Entry<Line, String> entry : lineup.entrySet()) {
            Streamer streamer = findStreamerByName(entry.getValue());
            if (!forceLineMismatch && streamer.getLine() != entry.getKey()) {
                throw new InvalidLineupException(
                        "%s님은 %s 라인 스트리머가 아닙니다.".formatted(streamer.getStreamerName(), entry.getKey()));
            }
        }
    }

    private Streamer findStreamerByName(String streamerName) {
        return streamerRepository.findByStreamerName(streamerName)
                .orElseThrow(() -> new StreamerNotFoundException(streamerName));
    }
}
