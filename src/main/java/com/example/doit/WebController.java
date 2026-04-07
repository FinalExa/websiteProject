package com.example.doit;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import jakarta.servlet.http.HttpSession;
import org.springframework.ui.Model;

@Controller
public class WebController {

    private final UserRepository userRepository;

    public WebController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping({"/", "/home", "/user", "/user_center", "/profile/{username}"})
    public String index() {
        return "index";
    }

    @GetMapping("/api/content/personal-area")
    public String getPersonalArea(HttpSession session, Model model) {
        String username = (String) session.getAttribute("user");
        if (username == null) return "error/401";

        return userRepository.findByUsername(username).map(user -> {
            model.addAttribute("profile_pic_url", "/" + user.getProfilePicPath() + "?v=" + System.currentTimeMillis());
            return "personal_area_content";
        }).orElse("error/404");
    }

    @GetMapping("/api/content/{page}")
    public String getContent(@PathVariable String page, HttpSession session) {
        return switch (page) {
            case "home" -> "home_content";
            case "user" -> "user_content";
            case "post-item" -> "post_item";
            case "login-view" -> "login_content";
            case "register-view" -> "register_content";
            default -> "error/404";
        };
    }

    @GetMapping("/api/public-profile/{username}")
    public String getPublicProfile(@PathVariable String username, Model model) {
        return userRepository.findByUsername(username).map(user -> {
            model.addAttribute("target_username", user.getUsername());
            model.addAttribute("target_user_pic", "/" + user.getProfilePicPath());
            return "user_profile_public";
        }).orElse("error/404");
    }
}