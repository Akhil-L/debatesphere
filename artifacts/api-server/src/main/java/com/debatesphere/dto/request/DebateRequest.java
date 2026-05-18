package com.debatesphere.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class DebateRequest {
    @NotBlank
    @Size(min = 10)
    private String title;

    @NotBlank
    @Size(min = 20)
    private String description;

    @NotBlank
    private String category;

    private List<String> tags;

    private String status;
}
