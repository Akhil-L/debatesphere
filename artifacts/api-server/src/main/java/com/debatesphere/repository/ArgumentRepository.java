package com.debatesphere.repository;

import com.debatesphere.entity.Argument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArgumentRepository extends JpaRepository<Argument, Long> {

    List<Argument> findByDebateIdOrderByCreatedAtAsc(Long debateId);

    @Query("SELECT COUNT(a) FROM Argument a WHERE a.debateId = :debateId")
    long countByDebateId(@Param("debateId") Long debateId);

    @Query("SELECT COUNT(a) FROM Argument a WHERE a.authorId = :authorId")
    long countByAuthorId(@Param("authorId") Long authorId);

    @Query("SELECT COALESCE(SUM(a.upvotes), 0) FROM Argument a WHERE a.authorId = :authorId")
    long sumUpvotesByAuthorId(@Param("authorId") Long authorId);
}
