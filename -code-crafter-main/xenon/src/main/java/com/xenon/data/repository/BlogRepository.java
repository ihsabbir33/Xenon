package com.xenon.data.repository;

import com.xenon.data.entity.blog.Blog;
import com.xenon.data.entity.blog.PostCategory;
import com.xenon.data.entity.blog.doctorArticle.DoctorArticleCategory;
import com.xenon.data.entity.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.ZonedDateTime;
import java.util.List;

public interface BlogRepository extends JpaRepository<Blog, Long> {
    Page<Blog> findAllByUser(User user, Pageable pageable);
    Page<Blog> findAllByCategory(PostCategory category, Pageable pageable);

    // Search functionality
    Page<Blog> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(String titleQuery, String contentQuery, Pageable pageable);
    Page<Blog> findByTitleContainingIgnoreCaseAndCategoryAndDoctorCategoryIsNotNull(
            String titleQuery, PostCategory category, Pageable pageable);
    // Doctor article specific queries
    Page<Blog> findByCategoryAndDoctorCategory(DoctorArticleCategory category, String doctorCategory, Pageable pageable);

    // Trending blogs by recent comments
    @Query("SELECT b FROM Blog b LEFT JOIN Comment c ON b.id = c.blog.id " +
            "WHERE c.createdAt > :since GROUP BY b.id ORDER BY COUNT(c.id) DESC")
    Page<Blog> findTrendingByComments(@Param("since") ZonedDateTime since, Pageable pageable);

    // Trending blogs by recent likes
    @Query("SELECT b FROM Blog b LEFT JOIN Like l ON b.id = l.blog.id " +
            "GROUP BY b.id ORDER BY COUNT(l.id) DESC")
    Page<Blog> findTrendingByLikes(Pageable pageable);
}