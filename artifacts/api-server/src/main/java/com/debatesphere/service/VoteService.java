package com.debatesphere.service;

import com.debatesphere.dto.request.VoteRequest;
import com.debatesphere.dto.response.VoteResultDto;
import com.debatesphere.entity.Argument;
import com.debatesphere.entity.User;
import com.debatesphere.entity.Vote;
import com.debatesphere.exception.ResourceNotFoundException;
import com.debatesphere.exception.UnauthorizedException;
import com.debatesphere.repository.ArgumentRepository;
import com.debatesphere.repository.UserRepository;
import com.debatesphere.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VoteService {

    private final VoteRepository voteRepository;
    private final ArgumentRepository argumentRepository;
    private final UserRepository userRepository;

    @Transactional
    public VoteResultDto vote(Long argumentId, Long userId, VoteRequest req) {
        Argument arg = argumentRepository.findById(argumentId)
                .orElseThrow(() -> new ResourceNotFoundException("Argument not found"));
        User argAuthor = userRepository.findById(arg.getAuthorId()).orElseThrow();

        Optional<Vote> existingOpt = voteRepository.findByUserIdAndArgumentId(userId, argumentId);

        String oldVote = existingOpt.map(Vote::getVote).orElse(null);
        String newVote = req.getVote();

        if ("none".equals(newVote)) {
            existingOpt.ifPresent(v -> {
                voteRepository.delete(v);
                adjustCounts(arg, argAuthor, v.getVote(), null);
            });
        } else if (existingOpt.isPresent()) {
            Vote vote = existingOpt.get();
            if (!vote.getVote().equals(newVote)) {
                adjustCounts(arg, argAuthor, vote.getVote(), newVote);
                vote.setVote(newVote);
                voteRepository.save(vote);
            }
        } else {
            Vote vote = new Vote();
            vote.setUserId(userId);
            vote.setArgumentId(argumentId);
            vote.setVote(newVote);
            voteRepository.save(vote);
            adjustCounts(arg, argAuthor, null, newVote);
        }

        argumentRepository.save(arg);
        userRepository.save(argAuthor);

        String resultVote = "none".equals(newVote) ? null : newVote;
        return new VoteResultDto(arg.getUpvotes(), arg.getDownvotes(), resultVote);
    }

    private void adjustCounts(Argument arg, User author, String oldVote, String newVote) {
        if ("up".equals(oldVote)) {
            arg.setUpvotes(Math.max(0, arg.getUpvotes() - 1));
            author.setReputation(Math.max(0, author.getReputation() - 1));
        } else if ("down".equals(oldVote)) {
            arg.setDownvotes(Math.max(0, arg.getDownvotes() - 1));
            author.setReputation(author.getReputation() + 1);
        }
        if ("up".equals(newVote)) {
            arg.setUpvotes(arg.getUpvotes() + 1);
            author.setReputation(author.getReputation() + 1);
        } else if ("down".equals(newVote)) {
            arg.setDownvotes(arg.getDownvotes() + 1);
            author.setReputation(Math.max(0, author.getReputation() - 1));
        }
        author.setTier(User.computeTier(author.getReputation()));
    }
}
