package com.debatesphere.repository;

import com.debatesphere.entity.Debate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DebateRepository extends JpaRepository<Debate, Long> {

    @Query("SELECT d FROM Debate d WHERE " +
           "(:category IS NULL OR d.category = :category) AND " +
           "(:search IS NULL OR LOWER(d.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(d.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Debate> findWithFilters(@Param("category") String category,
                                 @Param("search") String search,
                                 Pageable pageable);

    @Query("SELECT DISTINCT d.category FROM Debate d ORDER BY d.category")
    List<String> findDistinctCategories();

    @Query(value = "SELECT d.* FROM debates d " +
           "LEFT JOIN arguments a ON a.debate_id = d.id " +
           "GROUP BY d.id " +
           "ORDER BY COUNT(a.id) DESC, d.view_count DESC " +
           "LIMIT :limit", nativeQuery = true)
    List<Debate> findTrending(@Param("limit") int limit);

    List<Debate> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

    @Modifying
    @Query("UPDATE Debate d SET d.viewCount = d.viewCount + 1 WHERE d.id = :id")
    void incrementViewCount(@Param("id") Long id);

    @Query("SELECT COUNT(d) FROM Debate d WHERE d.status = 'active'")
    long countActive();

    @Query("SELECT COUNT(d) FROM Debate d WHERE d.authorId = :authorId")
    long countByAuthorId(@Param("authorId") Long authorId);
}
