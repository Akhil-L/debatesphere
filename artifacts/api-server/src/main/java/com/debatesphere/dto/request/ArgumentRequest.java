package com.debatesphere.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ArgumentRequest {
    @NotBlank
    @Size(min = 10)
    private String content;

    @NotBlank
    @Pattern(regexp = "for|against|neutral")
    private String stance;
}
