package com.demo.matching.service;

import com.demo.matching.domain.VisitCounter;
import com.demo.matching.dto.VisitCountResponse;
import com.demo.matching.repository.VisitCounterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VisitService {

    private static final long COUNTER_ID = 1L;

    private final VisitCounterRepository visitCounterRepository;

    public VisitService(VisitCounterRepository visitCounterRepository) {
        this.visitCounterRepository = visitCounterRepository;
    }

    @Transactional
    public VisitCountResponse incrementAndGet() {
        visitCounterRepository.increment(COUNTER_ID);
        VisitCounter counter = visitCounterRepository.findById(COUNTER_ID).orElseThrow();
        return new VisitCountResponse(counter.getCount());
    }
}
