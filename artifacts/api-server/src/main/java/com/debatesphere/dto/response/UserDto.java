package com.debatesphere.dto.response;

import com.debatesphere.entity.User;
import lombok.Data;

import java.time.Instant;

@Data
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String role;
    private int reputation;
    private String tier;
    private String bio;
    private Instant createdAt;

    public static UserDto from(User user) {
        UserDto dto = new UserDto();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.email = user.getEmail();
        dto.role = user.getRole();
        dto.reputation = user.getReputation();
        dto.tier = user.getTier();
        dto.bio = user.getBio();
        dto.createdAt = user.getCreatedAt();
        return dto;
    }
}
