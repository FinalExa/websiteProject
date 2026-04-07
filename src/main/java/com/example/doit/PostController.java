package com.example.doit;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class PostController {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostController(PostRepository postRepository, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/posts")
    public ResponseEntity<?> getPosts(HttpSession session) {
        if (session.getAttribute("user") == null) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Login required"));
        }

        List<Map<String, Object>> posts = postRepository.findAllByOrderByDatePostedDesc().stream()
                .map(post -> {
                    User author = post.getAuthor();
                    String pic = author.getProfilePicPath() != null ? author.getProfilePicPath() : "img/default-avatar.png";

                    return Map.<String, Object>of(
                            "id", post.getId(),
                            "username", author.getUsername(),
                            "content", post.getContent(),
                            "date", post.getDatePosted().toString(),
                            "profile_pic", "/" + pic + "?v=" + System.currentTimeMillis() // Add this here too!
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(posts);
    }

    @PostMapping("/post")
    public ResponseEntity<?> createPost(@RequestBody Map<String, String> data, HttpSession session) {
        String username = (String) session.getAttribute("user");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Login required"));
        }

        return userRepository.findByUsername(username).map(user -> {
            if (!user.isVerified()) {
                return ResponseEntity.status(403).body(Map.of("status", "error", "message", "Verify your email to post."));
            }

            String content = data.get("content");
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Post cannot be empty"));
            }

            Post post = new Post();
            post.setContent(content);
            post.setAuthor(user);
            postRepository.save(post);

            return ResponseEntity.ok(Map.of("status", "success", "message", "Post created!"));
        }).orElse(ResponseEntity.status(404).body(Map.of("status", "error", "message", "User not found")));
    }

    @DeleteMapping("/delete-post/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, HttpSession session) {
        String username = (String) session.getAttribute("user");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Login required"));
        }

        return postRepository.findById(id).map(post -> {
            if (!post.getAuthor().getUsername().equals(username)) {
                return ResponseEntity.status(403).body(Map.of("status", "error", "message", "You can only delete your own posts."));
            }
            postRepository.delete(post);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Post deleted successfully!"));
        }).orElse(ResponseEntity.status(404).body(Map.of("status", "error", "message", "Post not found")));
    }

    @GetMapping("/posts/user/{username}")
    public ResponseEntity<?> getUserPosts(@PathVariable String username) {
        return userRepository.findByUsername(username).map(user -> {
            List<Post> posts = postRepository.findByAuthorOrderByDatePostedDesc(user);

            List<Map<String, Object>> postsFormatted = posts.stream()
                    .map(post -> {
                        String pic = user.getProfilePicPath() != null ? user.getProfilePicPath() : "img/default-avatar.png";
                        String cacheBuster = "?v=" + System.currentTimeMillis();

                        return Map.<String, Object>of(
                                "id", post.getId(),
                                "username", user.getUsername(),
                                "content", post.getContent(),
                                "date", post.getDatePosted().toString().replace("T", " ").substring(0, 16),
                                "profile_pic", "/" + pic + cacheBuster
                        );
                    })
                    .collect(Collectors.toList());

            // 3. Return the formatted list
            return ResponseEntity.ok(postsFormatted);
        }).orElse(ResponseEntity.notFound().build());
    }
}