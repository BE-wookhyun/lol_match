package com.demo.matching.controller;

import com.demo.matching.dto.VisitCountResponse;
import com.demo.matching.service.VisitService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/visits")
public class VisitController {

    private final VisitService visitService;

    public VisitController(VisitService visitService) {
        this.visitService = visitService;
    }

    @PostMapping
    public VisitCountResponse recordVisit() {
        return visitService.incrementAndGet();
    }
}
