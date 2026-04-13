package com.example.doit;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class PostController {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;

    public PostController(PostRepository postRepository, UserRepository userRepository, VoteRepository voteRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.voteRepository = voteRepository;
    }

    @GetMapping("/posts")
    public ResponseEntity<?> getPosts(HttpSession session) {
        if (session.getAttribute("user") == null) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Login required"));
        }

        List<Map<String, Object>> posts = postRepository.findAllByOrderByDatePostedDesc().stream()
                .map(this::formatPost)
                .collect(Collectors.toList());

        return ResponseEntity.ok(posts);
    }

    private Map<String, Object> formatPost(Post post) {
        User author = post.getAuthor();
        String pic = author.getProfilePicPath() != null ? author.getProfilePicPath() : "img/default-avatar.png";

        Map<String, Object> map = new HashMap<>();
        map.put("id", post.getId());
        map.put("username", author.getUsername());
        map.put("content", post.getContent());
        map.put("date", post.getDatePosted().toString());
        map.put("upvotes", post.getUpvoteCount());
        map.put("downvotes", post.getDownvoteCount());
        map.put("profile_pic", "/" + pic + "?v=" + System.currentTimeMillis());
        return map;
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

    @PostMapping("/posts/{id}/vote")
    public ResponseEntity<?> handleVote(@PathVariable Long id, @RequestParam String type, HttpSession session) {
        String username = (String) session.getAttribute("user");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Login required"));
        }

        Post post = postRepository.findById(id).orElse(null);
        User user = userRepository.findByUsername(username).orElse(null);

        if (post == null || user == null) {
            return ResponseEntity.notFound().build();
        }

        Optional<Vote> existingVote = voteRepository.findByPostAndUser(post, user);

        if (existingVote.isPresent()) {
            Vote vote = existingVote.get();
            if (vote.getType().equalsIgnoreCase(type)) {
                voteRepository.delete(vote);
            } else {
                vote.setType(type.toUpperCase());
                voteRepository.save(vote);
            }
        } else {
            Vote newVote = new Vote();
            newVote.setPost(post);
            newVote.setUser(user);
            newVote.setType(type.toUpperCase());
            voteRepository.save(newVote);
        }

        postRepository.flush();
        Post updatedPost = postRepository.findById(id).orElse(post);

        return ResponseEntity.ok(Map.of(
                "upvotes", updatedPost.getUpvoteCount(),
                "downvotes", updatedPost.getDownvoteCount()
        ));
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
            List<Map<String, Object>> posts = postRepository.findByAuthorOrderByDatePostedDesc(user).stream()
                    .map(this::formatPost)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(posts);
        }).orElse(ResponseEntity.notFound().build());
    }
}