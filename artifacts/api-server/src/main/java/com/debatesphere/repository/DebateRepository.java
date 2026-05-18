package com.debatesphere.repository;

import com.debatesphere.entity.Debate;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DebateRepository extends JpaRepository<Debate, Long> {

    // --- filter + sort for Latest (created_at DESC) ---
    @Query(value = "SELECT * FROM debates d WHERE " +
                   "(:category IS NULL OR d.category = :category) AND " +
                   "(:search IS NULL OR d.title ILIKE '%' || CAST(:search AS text) || '%' " +
                   "  OR d.description ILIKE '%' || CAST(:search AS text) || '%') " +
                   "ORDER BY d.created_at DESC LIMIT :lim OFFSET :off",
           nativeQuery = true)
    List<Debate> findWithFiltersLatest(@Param("category") String category,
                                       @Param("search") String search,
                                       @Param("lim") int lim,
                                       @Param("off") int off);

    // --- filter + sort for Trending / Most Active (view_count DESC) ---
    @Query(value = "SELECT * FROM debates d WHERE " +
                   "(:category IS NULL OR d.category = :category) AND " +
                   "(:search IS NULL OR d.title ILIKE '%' || CAST(:search AS text) || '%' " +
                   "  OR d.description ILIKE '%' || CAST(:search AS text) || '%') " +
                   "ORDER BY d.view_count DESC, d.created_at DESC LIMIT :lim OFFSET :off",
           nativeQuery = true)
    List<Debate> findWithFiltersTrending(@Param("category") String category,
                                         @Param("search") String search,
                                         @Param("lim") int lim,
                                         @Param("off") int off);

    // --- count query (shared) ---
    @Query(value = "SELECT COUNT(*) FROM debates d WHERE " +
                   "(:category IS NULL OR d.category = :category) AND " +
                   "(:search IS NULL OR d.title ILIKE '%' || CAST(:search AS text) || '%' " +
                   "  OR d.description ILIKE '%' || CAST(:search AS text) || '%')",
           nativeQuery = true)
    long countWithFilters(@Param("category") String category,
                          @Param("search") String search);

    @Query(value = "SELECT category, COUNT(*) as count FROM debates GROUP BY category ORDER BY category",
           nativeQuery = true)
    List<Object[]> findCategoryCountsNative();

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

    // Used by AnalyticsService's getTrendingCategories (keeps Pageable for JPQL-style non-sorted usage)
    @Query(value = "SELECT * FROM debates d WHERE d.category = :category LIMIT :lim",
           nativeQuery = true)
    List<Debate> findByCategoryNative(@Param("category") String category, @Param("lim") int lim);
}
