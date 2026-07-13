package com.demo.matching.repository;

import com.demo.matching.domain.Streamer;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StreamerRepository extends JpaRepository<Streamer, Long> {

    Optional<Streamer> findByLolIdAndLolTag(String lolId, String lolTag);

    Optional<Streamer> findByStreamerName(String streamerName);

    Optional<Streamer> findByStreamerId(String streamerId);

    boolean existsByLolIdAndLolTag(String lolId, String lolTag);

    boolean existsByStreamerId(String streamerId);
}
