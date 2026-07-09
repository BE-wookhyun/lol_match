package com.demo.matching.service;

public class StreamerNotFoundException extends RuntimeException {

    public StreamerNotFoundException(Long seq) {
        super("스트리머를 찾을 수 없습니다: seq=%d".formatted(seq));
    }

    public StreamerNotFoundException(String streamerName) {
        super("스트리머를 찾을 수 없습니다: %s".formatted(streamerName));
    }
}
