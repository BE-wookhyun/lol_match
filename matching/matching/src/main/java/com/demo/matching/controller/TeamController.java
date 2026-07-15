package com.demo.matching.controller;

import com.demo.matching.domain.Line;
import com.demo.matching.dto.LineupValidationResponse;
import com.demo.matching.dto.TeamCreateRequest;
import com.demo.matching.dto.TeamLineupUpdateRequest;
import com.demo.matching.dto.TeamMatchResultRequest;
import com.demo.matching.dto.TeamResponse;
import com.demo.matching.service.TeamService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @PostMapping
    public ResponseEntity<TeamResponse> create(@Valid @RequestBody TeamCreateRequest request) {
        TeamResponse response = teamService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<TeamResponse> findAll() {
        return teamService.findAll();
    }

    @GetMapping("/validate-lineup")
    public LineupValidationResponse validateLineup(
            @RequestParam String streamerName,
            @RequestParam Line targetLine
    ) {
        return teamService.validateLineup(streamerName, targetLine);
    }

    @GetMapping("/{seq}")
    public TeamResponse findOne(@PathVariable Long seq) {
        return teamService.findBySeq(seq);
    }

    @PatchMapping("/{seq}")
    public TeamResponse updateLineup(@PathVariable Long seq, @Valid @RequestBody TeamLineupUpdateRequest request) {
        return teamService.updateLineup(seq, request);
    }

    @DeleteMapping("/{seq}")
    public ResponseEntity<Void> delete(@PathVariable Long seq) {
        teamService.delete(seq);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/match-results")
    public ResponseEntity<Void> recordMatchResult(@Valid @RequestBody TeamMatchResultRequest request) {
        teamService.recordMatchResult(request);
        return ResponseEntity.noContent().build();
    }
}
