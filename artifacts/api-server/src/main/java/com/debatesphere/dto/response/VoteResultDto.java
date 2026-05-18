package com.debatesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VoteResultDto {
    private int upvotes;
    private int downvotes;
    private String userVote;
}
