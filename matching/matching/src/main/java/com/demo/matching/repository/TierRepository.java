package com.demo.matching.repository;

import com.demo.matching.domain.Tier;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TierRepository extends JpaRepository<Tier, Long> {

    Optional<Tier> findFirstByStreamerSeqOrderByFetchedAtDesc(Long streamerSeq);

    List<Tier> findByStreamerSeqIn(List<Long> streamerSeqs);

    void deleteByStreamerSeq(Long streamerSeq);
}
