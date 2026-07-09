package com.demo.matching.dto;

import com.demo.matching.domain.Line;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.Map;

public record TeamCreateRequest(
        @NotBlank String teamName,
        @NotBlank String captainStreamerName,
        @NotEmpty Map<Line, String> lineup,
        boolean forceLineMismatch
) {
}
