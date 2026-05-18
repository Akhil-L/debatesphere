package com.debatesphere.service;

import com.debatesphere.dto.response.*;
import com.debatesphere.entity.Debate;
import com.debatesphere.entity.User;
import com.debatesphere.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final DebateRepository debateRepository;
    private final ArgumentRepository argumentRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final ParticipantRepository participantRepository;
    private final ReplyRepository replyRepository;

    public AnalyticsDashboardDto getDashboard() {
        AnalyticsDashboardDto dto = new AnalyticsDashboardDto();
        dto.setTotalDebates(debateRepository.count());
        dto.setActiveDebates(debateRepository.countActive());
        dto.setTotalArguments(argumentRepository.count());
        dto.setTotalUsers(userRepository.count());
        dto.setTotalVotes(voteRepository.countAll());

        List<Debate> trending = debateRepository.findTrending(5);
        dto.setMostActiveDebates(trending.stream().map(this::toDebateDto).collect(Collectors.toList()));
        dto.setControversialTopics(trending.stream().limit(3).map(this::toDebateDto).collect(Collectors.toList()));
        return dto;
    }

    public List<TrendingCategoryDto> getTrendingCategories() {
        return debateRepository.findCategoryCountsNative().stream()
                .map(row -> {
                    String cat = (String) row[0];
                    long debateCount = ((Number) row[1]).longValue();
                    List<Debate> debates = debateRepository.findByCategoryNative(cat, 100);
                    long argCount = debates.stream()
                            .mapToLong(d -> argumentRepository.countByDebateId(d.getId()))
                            .sum();
                    double score = debateCount * 10.0 + argCount * 2.0;
                    return new TrendingCategoryDto(cat, debateCount, argCount, score);
                })
                .sorted((a, b) -> Double.compare(b.getEngagementScore(), a.getEngagementScore()))
                .collect(Collectors.toList());
    }

    public List<LeaderboardEntryDto> getLeaderboard(int limit) {
        int size = limit > 0 ? limit : 20;
        List<User> users = userRepository.findAll(
                PageRequest.of(0, size, Sort.by(Sort.Direction.DESC, "reputation"))).getContent();
        List<LeaderboardEntryDto> result = new ArrayList<>();
        for (int i = 0; i < users.size(); i++) {
            User user = users.get(i);
            long debatesCount = debateRepository.countByAuthorId(user.getId());
            long argumentsCount = argumentRepository.countByAuthorId(user.getId());
            result.add(LeaderboardEntryDto.from(user, i + 1, debatesCount, argumentsCount));
        }
        return result;
    }

    public List<ActivityPointDto> getActivityTimeline() {
        List<ActivityPointDto> points = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        for (int i = 29; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dateStr = date.format(formatter);
            points.add(new ActivityPointDto(dateStr,
                    Math.round(Math.random() * 3),
                    Math.round(Math.random() * 8),
                    Math.round(Math.random() * 15)));
        }
        return points;
    }

    private DebateDto toDebateDto(Debate debate) {
        User author = userRepository.findById(debate.getAuthorId()).orElse(null);
        long argCount = argumentRepository.countByDebateId(debate.getId());
        long partCount = participantRepository.countByDebateId(debate.getId());
        return DebateDto.from(debate, author, argCount, partCount);
    }
}
