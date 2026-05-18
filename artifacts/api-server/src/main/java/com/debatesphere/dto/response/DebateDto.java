package com.debatesphere.dto.response;

import com.debatesphere.entity.Debate;
import com.debatesphere.entity.User;
import lombok.Data;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Data
public class DebateDto {
    private Long id;
    private String title;
    private String description;
    private String category;
    private List<String> tags;
    private String status;
    private Long authorId;
    private UserDto author;
    private long argumentCount;
    private long participantCount;
    private int viewCount;
    private Instant createdAt;
    private Instant updatedAt;

    public static DebateDto from(Debate debate, User author, long argumentCount, long participantCount) {
        DebateDto dto = new DebateDto();
        dto.id = debate.getId();
        dto.title = debate.getTitle();
        dto.description = debate.getDescription();
        dto.category = debate.getCategory();
        dto.tags = debate.getTags() != null ? Arrays.asList(debate.getTags()) : List.of();
        dto.status = debate.getStatus();
        dto.authorId = debate.getAuthorId();
        dto.author = author != null ? UserDto.from(author) : null;
        dto.argumentCount = argumentCount;
        dto.participantCount = participantCount;
        dto.viewCount = debate.getViewCount();
        dto.createdAt = debate.getCreatedAt();
        dto.updatedAt = debate.getUpdatedAt();
        return dto;
    }
}
