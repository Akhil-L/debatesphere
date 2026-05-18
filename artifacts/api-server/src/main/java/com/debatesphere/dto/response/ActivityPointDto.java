package com.debatesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ActivityPointDto {
    private String date;
    private long debates;
    private long arguments;
    private long votes;
}
