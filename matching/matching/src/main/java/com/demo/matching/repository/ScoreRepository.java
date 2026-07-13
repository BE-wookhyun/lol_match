package com.demo.matching.repository;

import com.demo.matching.domain.Score;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScoreRepository extends JpaRepository<Score, Long> {

    Optional<Score> findFirstByStreamerSeqOrderByFetchedAtDesc(Long streamerSeq);

    Optional<Score> findByStreamerSeqAndSeason(Long streamerSeq, String season);

    List<Score> findByStreamerSeqIn(List<Long> streamerSeqs);

    void deleteByStreamerSeq(Long streamerSeq);
}
