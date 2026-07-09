package com.demo.matching.riot;

public class RiotRankedDataNotFoundException extends RuntimeException {

    public RiotRankedDataNotFoundException(String lolId, String lolTag) {
        super("솔로랭크 티어 정보가 없습니다 (언랭크): %s#%s".formatted(lolId, lolTag));
    }
}
