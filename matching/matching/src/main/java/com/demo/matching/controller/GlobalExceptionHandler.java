package com.demo.matching.controller;

import com.demo.matching.riot.RiotAccountNotFoundException;
import com.demo.matching.riot.RiotRankedDataNotFoundException;
import com.demo.matching.service.DuplicateStreamerException;
import com.demo.matching.service.InvalidLineupException;
import com.demo.matching.service.StreamerNotFoundException;
import com.demo.matching.service.TeamNotFoundException;
import java.time.LocalDateTime;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(StreamerNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(RuntimeException ex) {
        log.warn("Streamer not found: {}", ex.getMessage());
        return body(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(TeamNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleTeamNotFound(RuntimeException ex) {
        log.warn("Team not found: {}", ex.getMessage());
        return body(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InvalidLineupException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidLineup(RuntimeException ex) {
        log.warn("Invalid lineup: {}", ex.getMessage());
        return body(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(RiotAccountNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleRiotAccountNotFound(RuntimeException ex) {
        log.warn("Riot account not found: {}", ex.getMessage());
        return body(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(RiotRankedDataNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleRiotRankedDataNotFound(RuntimeException ex) {
        log.warn("Riot ranked data not found: {}", ex.getMessage());
        return body(HttpStatus.UNPROCESSABLE_CONTENT, ex.getMessage());
    }

    @ExceptionHandler(DuplicateStreamerException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicate(RuntimeException ex) {
        log.warn("Duplicate streamer: {}", ex.getMessage());
        return body(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .reduce((a, b) -> a + ", " + b)
                .orElse("잘못된 요청입니다.");
        log.warn("Validation failed: {}", message);
        return body(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");
    }

    private ResponseEntity<Map<String, Object>> body(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status.value(),
                "message", message
        ));
    }
}
