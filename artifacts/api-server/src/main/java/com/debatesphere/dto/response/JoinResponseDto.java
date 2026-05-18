package com.debatesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JoinResponseDto {
    private Long debateId;
    private long participantCount;
}
