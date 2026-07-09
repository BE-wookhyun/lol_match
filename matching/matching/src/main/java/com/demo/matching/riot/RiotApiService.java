package com.demo.matching.riot;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class RiotApiService {

    private static final String SOLO_QUEUE = "RANKED_SOLO_5x5";

    private static final Map<String, String> TIER_MAP = Map.of(
            "CHALLENGER", "챌린저",
            "GRANDMASTER", "그랜드마스터",
            "MASTER", "마스터",
            "DIAMOND", "다이아",
            "EMERALD", "에메랄드",
            "PLATINUM", "플래티넘",
            "GOLD", "골드",
            "SILVER", "실버",
            "BRONZE", "브론즈",
            "IRON", "아이언"
    );

    private static final Map<String, String> RANK_MAP = Map.of(
            "I", "1",
            "II", "2",
            "III", "3",
            "IV", "4"
    );

    private final RestClient riotAccountClient;
    private final RestClient riotPlatformClient;

    public RiotApiService(@Qualifier("riotAccountClient") RestClient riotAccountClient,
                           @Qualifier("riotPlatformClient") RestClient riotPlatformClient) {
        this.riotAccountClient = riotAccountClient;
        this.riotPlatformClient = riotPlatformClient;
    }

    public RiotAccountDto fetchAccount(String lolId, String lolTag) {
        return riotAccountClient.get()
                .uri("/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}", lolId, lolTag)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                    throw new RiotAccountNotFoundException(lolId, lolTag);
                })
                .body(RiotAccountDto.class);
    }

    public RiotLeagueEntryDto fetchSoloRankEntry(String puuid, String lolId, String lolTag) {
        return findSoloRankEntry(puuid)
                .orElseThrow(() -> new RiotRankedDataNotFoundException(lolId, lolTag));
    }

    /**
     * 스트리머 등록 흐름과 달리 언랭을 에러로 취급하지 않고 "언랭"으로 표시하는 단순 조회용 API.
     */
    public Map<String, Object> getSummonerInfo(String gameName, String tagLine) {
        RiotAccountDto account = fetchAccount(gameName, tagLine);
        Optional<RiotLeagueEntryDto> soloRankEntry = findSoloRankEntry(account.puuid());

        String tier = soloRankEntry.map(entry -> TIER_MAP.getOrDefault(entry.tier(), entry.tier())).orElse("언랭");
        String rank = soloRankEntry.map(entry -> RANK_MAP.getOrDefault(entry.rank(), "")).orElse("");

        return Map.of("gameName", gameName, "tagLine", tagLine, "tier", tier, "rank", rank);
    }

    private Optional<RiotLeagueEntryDto> findSoloRankEntry(String puuid) {
        List<RiotLeagueEntryDto> entries = riotPlatformClient.get()
                .uri("/lol/league/v4/entries/by-puuid/{puuid}", puuid)
                .retrieve()
                .body(new ParameterizedTypeReference<List<RiotLeagueEntryDto>>() {
                });

        return (entries == null ? List.<RiotLeagueEntryDto>of() : entries).stream()
                .filter(entry -> SOLO_QUEUE.equals(entry.queueType()))
                .findFirst();
    }
}
