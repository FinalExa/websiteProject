package com.example.doit;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "post_comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private LocalDateTime datePosted = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_username", nullable = false)
    private User author;

    @ManyToOne
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    public Long getId() { return id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public LocalDateTime getDatePosted() { return datePosted; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    public void setPost(Post post) { this.post = post; }
}