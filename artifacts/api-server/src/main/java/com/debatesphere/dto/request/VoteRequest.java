package com.debatesphere.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VoteRequest {
    @NotBlank
    @Pattern(regexp = "up|down|none")
    private String vote;
}
