package com.debatesphere.service;

import com.debatesphere.dto.request.ArgumentRequest;
import com.debatesphere.dto.response.ArgumentDto;
import com.debatesphere.entity.Argument;
import com.debatesphere.entity.User;
import com.debatesphere.exception.ResourceNotFoundException;
import com.debatesphere.exception.UnauthorizedException;
import com.debatesphere.repository.ArgumentRepository;
import com.debatesphere.repository.DebateRepository;
import com.debatesphere.repository.ReplyRepository;
import com.debatesphere.repository.UserRepository;
import com.debatesphere.repository.VoteRepository;
import com.debatesphere.websocket.DebateWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArgumentService {

    private final ArgumentRepository argumentRepository;
    private final DebateRepository debateRepository;
    private final UserRepository userRepository;
    private final ReplyRepository replyRepository;
    private final VoteRepository voteRepository;
    private final DebateWebSocketHandler webSocketHandler;

    public List<ArgumentDto> listArguments(Long debateId, Long currentUserId) {
        return argumentRepository.findByDebateIdOrderByCreatedAtAsc(debateId)
                .stream()
                .map(a -> toDto(a, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional
    public ArgumentDto createArgument(Long debateId, Long authorId, ArgumentRequest req) {
        if (!debateRepository.existsById(debateId)) {
            throw new ResourceNotFoundException("Debate not found");
        }
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Argument arg = new Argument();
        arg.setContent(req.getContent());
        arg.setDebateId(debateId);
        arg.setAuthorId(authorId);
        arg.setStance(req.getStance());
        arg = argumentRepository.save(arg);

        ArgumentDto dto = toDto(arg, author, 0, null);
        webSocketHandler.broadcastToDebate(debateId, "new_argument", dto);
        return dto;
    }

    @Transactional
    public ArgumentDto updateArgument(Long id, Long userId, ArgumentRequest req) {
        Argument arg = argumentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Argument not found"));
        if (!arg.getAuthorId().equals(userId)) {
            throw new UnauthorizedException("Not authorized");
        }
        if (req.getContent() != null) arg.setContent(req.getContent());
        arg = argumentRepository.save(arg);
        return toDto(arg, null);
    }

    @Transactional
    public void deleteArgument(Long id, Long userId) {
        Argument arg = argumentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Argument not found"));
        User requester = userRepository.findById(userId).orElseThrow();
        if (!arg.getAuthorId().equals(userId) && !requester.getRole().equals("ADMIN")) {
            throw new UnauthorizedException("Not authorized");
        }
        argumentRepository.delete(arg);
    }

    private ArgumentDto toDto(Argument arg, Long currentUserId) {
        User author = userRepository.findById(arg.getAuthorId()).orElse(null);
        return toDto(arg, author, currentUserId);
    }

    private ArgumentDto toDto(Argument arg, User author, Long currentUserId) {
        long replyCount = replyRepository.countByArgumentId(arg.getId());
        String userVote = null;
        if (currentUserId != null) {
            userVote = voteRepository.findByUserIdAndArgumentId(currentUserId, arg.getId())
                    .map(v -> v.getVote()).orElse(null);
        }
        return ArgumentDto.from(arg, author, replyCount, userVote);
    }

    private ArgumentDto toDto(Argument arg, User author, long replyCount, String userVote) {
        return ArgumentDto.from(arg, author, replyCount, userVote);
    }
}
