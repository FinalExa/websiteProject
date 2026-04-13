package com.example.doit;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_post")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private LocalDateTime datePosted = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_username", nullable = false)
    private User author;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vote> votes = new ArrayList<>();

    public Long getId() { return id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public LocalDateTime getDatePosted() { return datePosted; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public long getUpvoteCount() {
        return votes.stream().filter(v -> "UPVOTE".equals(v.getType())).count();
    }

    public long getDownvoteCount() {
        return votes.stream().filter(v -> "DOWNVOTE".equals(v.getType())).count();
    }
}