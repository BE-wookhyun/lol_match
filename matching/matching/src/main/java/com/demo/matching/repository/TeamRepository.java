package com.demo.matching.repository;

import com.demo.matching.domain.Team;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {

    List<Team> findAllByOrderByCreatedAtDesc();

    List<Team> findAllByVisibleTrueOrderByCreatedAtDesc();

    Optional<Team> findByTeamName(String teamName);
}
