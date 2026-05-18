package com.debatesphere.dto.response;

import com.debatesphere.entity.User;
import lombok.Data;

@Data
public class LeaderboardEntryDto {
    private int rank;
    private UserDto user;
    private int reputation;
    private String tier;
    private long debateCount;
    private long argumentCount;

    public static LeaderboardEntryDto from(User u, int rank, long debateCount, long argumentCount) {
        LeaderboardEntryDto dto = new LeaderboardEntryDto();
        dto.rank = rank;
        dto.user = UserDto.from(u);
        dto.reputation = u.getReputation();
        dto.tier = u.getTier();
        dto.debateCount = debateCount;
        dto.argumentCount = argumentCount;
        return dto;
    }
}
