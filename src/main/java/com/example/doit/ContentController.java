package com.example.doit;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ContentController {

    @GetMapping("/content/comment-item")
    public String getCommentTemplate() {
        // This looks for src/main/resources/templates/comment-item.html
        // and returns the processed HTML to the JavaScript fetch call
        return "comment-item";
    }
}