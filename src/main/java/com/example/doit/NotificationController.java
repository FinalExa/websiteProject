package com.example.doit;

import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;


    @GetMapping("/api/notifications")
    public ResponseEntity<?> getUserNotifications(HttpSession session) {
        String currentUser = getUsernameFromSession(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        List<Notification> notifications = notificationRepository.findByRecipientOrderByCreatedAtDesc(currentUser);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/api/notifications/unread-count")
    public ResponseEntity<?> getUnreadCount(HttpSession session) {
        String currentUser = getUsernameFromSession(session);
        if (currentUser == null) {
            return ResponseEntity.ok(Map.of("count", 0));
        }

        long count = notificationRepository.countByRecipientAndIsReadFalse(currentUser);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/api/notifications/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, HttpSession session) {
        String currentUser = getUsernameFromSession(session);
        if (currentUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");

        notificationRepository.findById(id).ifPresent(notif -> {
            if (notif.getRecipient().equalsIgnoreCase(currentUser)) {
                notif.setRead(true);
                notificationRepository.save(notif);
            }
        });
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/notifications/mark-all-read")
    public ResponseEntity<?> markAllRead(HttpSession session) {
        String currentUser = getUsernameFromSession(session);
        if (currentUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");

        List<Notification> records = notificationRepository.findByRecipientOrderByCreatedAtDesc(currentUser);
        for (Notification notif : records) {
            notif.setRead(true);
        }
        notificationRepository.saveAll(records);
        return ResponseEntity.ok().build();
    }

    private String getUsernameFromSession(HttpSession session) {
        Object userObj = session.getAttribute("user");
        if (userObj == null) return null;
        if (userObj instanceof String) return (String) userObj;

        try {
            return (String) userObj.getClass().getMethod("getUsername").invoke(userObj);
        } catch (Exception e) {
            return userObj.toString();
        }
    }
}