package com.example.doit;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ProfileController {

    private final UserRepository userRepository;
    private final String UPLOAD_DIR = "src/main/resources/static/img/profile_pictures/";

    public ProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/upload-profile-pic")
    public ResponseEntity<?> uploadProfilePic(@RequestParam("file") MultipartFile file, HttpSession session) {
        String username = (String) session.getAttribute("user");
        if (username == null) return ResponseEntity.status(401).body(Map.of("status", "error", "message", "Unauthorized"));

        try {
            File userDir = new File(UPLOAD_DIR + username);
            if (!userDir.exists()) userDir.mkdirs();

            Files.deleteIfExists(Paths.get(userDir.getPath(), "5.png"));

            for (int i = 4; i >= 0; i--) {
                Path source = Paths.get(userDir.getPath(), i + ".png");
                Path target = Paths.get(userDir.getPath(), (i + 1) + ".png");
                if (Files.exists(source)) {
                    Files.move(source, target, StandardCopyOption.REPLACE_EXISTING);
                }
            }

            Path newFilePath = Paths.get(userDir.getPath(), "0.png");
            Files.copy(file.getInputStream(), newFilePath, StandardCopyOption.REPLACE_EXISTING);

            User user = userRepository.findByUsername(username).orElseThrow();
            String dbPath = "img/profile_pictures/" + username + "/0.png";
            user.setProfilePicPath(dbPath);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("status", "success", "message", "Profile picture updated!", "newPath", "/" + dbPath));

        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", "Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/data")
    public ResponseEntity<?> getUserData(HttpSession session) {
        String username = (String) session.getAttribute("user");
        if (username == null) return ResponseEntity.status(401).build();

        return userRepository.findByUsername(username).map(user -> {
            String pic = user.getProfilePicPath() != null ? user.getProfilePicPath() : "img/default-avatar.png";
            return ResponseEntity.ok(Map.of(
                    "user", user.getUsername(),
                    "profile_pic", "/" + pic,
                    "is_logged_in", true
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user-info/{username}")
    public ResponseEntity<?> getPublicUserInfo(@PathVariable String username) {
        return userRepository.findByUsername(username).map(user -> {
            String pic = user.getProfilePicPath() != null ? user.getProfilePicPath() : "img/default-avatar.png";
            return ResponseEntity.ok(Map.of(
                    "username", user.getUsername(),
                    "profile_pic", "/" + pic
            ));
        }).orElse(ResponseEntity.notFound().build());
    }
}