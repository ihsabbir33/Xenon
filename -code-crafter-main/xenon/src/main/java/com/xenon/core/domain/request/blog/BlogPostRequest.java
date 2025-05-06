package com.xenon.core.domain.request.blog;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.xenon.data.entity.blog.Blog;
import com.xenon.data.entity.blog.PostCategory;
import com.xenon.data.entity.blog.doctorArticle.DoctorArticleCategory;
import com.xenon.data.entity.user.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class BlogPostRequest {

    private String title;
    private String content;
    private String category;
    private String media;

    public Blog toEntity(User user) {
        return new Blog(
                title,
                content,
                PostCategory.valueOf(category),
                media,
                user
        );
    }
}