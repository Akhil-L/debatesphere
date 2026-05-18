package com.debatesphere.service;

import com.debatesphere.dto.request.DebateRequest;
import com.debatesphere.dto.response.CategoryDto;
import com.debatesphere.dto.response.DebateDto;
import com.debatesphere.dto.response.DebateListDto;
import com.debatesphere.dto.response.JoinResponseDto;
import com.debatesphere.entity.Debate;
import com.debatesphere.entity.Participant;
import com.debatesphere.entity.User;
import com.debatesphere.exception.BadRequestException;
import com.debatesphere.exception.ResourceNotFoundException;
import com.debatesphere.exception.UnauthorizedException;
import com.debatesphere.repository.ArgumentRepository;
import com.debatesphere.repository.DebateRepository;
import com.debatesphere.repository.ParticipantRepository;
import com.debatesphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DebateService {

    private final DebateRepository debateRepository;
    private final UserRepository userRepository;
    private final ArgumentRepository argumentRepository;
    private final ParticipantRepository participantRepository;

    @Transactional(readOnly = true)
    public DebateListDto listDebates(String category, String search, String sort, int limit, int offset) {
        String cat = (category != null && !category.isBlank()) ? category : null;
        String q = (search != null && !search.isBlank()) ? search : null;
        int lim = limit > 0 ? limit : 20;

        boolean trending = "trending".equals(sort) || "most_active".equals(sort);
        List<Debate> debates = trending
                ? debateRepository.findWithFiltersTrending(cat, q, lim, offset)
                : debateRepository.findWithFiltersLatest(cat, q, lim, offset);
        long total = debateRepository.countWithFilters(cat, q);

        List<DebateDto> dtos = debates.stream().map(this::toDto).collect(Collectors.toList());
        return new DebateListDto(dtos, total);
    }

    @Transactional(readOnly = true)
    public List<DebateDto> getTrending(int limit) {
        return debateRepository.findTrending(limit > 0 ? limit : 5)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<CategoryDto> getCategories() {
        return debateRepository.findCategoryCountsNative().stream()
                .map(row -> new CategoryDto((String) row[0], ((Number) row[1]).longValue()))
                .collect(Collectors.toList());
    }

    @Transactional
    public DebateDto getDebate(Long id) {
        debateRepository.incrementViewCount(id);
        Debate debate = debateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Debate not found"));
        return toDto(debate);
    }

    @Transactional
    public DebateDto createDebate(Long authorId, DebateRequest req) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        Debate debate = new Debate();
        debate.setTitle(req.getTitle());
        debate.setDescription(req.getDescription());
        debate.setCategory(req.getCategory());
        debate.setTags(req.getTags() != null ? req.getTags().toArray(new String[0]) : new String[0]);
        debate.setStatus("active");
        debate.setAuthorId(authorId);
        debate = debateRepository.save(debate);

        Participant participant = new Participant();
        participant.setUserId(authorId);
        participant.setDebateId(debate.getId());
        participantRepository.save(participant);

        return toDto(debate, author);
    }

    @Transactional
    public DebateDto updateDebate(Long id, Long userId, DebateRequest req) {
        Debate debate = debateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Debate not found"));
        User requester = userRepository.findById(userId).orElseThrow();
        if (!debate.getAuthorId().equals(userId) && !requester.getRole().equals("ADMIN")) {
            throw new UnauthorizedException("Not authorized");
        }
        if (req.getTitle() != null) debate.setTitle(req.getTitle());
        if (req.getDescription() != null) debate.setDescription(req.getDescription());
        if (req.getCategory() != null) debate.setCategory(req.getCategory());
        if (req.getTags() != null) debate.setTags(req.getTags().toArray(new String[0]));
        if (req.getStatus() != null) debate.setStatus(req.getStatus());
        debate = debateRepository.save(debate);
        return toDto(debate);
    }

    @Transactional
    public void deleteDebate(Long id, Long userId) {
        Debate debate = debateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Debate not found"));
        User requester = userRepository.findById(userId).orElseThrow();
        if (!debate.getAuthorId().equals(userId) && !requester.getRole().equals("ADMIN")) {
            throw new UnauthorizedException("Not authorized");
        }
        debateRepository.delete(debate);
    }

    @Transactional
    public JoinResponseDto joinDebate(Long debateId, Long userId) {
        if (!debateRepository.existsById(debateId)) {
            throw new ResourceNotFoundException("Debate not found");
        }
        if (!participantRepository.existsByUserIdAndDebateId(userId, debateId)) {
            Participant p = new Participant();
            p.setUserId(userId);
            p.setDebateId(debateId);
            participantRepository.save(p);
        }
        long count = participantRepository.countByDebateId(debateId);
        return new JoinResponseDto(debateId, count);
    }

    public List<DebateDto> getUserDebates(Long userId) {
        return debateRepository.findByAuthorIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    private DebateDto toDto(Debate debate) {
        User author = userRepository.findById(debate.getAuthorId()).orElse(null);
        return toDto(debate, author);
    }

    private DebateDto toDto(Debate debate, User author) {
        long argCount = argumentRepository.countByDebateId(debate.getId());
        long partCount = participantRepository.countByDebateId(debate.getId());
        return DebateDto.from(debate, author, argCount, partCount);
    }
}
