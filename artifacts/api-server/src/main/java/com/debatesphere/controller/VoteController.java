package com.debatesphere.controller;

import com.debatesphere.dto.request.VoteRequest;
import com.debatesphere.dto.response.VoteResultDto;
import com.debatesphere.service.VoteService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/votes")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    @PostMapping("/argument/{id}")
    public ResponseEntity<VoteResultDto> vote(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VoteRequest req,
            HttpServletRequest request) {
        Long userId = userDetails != null ? Long.parseLong(userDetails.getUsername()) : null;
        String ipAddress = getClientIp(request);
        return ResponseEntity.ok(voteService.vote(id, userId, ipAddress, req));
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}