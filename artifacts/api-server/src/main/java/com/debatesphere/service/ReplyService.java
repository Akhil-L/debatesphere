package com.debatesphere.service;

import com.debatesphere.dto.request.ReplyRequest;
import com.debatesphere.dto.response.ReplyDto;
import com.debatesphere.entity.Reply;
import com.debatesphere.entity.User;
import com.debatesphere.exception.ResourceNotFoundException;
import com.debatesphere.exception.UnauthorizedException;
import com.debatesphere.repository.ArgumentRepository;
import com.debatesphere.repository.ReplyRepository;
import com.debatesphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReplyService {

    private final ReplyRepository replyRepository;
    private final ArgumentRepository argumentRepository;
    private final UserRepository userRepository;

    public List<ReplyDto> listReplies(Long argumentId) {
        return replyRepository.findByArgumentIdOrderByCreatedAtAsc(argumentId)
                .stream()
                .map(r -> {
                    User author = userRepository.findById(r.getAuthorId()).orElse(null);
                    return ReplyDto.from(r, author);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public ReplyDto createReply(Long argumentId, Long authorId, ReplyRequest req) {
        if (!argumentRepository.existsById(argumentId)) {
            throw new ResourceNotFoundException("Argument not found");
        }
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Reply reply = new Reply();
        reply.setContent(req.getContent());
        reply.setArgumentId(argumentId);
        reply.setAuthorId(authorId);
        reply = replyRepository.save(reply);
        return ReplyDto.from(reply, author);
    }
}
