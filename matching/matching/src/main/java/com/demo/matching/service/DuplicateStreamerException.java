package com.demo.matching.service;

public class DuplicateStreamerException extends RuntimeException {

    public DuplicateStreamerException(String lolId, String lolTag) {
        super("이미 등록된 스트리머입니다: %s#%s".formatted(lolId, lolTag));
    }

    public DuplicateStreamerException(String streamerId) {
        super("이미 등록된 SOOP 계정입니다: %s".formatted(streamerId));
    }
}
