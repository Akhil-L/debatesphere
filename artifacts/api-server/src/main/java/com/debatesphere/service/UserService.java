package com.debatesphere.service;

import com.debatesphere.dto.response.UserProfileDto;
import com.debatesphere.entity.User;
import com.debatesphere.exception.ResourceNotFoundException;
import com.debatesphere.repository.ArgumentRepository;
import com.debatesphere.repository.DebateRepository;
import com.debatesphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final DebateRepository debateRepository;
    private final ArgumentRepository argumentRepository;

    public UserProfileDto getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        long debateCount = debateRepository.countByAuthorId(id);
        long argumentCount = argumentRepository.countByAuthorId(id);
        long totalVotesReceived = argumentRepository.sumUpvotesByAuthorId(id);
        return UserProfileDto.from(user, debateCount, argumentCount, totalVotesReceived);
    }
}
