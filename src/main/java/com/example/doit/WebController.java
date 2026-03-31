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

    @GetMapping({"/", "/home", "/user"})
    public String index() {
        return "index";
    }

    @GetMapping("/api/content/personal-area")
    public String getPersonalArea(HttpSession session, Model model) {
        String username = (String) session.getAttribute("user");
        if (username == null) return "error/401";

        return userRepository.findByUsername(username).map(user -> {
            String pic = user.getProfilePicPath() != null ? user.getProfilePicPath() : "img/default-avatar.png";

            String picWithCacheBuster = "/" + pic + "?v=" + System.currentTimeMillis();

            model.addAttribute("profile_pic_url", "/" + pic + "?v=" + System.currentTimeMillis());
            return "personal_area_content";
        }).orElse("error/404");
    }

    @GetMapping("/api/content/{page}")
    public String getContent(@PathVariable String page, HttpSession session) {
        boolean isLoggedIn = session.getAttribute("user") != null;
        String[] publicPages = {"login-view", "register-view", "user"};

        boolean isPublic = false;
        for (String p : publicPages) {
            if (p.equals(page)) { isPublic = true; break; }
        }

        if (!isLoggedIn && !isPublic) {
            return "error/401";
        }

        return switch (page) {
            case "home" -> "home_content";
            case "user" -> "user_content";
            case "login-view" -> "login_content";
            case "register-view" -> "register_content";
            default -> "error/404";
        };
    }
}