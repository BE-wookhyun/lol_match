package com.demo.matching.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record TeamMatchResultRequest(
        @NotBlank String teamName,
        @NotBlank String opponentTeamName,
        @Min(0) int wins,
        @Min(0) int losses
) {
}
