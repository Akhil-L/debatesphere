package com.debatesphere.repository;

import com.debatesphere.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {

    Optional<Vote> findByUserIdAndArgumentId(Long userId, Long argumentId);

    Optional<Vote> findByIpAddressAndArgumentId(String ipAddress, Long argumentId);

    @Query("SELECT COUNT(v) FROM Vote v")
    long countAll();
}