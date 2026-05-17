package com.example.doit;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String recipient;
    private String commenter;
    private String commentText;
    private String targetUrl;
    private String commenterAvatarUrl;
    private boolean isRead = false;
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}

    public Notification(String recipient, String commenter, String commentText, String targetUrl, String commenterAvatarUrl) {
        this.recipient = recipient;
        this.commenter = commenter;
        this.commentText = commentText;
        this.targetUrl = targetUrl;
        this.commenterAvatarUrl = commenterAvatarUrl;
    }

    public Long getId() { return id; }
    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }
    public String getCommenter() { return commenter; }
    public void setCommenter(String commenter) { this.commenter = commenter; }
    public String getCommentText() { return commentText; }
    public void setCommentText(String commentText) { this.commentText = commentText; }
    public String getTargetUrl() { return targetUrl; }
    public void setTargetUrl(String targetUrl) { this.targetUrl = targetUrl; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { this.isRead = read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getCommenterAvatarUrl() { return commenterAvatarUrl; }
    public void setCommenterAvatarUrl(String commenterAvatarUrl) { this.commenterAvatarUrl = commenterAvatarUrl; }
}