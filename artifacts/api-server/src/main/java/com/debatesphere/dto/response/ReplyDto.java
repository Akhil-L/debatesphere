package com.debatesphere.dto.response;

import com.debatesphere.entity.Reply;
import com.debatesphere.entity.User;
import lombok.Data;

import java.time.Instant;

@Data
public class ReplyDto {
    private Long id;
    private String content;
    private Long argumentId;
    private Long authorId;
    private UserDto author;
    private int upvotes;
    private Instant createdAt;

    public static ReplyDto from(Reply reply, User author) {
        ReplyDto dto = new ReplyDto();
        dto.id = reply.getId();
        dto.content = reply.getContent();
        dto.argumentId = reply.getArgumentId();
        dto.authorId = reply.getAuthorId();
        dto.author = author != null ? UserDto.from(author) : null;
        dto.upvotes = reply.getUpvotes();
        dto.createdAt = reply.getCreatedAt();
        return dto;
    }
}
