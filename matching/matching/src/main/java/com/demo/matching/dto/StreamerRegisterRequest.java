package com.demo.matching.dto;

import com.demo.matching.domain.Line;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StreamerRegisterRequest(
        @NotBlank String streamerName,
        @NotBlank String streamerId,
        @NotBlank String lolId,
        @NotBlank String lolTag,
        @NotNull Line line,
        String soopChannelId
) {
}
