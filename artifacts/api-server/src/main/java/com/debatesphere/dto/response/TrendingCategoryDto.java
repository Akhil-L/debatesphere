package com.debatesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TrendingCategoryDto {
    private String name;
    private long debateCount;
    private long argumentCount;
    private double engagementScore;
}
