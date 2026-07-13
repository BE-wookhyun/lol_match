package com.demo.matching.controller;

import com.demo.matching.domain.Line;
import com.demo.matching.domain.LolTier;
import com.demo.matching.dto.StreamerRegisterRequest;
import com.demo.matching.dto.StreamerResponse;
import com.demo.matching.service.FaCrawlSyncService;
import com.demo.matching.service.StreamerService;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/streamers")
public class StreamerController {

    private final StreamerService streamerService;
    private final FaCrawlSyncService faCrawlSyncService;

    public StreamerController(StreamerService streamerService, FaCrawlSyncService faCrawlSyncService) {
        this.streamerService = streamerService;
        this.faCrawlSyncService = faCrawlSyncService;
    }

    @PostMapping
    public ResponseEntity<StreamerResponse> register(@Valid @RequestBody StreamerRegisterRequest request) {
        StreamerResponse response = streamerService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/crawl")
    public ResponseEntity<Map<String, Integer>> crawl() {
        int count = faCrawlSyncService.syncFaList();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/{seq}")
    public StreamerResponse findOne(@PathVariable Long seq) {
        return streamerService.findBySeq(seq);
    }

    @DeleteMapping("/{seq}")
    public ResponseEntity<Void> delete(@PathVariable Long seq) {
        streamerService.delete(seq);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Object> findAll(
            @RequestParam(required = false) LolTier tier,
            @RequestParam(required = false) Line line,
            @RequestParam(required = false) String groupBy
    ) {
        List<StreamerResponse> streamers = streamerService.findAll(tier, line);

        if ("tier".equalsIgnoreCase(groupBy)) {
            return ResponseEntity.ok(groupOrdered(streamers, StreamerResponse::tier, LolTier.values()));
        }
        if ("line".equalsIgnoreCase(groupBy)) {
            return ResponseEntity.ok(groupOrdered(streamers, StreamerResponse::line, Line.values()));
        }
        return ResponseEntity.ok(streamers);
    }

    private <K> Map<K, List<StreamerResponse>> groupOrdered(
            List<StreamerResponse> streamers, java.util.function.Function<StreamerResponse, K> keyFn, K[] keyOrder
    ) {
        Map<K, List<StreamerResponse>> grouped = streamers.stream()
                .filter(s -> keyFn.apply(s) != null)
                .collect(Collectors.groupingBy(keyFn, LinkedHashMap::new, Collectors.toList()));

        Map<K, List<StreamerResponse>> ordered = new LinkedHashMap<>();
        for (K key : keyOrder) {
            if (grouped.containsKey(key)) {
                ordered.put(key, grouped.get(key));
            }
        }
        return ordered;
    }
}
