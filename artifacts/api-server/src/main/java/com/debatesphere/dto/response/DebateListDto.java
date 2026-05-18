package com.debatesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class DebateListDto {
    private List<DebateDto> debates;
    private long total;
}
