package com.demo.matching.repository;

import com.demo.matching.domain.TeamCheer;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TeamCheerRepository extends JpaRepository<TeamCheer, String> {

    @Modifying
    @Query(value = "INSERT INTO team_cheers (ip_address, team_seq, updated_at) VALUES (:ipAddress, :teamSeq, now()) "
            + "ON CONFLICT (ip_address) DO UPDATE SET team_seq = :teamSeq, updated_at = now()", nativeQuery = true)
    void upsertVote(@Param("ipAddress") String ipAddress, @Param("teamSeq") Long teamSeq);

    @Query("select c.teamSeq as teamSeq, count(c) as cheerCount from TeamCheer c group by c.teamSeq")
    List<TeamCheerCountProjection> countGroupedByTeam();
}
