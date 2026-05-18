package com.debatesphere.dto.response;

import com.debatesphere.entity.Argument;
import com.debatesphere.entity.User;
import lombok.Data;

import java.time.Instant;

@Data
public class ArgumentDto {
    private Long id;
    private String content;
    private Long debateId;
    private Long authorId;
    private UserDto author;
    private int upvotes;
    private int downvotes;
    private long replyCount;
    private String stance;
    private String userVote;
    private boolean isFlagged;
    private Instant createdAt;
    private Instant updatedAt;

    public static ArgumentDto from(Argument arg, User author, long replyCount, String userVote) {
        ArgumentDto dto = new ArgumentDto();
        dto.id = arg.getId();
        dto.content = arg.getContent();
        dto.debateId = arg.getDebateId();
        dto.authorId = arg.getAuthorId();
        dto.author = author != null ? UserDto.from(author) : null;
        dto.upvotes = arg.getUpvotes();
        dto.downvotes = arg.getDownvotes();
        dto.replyCount = replyCount;
        dto.stance = arg.getStance();
        dto.userVote = userVote;
        dto.isFlagged = arg.isFlagged();
        dto.createdAt = arg.getCreatedAt();
        dto.updatedAt = arg.getUpdatedAt();
        return dto;
    }
}
