package com.example.doit;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/content")
public class ContentController {

    @GetMapping("/comment-item")
    public String getCommentTemplate() {
        // This looks for src/main/resources/templates/comment_item.html
        return "comment_item";
    }
}