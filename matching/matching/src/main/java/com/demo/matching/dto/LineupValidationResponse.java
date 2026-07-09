package com.demo.matching.dto;

public record LineupValidationResponse(
        boolean matched,
        String message
) {
}
