package com.demo.matching.service;

import com.demo.matching.domain.Line;
import com.demo.matching.domain.LolDivision;
import com.demo.matching.domain.LolTier;
import com.demo.matching.domain.Streamer;
import com.demo.matching.domain.Tier;
import com.demo.matching.dto.StreamerRegisterRequest;
import com.demo.matching.dto.StreamerResponse;
import com.demo.matching.repository.StreamerRepository;
import com.demo.matching.repository.TierRepository;
import com.demo.matching.riot.RiotAccountDto;
import com.demo.matching.riot.RiotApiService;
import com.demo.matching.riot.RiotLeagueEntryDto;
import com.demo.matching.riot.RiotProperties;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class StreamerService {

    private static final Comparator<StreamerResponse> TIER_RANK_COMPARATOR = Comparator
            .comparing(StreamerResponse::tier, Comparator.nullsLast(Comparator.comparing(LolTier::ordinal)))
            .thenComparing(StreamerResponse::division, Comparator.nullsLast(Comparator.comparing(LolDivision::ordinal)))
            .thenComparing(StreamerResponse::lp, Comparator.nullsLast(Comparator.reverseOrder()));

    private final StreamerRepository streamerRepository;
    private final TierRepository tierRepository;
    private final RiotApiService riotApiService;
    private final RiotProperties riotProperties;

    public StreamerService(StreamerRepository streamerRepository, TierRepository tierRepository,
                            RiotApiService riotApiService, RiotProperties riotProperties) {
        this.streamerRepository = streamerRepository;
        this.tierRepository = tierRepository;
        this.riotApiService = riotApiService;
        this.riotProperties = riotProperties;
    }

    @Transactional
    public StreamerResponse register(StreamerRegisterRequest request) {
        if (streamerRepository.existsByLolIdAndLolTag(request.lolId(), request.lolTag())) {
            throw new DuplicateStreamerException(request.lolId(), request.lolTag());
        }
        if (streamerRepository.existsByStreamerId(request.streamerId())) {
            throw new DuplicateStreamerException(request.streamerId());
        }

        RiotAccountDto account = riotApiService.fetchAccount(request.lolId(), request.lolTag());
        RiotLeagueEntryDto soloRankEntry = riotApiService.fetchSoloRankEntry(
                account.puuid(), request.lolId(), request.lolTag());

        String streamerId = request.streamerId();
        String idPrefix = streamerId.substring(0, Math.min(2, streamerId.length()));
        String imgParsing = "https://stimg.sooplive.com/LOGO/" + idPrefix + "/" + streamerId + "/m/" + streamerId + ".webp";

        Streamer streamer = Streamer.builder()
                .streamerName(request.streamerName())
                .streamerId(request.streamerId())
                .streamerIconUrl(imgParsing)
                .lolId(request.lolId())
                .lolTag(request.lolTag())
                .line(request.line())
                .soopChannelId(request.soopChannelId())
                .build();
        streamerRepository.save(streamer);

        Tier tier = Tier.builder()
                .streamerSeq(streamer.getSeq())
                .lolTier(LolTier.valueOf(soloRankEntry.tier()))
                .lolRank(LolDivision.valueOf(soloRankEntry.rank()))
                .lp(soloRankEntry.leaguePoints())
                .season(riotProperties.getSeason())
                .build();
        tierRepository.save(tier);

        return StreamerResponse.of(streamer, tier);
    }

    public StreamerResponse findBySeq(Long seq) {
        Streamer streamer = streamerRepository.findById(seq)
                .orElseThrow(() -> new StreamerNotFoundException(seq));
        Tier tier = tierRepository.findFirstByStreamerSeqOrderByFetchedAtDesc(seq).orElse(null);
        return StreamerResponse.of(streamer, tier);
    }

    @Transactional
    public void delete(Long seq) {
        if (!streamerRepository.existsById(seq)) {
            throw new StreamerNotFoundException(seq);
        }
        tierRepository.deleteByStreamerSeq(seq);
        streamerRepository.deleteById(seq);
    }

    public List<StreamerResponse> findAll(LolTier tierFilter, Line lineFilter) {
        List<Streamer> streamers = streamerRepository.findAll();

        Map<Long, Tier> tierByStreamerSeq = tierRepository
                .findByStreamerSeqIn(streamers.stream().map(Streamer::getSeq).toList())
                .stream()
                .collect(Collectors.toMap(Tier::getStreamerSeq, t -> t, (a, b) -> a));

        return streamers.stream()
                .map(streamer -> StreamerResponse.of(streamer, tierByStreamerSeq.get(streamer.getSeq())))
                .filter(response -> tierFilter == null || tierFilter.equals(response.tier()))
                .filter(response -> lineFilter == null || lineFilter.equals(response.line()))
                .sorted(TIER_RANK_COMPARATOR)
                .toList();
    }
}
