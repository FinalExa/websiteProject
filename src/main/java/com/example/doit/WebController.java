package com.example.doit;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import jakarta.servlet.http.HttpSession;
import org.springframework.ui.Model;
import org.springframework.web.servlet.HandlerMapping;

@Controller
public class WebController {

    private final UserRepository userRepository;

    public WebController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping({"/", "/home", "/user", "/user_center", "/profile/{username}", "/post/{id}"})
    public String index() {
        return "index";
    }

    @GetMapping("/api/content/post_view")
    public String getPostViewTemplate() {
        return "post_view";
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

    @GetMapping("/api/content/{page}/**") // Added /** to catch sub-paths
    public String getContent(@PathVariable String page, HttpServletRequest request) {
        String fullPath = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);

        if (fullPath.contains("profile/")) {
            return "user_profile_public";
        }
        if (fullPath.contains("post/")) {
            return "post_view";
        }

        return switch (page) {
            case "home" -> "home_content";
            case "user" -> "user_content";
            case "post-item" -> "post_item";
            case "user_center" -> "personal_area_content";
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