package com.demo.matching.riot;

public class RiotAccountNotFoundException extends RuntimeException {

    public RiotAccountNotFoundException(String lolId, String lolTag) {
        super("Riot 계정을 찾을 수 없습니다: %s#%s".formatted(lolId, lolTag));
    }
}
