package com.demo.matching.service;

public class TeamNotFoundException extends RuntimeException {

    public TeamNotFoundException(Long seq) {
        super("팀을 찾을 수 없습니다: seq=%d".formatted(seq));
    }

    public TeamNotFoundException(String teamName) {
        super("팀을 찾을 수 없습니다: %s".formatted(teamName));
    }
}
