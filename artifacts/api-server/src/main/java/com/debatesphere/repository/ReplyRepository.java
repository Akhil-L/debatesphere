package com.debatesphere.repository;

import com.debatesphere.entity.Reply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReplyRepository extends JpaRepository<Reply, Long> {

    List<Reply> findByArgumentIdOrderByCreatedAtAsc(Long argumentId);

    @Query("SELECT COUNT(r) FROM Reply r WHERE r.argumentId = :argumentId")
    long countByArgumentId(@Param("argumentId") Long argumentId);
}
