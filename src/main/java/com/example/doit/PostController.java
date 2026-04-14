package com.example.doit;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional; // Added missing import
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class PostController {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final CommentRepository commentRepository;

    public PostController(PostRepository postRepository, UserRepository userRepository,
                          VoteRepository voteRepository, CommentRepository commentRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.voteRepository = voteRepository;
        this.commentRepository = commentRepository;
    }

    @GetMapping("/posts")
    public ResponseEntity<?> getPosts(HttpSession session) {
        String currentUser = (String) session.getAttribute("user");
        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Login required"));
        }

        List<Map<String, Object>> posts = postRepository.findAllByOrderByDatePostedDesc().stream()
                .map(post -> formatPost(post, currentUser))
                .collect(Collectors.toList());

        return ResponseEntity.ok(posts);
    }

    private Map<String, Object> formatPost(Post post, String currentUser) {
        User author = post.getAuthor();
        String pic = author.getProfilePicPath() != null ? author.getProfilePicPath() : "img/default-avatar.png";

        Map<String, Object> map = new HashMap<>();
        map.put("id", post.getId());
        map.put("content", post.getContent());
        map.put("username", author.getUsername());
        map.put("profile_pic", "/" + pic);
        map.put("date", post.getDatePosted().toString());
        map.put("upvotes", post.getUpvoteCount());
        map.put("downvotes", post.getDownvoteCount());
        map.put("commentCount", commentRepository.findByPostIdOrderByDatePostedAsc(post.getId()).size());

        Optional<Vote> userVote = voteRepository.findByPostAndUserUsername(post, currentUser);
        map.put("user_vote", userVote.map(Vote::getType).orElse("NONE"));

        return map;
    }

    @PostMapping("/posts/{id}/comment")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody Map<String, String> data, HttpSession session) {
        String username = (String) session.getAttribute("user");
        if (username == null) return ResponseEntity.status(401).build();

        return postRepository.findById(id).map(post -> {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user == null) return ResponseEntity.notFound().build();

            Comment comment = new Comment();
            comment.setContent(data.get("content"));
            comment.setAuthor(user);
            comment.setPost(post);
            commentRepository.save(comment);

            return ResponseEntity.ok(Map.of("status", "success", "message", "Comment added!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/posts/{id}/comments")
    public ResponseEntity<List<Map<String, Object>>> getComments(@PathVariable Long id) { // Fixed Return Type
        List<Map<String, Object>> comments = commentRepository.findByPostIdOrderByDatePostedAsc(id).stream()
                .map(comment -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", comment.getId());
                    map.put("content", comment.getContent());
                    map.put("username", comment.getAuthor().getUsername());
                    String pic = comment.getAuthor().getProfilePicPath() != null ?
                            comment.getAuthor().getProfilePicPath() : "img/default-avatar.png";
                    map.put("profile_pic", "/" + pic);
                    return map;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(comments);
    }
}