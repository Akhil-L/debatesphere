package com.debatesphere.controller;

import com.debatesphere.dto.request.ArgumentRequest;
import com.debatesphere.dto.request.ReplyRequest;
import com.debatesphere.dto.response.ArgumentDto;
import com.debatesphere.dto.response.ReplyDto;
import com.debatesphere.service.ArgumentService;
import com.debatesphere.service.ReplyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ArgumentController {

    private final ArgumentService argumentService;
    private final ReplyService replyService;

    @GetMapping("/debates/{id}/arguments")
    public ResponseEntity<List<ArgumentDto>> listArguments(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userDetails != null ? Long.parseLong(userDetails.getUsername()) : null;
        return ResponseEntity.ok(argumentService.listArguments(id, userId));
    }

    @PostMapping("/debates/{id}/arguments")
    public ResponseEntity<ArgumentDto> createArgument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ArgumentRequest req) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(argumentService.createArgument(id, userId, req));
    }

    @PatchMapping("/arguments/{id}")
    public ResponseEntity<ArgumentDto> updateArgument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ArgumentRequest req) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(argumentService.updateArgument(id, userId, req));
    }

    @DeleteMapping("/arguments/{id}")
    public ResponseEntity<Void> deleteArgument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        argumentService.deleteArgument(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/arguments/{id}/replies")
    public ResponseEntity<List<ReplyDto>> listReplies(@PathVariable Long id) {
        return ResponseEntity.ok(replyService.listReplies(id));
    }

    @PostMapping("/arguments/{id}/replies")
    public ResponseEntity<ReplyDto> createReply(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ReplyRequest req) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(replyService.createReply(id, userId, req));
    }
}
