package com.debatesphere.controller;

import com.debatesphere.dto.response.*;
import com.debatesphere.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<AnalyticsDashboardDto> dashboard() {
        return ResponseEntity.ok(analyticsService.getDashboard());
    }

    @GetMapping("/trending-categories")
    public ResponseEntity<List<TrendingCategoryDto>> trendingCategories() {
        return ResponseEntity.ok(analyticsService.getTrendingCategories());
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntryDto>> leaderboard(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(analyticsService.getLeaderboard(limit));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<ActivityPointDto>> activity() {
        return ResponseEntity.ok(analyticsService.getActivityTimeline());
    }
}
