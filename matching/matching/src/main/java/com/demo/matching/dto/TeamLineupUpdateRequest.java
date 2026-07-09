package com.demo.matching.dto;

import com.demo.matching.domain.Line;
import jakarta.validation.constraints.NotEmpty;
import java.util.Map;

public record TeamLineupUpdateRequest(
        @NotEmpty Map<Line, String> lineup,
        boolean forceLineMismatch
) {
}
