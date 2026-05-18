package com.debatesphere.repository;

import com.debatesphere.entity.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    Optional<Participant> findByUserIdAndDebateId(Long userId, Long debateId);

    @Query("SELECT COUNT(p) FROM Participant p WHERE p.debateId = :debateId")
    long countByDebateId(@Param("debateId") Long debateId);

    boolean existsByUserIdAndDebateId(Long userId, Long debateId);
}
