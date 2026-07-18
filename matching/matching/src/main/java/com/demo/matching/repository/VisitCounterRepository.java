package com.demo.matching.repository;

import com.demo.matching.domain.VisitCounter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface VisitCounterRepository extends JpaRepository<VisitCounter, Long> {

    @Modifying
    @Query(value = "INSERT INTO visit_counter (id, count) VALUES (:id, 1) "
            + "ON CONFLICT (id) DO UPDATE SET count = visit_counter.count + 1", nativeQuery = true)
    void increment(long id);
}
