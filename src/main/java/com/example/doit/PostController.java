package com.example.doit;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Controller
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

    @GetMapping("/content/user_profile_public")
    public String getProfileTemplate() {
        return "user_profile_public";
    }

    @GetMapping("/posts")
    @ResponseBody
    public ResponseEntity<?> getPosts(HttpSession session) {
        String currentUser = (String) session.getAttribute("user");
        if (currentUser == null) return ResponseEntity.status(401).build();
        List<Map<String, Object>> posts = postRepository.findAllByOrderByDatePostedDesc().stream()
                .map(post -> formatPost(post, currentUser))
                .collect(Collectors.toList());
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/posts/user/{username}")
    @ResponseBody
    public ResponseEntity<?> getUserPosts(@PathVariable String username, HttpSession session) {
        String currentUser = (String) session.getAttribute("user");
        if (currentUser == null) return ResponseEntity.status(401).build();
        List<Map<String, Object>> posts = postRepository.findByAuthorUsernameOrderByDatePostedDesc(username).stream()
                .map(post -> formatPost(post, currentUser))
                .collect(Collectors.toList());
        return ResponseEntity.ok(posts);
    }

    private Map<String, Object> formatPost(Post post, String currentUser) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", post.getId());
        map.put("content", post.getContent());
        map.put("username", post.getAuthor().getUsername());
        map.put("date", post.getDatePosted());
        map.put("upvotes", voteRepository.countByPostAndType(post, Vote.VoteType.UPVOTE.toString()));
        map.put("downvotes", voteRepository.countByPostAndType(post, Vote.VoteType.DOWNVOTE.toString()));
        map.put("commentCount", commentRepository.countByPost(post));
        String pic = post.getAuthor().getProfilePicPath() != null ? post.getAuthor().getProfilePicPath() : "img/default-avatar.png";
        map.put("profile_pic", "/" + pic);
        voteRepository.findByPostAndUserUsername(post, currentUser)
                .ifPresent(v -> map.put("user_vote", v.getType().toString()));
        return map;
    }

    @PostMapping("/post")
    @ResponseBody
    public ResponseEntity<?> createPost(@RequestBody Map<String, String> data, HttpSession session) {
        String username = (String) session.getAttribute("user");
        if (username == null) return ResponseEntity.status(401).build();
        User user = userRepository.findByUsername(username).orElse(null);
        Post post = new Post();
        post.setContent(data.get("content"));
        post.setAuthor(user);
        postRepository.save(post);
        return ResponseEntity.ok(Map.of("message", "Post created!"));
    }

    @PostMapping("/posts/{id}/vote")
    @ResponseBody
    public ResponseEntity<?> vote(@PathVariable Long id, @RequestParam String type, HttpSession session) {
        String username = (String) session.getAttribute("user");
        if (username == null) return ResponseEntity.status(401).build();

        Post post = postRepository.findById(id).orElseThrow();
        User user = userRepository.findByUsername(username).orElseThrow();
        Vote.VoteType voteType = Vote.VoteType.valueOf(type.toUpperCase());

        voteRepository.findByPostAndUser(post, user).ifPresentOrElse(
                v -> {
                    if (v.getType().equals(voteType.toString())) {
                        voteRepository.delete(v);
                    } else {
                        v.setType(voteType.toString());
                        voteRepository.save(v);
                    }
                }, // Added the missing comma here
                () -> {
                    Vote v = new Vote();
                    v.setPost(post);
                    v.setUser(user);
                    v.setType(voteType.toString());
                    voteRepository.save(v);
                }
        );

        return ResponseEntity.ok(Map.of(
                "upvotes", voteRepository.countByPostAndType(post, Vote.VoteType.UPVOTE.toString()),
                "downvotes", voteRepository.countByPostAndType(post, Vote.VoteType.DOWNVOTE.toString()),
                "user_vote", voteRepository.findByPostAndUser(post, user)
                        .map(Vote::getType)
                        .orElse("NONE")
        ));
    }

    @PostMapping("/posts/{id}/comment")
    @ResponseBody
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody Map<String, String> data, HttpSession session) {
        String username = (String) session.getAttribute("user");
        if (username == null) return ResponseEntity.status(401).build();
        return postRepository.findById(id).map(post -> {
            User user = userRepository.findByUsername(username).orElse(null);
            Comment comment = new Comment();
            comment.setContent(data.get("content"));
            comment.setAuthor(user);
            comment.setPost(post);
            commentRepository.save(comment);
            return ResponseEntity.ok(Map.of("status", "success"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/posts/{id}/comments")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getComments(@PathVariable Long id) {
        List<Map<String, Object>> comments = commentRepository.findByPostIdOrderByDatePostedAsc(id).stream()
                .map(comment -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", comment.getId());
                    map.put("content", comment.getContent());
                    map.put("username", comment.getAuthor().getUsername());
                    String pic = comment.getAuthor().getProfilePicPath() != null ? comment.getAuthor().getProfilePicPath() : "img/default-avatar.png";
                    map.put("profile_pic", "/" + pic);
                    return map;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/posts/{id}")
    @ResponseBody
    public ResponseEntity<?> getSinglePost(@PathVariable Long id, HttpSession session) {
        String currentUser = (String) session.getAttribute("user");
        if (currentUser == null) return ResponseEntity.status(401).build();

        return postRepository.findById(id)
                .map(post -> ResponseEntity.ok(formatPost(post, currentUser)))
                .orElse(ResponseEntity.notFound().build());
    }
}

