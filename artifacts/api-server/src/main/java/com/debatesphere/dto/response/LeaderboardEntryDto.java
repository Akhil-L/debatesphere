package com.debatesphere.dto.response;

import com.debatesphere.entity.User;
import lombok.Data;

import java.time.Instant;

@Data
public class LeaderboardEntryDto {
    private Long id;
    private String username;
    private String role;
    private int reputation;
    private String tier;
    private String bio;
    private Instant createdAt;
    private int rank;
    private long debatesCount;
    private long argumentsCount;

    public static LeaderboardEntryDto from(User user, int rank, long debatesCount, long argumentsCount) {
        LeaderboardEntryDto dto = new LeaderboardEntryDto();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.role = user.getRole();
        dto.reputation = user.getReputation();
        dto.tier = user.getTier();
        dto.bio = user.getBio();
        dto.createdAt = user.getCreatedAt();
        dto.rank = rank;
        dto.debatesCount = debatesCount;
        dto.argumentsCount = argumentsCount;
        return dto;
    }
}
