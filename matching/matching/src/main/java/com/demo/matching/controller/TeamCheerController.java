package com.demo.matching.controller;

import com.demo.matching.dto.MyCheerResponse;
import com.demo.matching.dto.TeamRankingResponse;
import com.demo.matching.service.TeamCheerService;
import com.demo.matching.websocket.TeamRankingWebSocketHandler;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teams")
public class TeamCheerController {

    private final TeamCheerService teamCheerService;
    private final TeamRankingWebSocketHandler teamRankingWebSocketHandler;

    public TeamCheerController(TeamCheerService teamCheerService, TeamRankingWebSocketHandler teamRankingWebSocketHandler) {
        this.teamCheerService = teamCheerService;
        this.teamRankingWebSocketHandler = teamRankingWebSocketHandler;
    }

    @GetMapping("/cheer/me")
    public MyCheerResponse myCheer(HttpServletRequest request) {
        return teamCheerService.getMyVote(request.getRemoteAddr());
    }

    @PostMapping("/{seq}/cheer")
    public List<TeamRankingResponse> cheer(@PathVariable Long seq, HttpServletRequest request) {
        List<TeamRankingResponse> ranking = teamCheerService.vote(seq, request.getRemoteAddr());
        teamRankingWebSocketHandler.broadcast(ranking);
        return ranking;
    }
}
