package com.debatesphere.controller;

import com.debatesphere.dto.request.DebateRequest;
import com.debatesphere.dto.response.CategoryDto;
import com.debatesphere.dto.response.DebateDto;
import com.debatesphere.dto.response.DebateListDto;
import com.debatesphere.dto.response.JoinResponseDto;
import com.debatesphere.service.DebateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/debates")
@RequiredArgsConstructor
public class DebateController {

    private final DebateService debateService;

    @GetMapping
    public ResponseEntity<DebateListDto> listDebates(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        return ResponseEntity.ok(debateService.listDebates(category, search, sort, limit, offset));
    }

    @GetMapping("/trending")
    public ResponseEntity<List<DebateDto>> trending(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(debateService.getTrending(limit));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDto>> categories() {
        return ResponseEntity.ok(debateService.getCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DebateDto> getDebate(@PathVariable Long id) {
        return ResponseEntity.ok(debateService.getDebate(id));
    }

    @PostMapping
    public ResponseEntity<DebateDto> createDebate(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DebateRequest req) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(debateService.createDebate(userId, req));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<DebateDto> updateDebate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody DebateRequest req) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(debateService.updateDebate(id, userId, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDebate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        debateService.deleteDebate(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<JoinResponseDto> joinDebate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(debateService.joinDebate(id, userId));
    }
}
