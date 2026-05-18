package com.debatesphere.dto.response;

import com.debatesphere.entity.User;
import lombok.Data;

import java.time.Instant;

@Data
public class UserProfileDto {
    private Long id;
    private String username;
    private String role;
    private int reputation;
    private String tier;
    private String bio;
    private long debateCount;
    private long argumentCount;
    private long totalVotesReceived;
    private Instant createdAt;

    public static UserProfileDto from(User user, long debateCount, long argumentCount, long totalVotesReceived) {
        UserProfileDto dto = new UserProfileDto();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.role = user.getRole();
        dto.reputation = user.getReputation();
        dto.tier = user.getTier();
        dto.bio = user.getBio();
        dto.debateCount = debateCount;
        dto.argumentCount = argumentCount;
        dto.totalVotesReceived = totalVotesReceived;
        dto.createdAt = user.getCreatedAt();
        return dto;
    }
}
