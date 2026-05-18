package com.debatesphere.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class AnalyticsDashboardDto {
    private long totalDebates;
    private long activeDebates;
    private long totalArguments;
    private long totalUsers;
    private long totalVotes;
    private List<DebateDto> mostActiveDebates;
    private List<DebateDto> controversialTopics;
}
