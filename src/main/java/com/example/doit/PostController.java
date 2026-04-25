package com.example.doit;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.stereotype.Controller;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
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
        map.put("date_posted", post.getDatePosted());

        String picPath = post.getAuthor().getProfilePicPath();
        map.put("profile_pic", (picPath != null) ? "/" + picPath : "/img/default-avatar.png");

        if (post.getImageExtension() != null && !post.getImageExtension().isEmpty()) {
            map.put("image_url", "/img/user_posts/" + post.getAuthor().getUsername() + "/" + post.getId() + post.getImageExtension());
        } else {
            map.put("image_url", null);
        }

        if (post.getSharedPost() != null) {
            map.put("shared_post", formatPost(post.getSharedPost(), currentUser));
        }

        map.put("upvotes", post.getUpvoteCount());
        map.put("downvotes", post.getDownvoteCount());
        map.put("commentCount", post.getComments().size());

        return map;
    }

    @PostMapping(value = "/posts", consumes = {"multipart/form-data"})
    @ResponseBody
    public ResponseEntity<?> createPost(
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "file", required = false) MultipartFile file,
            HttpSession session) {

        String username = (String) session.getAttribute("user");
        if (username == null) return ResponseEntity.status(401).build();

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return ResponseEntity.status(404).build();

        Post post = new Post();
        post.setContent(content != null ? content : "");
        post.setAuthor(user);
        post.setDatePosted(LocalDateTime.now());
        post = postRepository.save(post);

        if (file != null && !file.isEmpty()) {
            try {
                String originalFileName = file.getOriginalFilename();
                if (originalFileName != null && originalFileName.contains(".")) {
                    String extension = originalFileName.substring(originalFileName.lastIndexOf("."));
                    post.setImageExtension(extension);

                    String baseDir = System.getProperty("user.dir") + "/user_posts/" + username + "/";
                    String fileName = post.getId() + extension;

                    Path path = Paths.get(baseDir + fileName);
                    Files.createDirectories(path.getParent());
                    Files.write(path, file.getBytes());

                    post = postRepository.save(post);
                }
            } catch (Exception e) {
                return ResponseEntity.status(500).body("File upload failed: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(formatPost(post, username));
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
                },
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

    @PostMapping("/posts/{id}/share")
    public ResponseEntity<?> sharePost(@PathVariable Long id, @RequestBody Map<String, String> payload, HttpSession session) {
        String username = (String) session.getAttribute("user");
        if (username == null) return ResponseEntity.status(401).build();

        User user = userRepository.findByUsername(username)
                .orElse(null);
        Post originalPost = postRepository.findById(id)
                .orElse(null);

        if (user == null || originalPost == null) {
            return ResponseEntity.status(404).body(Map.of("message", "User or Post not found"));
        }

        Post sharedPost = new Post();
        sharedPost.setContent(payload.get("content"));
        sharedPost.setAuthor(user);
        sharedPost.setSharedPost(originalPost);
        sharedPost.setDatePosted(LocalDateTime.now());

        postRepository.save(sharedPost);

        return ResponseEntity.ok(Map.of("status", "success"));
    }

    @Configuration
    public class WebConfig implements WebMvcConfigurer {
        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
            registry.addResourceHandler("/img/user_posts/**")
                    .addResourceLocations("file:user_posts/");
        }
    }
}