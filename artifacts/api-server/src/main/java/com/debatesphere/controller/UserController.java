package com.debatesphere.controller;

import com.debatesphere.dto.request.UpdateProfileRequest;
import com.debatesphere.dto.response.DebateDto;
import com.debatesphere.dto.response.UserProfileDto;
import com.debatesphere.security.UserPrincipal;
import com.debatesphere.service.DebateService;
import com.debatesphere.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final DebateService debateService;

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @GetMapping("/{id}/debates")
    public ResponseEntity<List<DebateDto>> getUserDebates(@PathVariable Long id) {
        return ResponseEntity.ok(debateService.getUserDebates(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserProfileDto> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.updateUser(id, request, principal.getId()));
    }
}