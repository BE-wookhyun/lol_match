package com.demo.matching.service;

import com.demo.matching.crawling.CrawlingApiService;
import com.demo.matching.crawling.CrawlingProperties;
import com.demo.matching.crawling.FaEntryDto;
import com.demo.matching.domain.Line;
import com.demo.matching.domain.Score;
import com.demo.matching.domain.Streamer;
import com.demo.matching.repository.ScoreRepository;
import com.demo.matching.repository.StreamerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FaCrawlSyncService {

    private static final Logger log = LoggerFactory.getLogger(FaCrawlSyncService.class);

    private final CrawlingApiService crawlingApiService;
    private final CrawlingProperties crawlingProperties;
    private final StreamerRepository streamerRepository;
    private final ScoreRepository scoreRepository;

    public FaCrawlSyncService(CrawlingApiService crawlingApiService, CrawlingProperties crawlingProperties,
                               StreamerRepository streamerRepository, ScoreRepository scoreRepository) {
        this.crawlingApiService = crawlingApiService;
        this.crawlingProperties = crawlingProperties;
        this.streamerRepository = streamerRepository;
        this.scoreRepository = scoreRepository;
    }

    @Transactional
    public void syncFaList() {
        String season = crawlingProperties.getSeason();
        for (FaEntryDto entry : crawlingApiService.fetchFaList(season)) {
            try {
                syncEntry(entry, season);
            } catch (Exception e) {
                log.warn("FA 항목 저장 실패: streamerId={}, message={}", entry.streamerId(), e.getMessage());
            }
        }
    }

    private void syncEntry(FaEntryDto entry, String season) {
        Line line = Line.valueOf(entry.position());

        Streamer streamer = streamerRepository.findByStreamerId(entry.streamerId())
                .orElseGet(() -> streamerRepository.save(createStreamer(entry, line)));
        streamer.updateFromCrawl(entry.streamerName(), entry.lolId(), entry.lolTag(), line);

        Score score = scoreRepository.findByStreamerSeqAndSeason(streamer.getSeq(), season)
                .orElseGet(() -> Score.builder()
                        .streamerSeq(streamer.getSeq())
                        .peakTier(entry.peakTier())
                        .score(entry.score())
                        .scoreAdjustment(entry.scoreAdjustment())
                        .line(line)
                        .season(season)
                        .build());
        score.updateFromCrawl(entry.peakTier(), entry.score(), entry.scoreAdjustment(), line);
        scoreRepository.save(score);
    }

    private Streamer createStreamer(FaEntryDto entry, Line line) {
        String streamerId = entry.streamerId();
        String idPrefix = streamerId.substring(0, Math.min(2, streamerId.length()));
        String iconUrl = "https://stimg.sooplive.com/LOGO/" + idPrefix + "/" + streamerId + "/m/" + streamerId + ".webp";

        return Streamer.builder()
                .streamerName(entry.streamerName())
                .streamerId(streamerId)
                .streamerIconUrl(iconUrl)
                .lolId(entry.lolId())
                .lolTag(entry.lolTag())
                .line(line)
                .build();
    }
}
