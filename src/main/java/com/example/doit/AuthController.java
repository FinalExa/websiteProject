package com.example.doit;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserService userService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    public AuthController(UserService userService,
                          EmailService emailService,
                          UserRepository userRepository) {
        this.userService = userService;
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> data) {
        String username = data.get("username");
        String password = data.get("password");
        String email = data.get("email");

        String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";

        if (password == null || !password.matches(passwordRegex)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Password too weak. Must contain 8+ chars, uppercase, lowercase, number, and special char."
            ));
        }

        try {
            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Username taken"));
            }

            User user = userService.registerUser(username, email, password);
            emailService.sendVerificationEmail(user.getEmail(), user.getUsername());

            return ResponseEntity.ok(Map.of("status", "success", "message", "Check your email to verify!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> data, HttpSession session) {
        return userService.login(data.get("username"), data.get("password"))
                .map(user -> {
                    if (!user.isVerified()) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("status", "error", "message", "Verify your email first."));
                    }

                    session.setAttribute("user", user.getUsername());
                    return ResponseEntity.ok(Map.of("status", "success", "message", "Logged in successfully!"));
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("status", "error", "message", "Invalid credentials")));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("status", "success", "message", "Logged out"));
    }

    @GetMapping("/check-auth")
    public Map<String, Object> checkAuth(HttpSession session) {
        String username = (String) session.getAttribute("user");
        return Map.of("is_logged_in", username != null, "user", username == null ? "" : username);
    }

    @GetMapping("/verify/{token}")
    public ResponseEntity<Void> verifyAccount(@PathVariable String token) {
        String frontendLoginUrl = "https://your-portfolio-name.vercel.app/login.html";

        userRepository.findByUsername(token).ifPresent(user -> {
            if (!user.isVerified()) {
                user.setVerified(true);
                userRepository.save(user);
            }
        });

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(frontendLoginUrl))
                .build();
    }
}