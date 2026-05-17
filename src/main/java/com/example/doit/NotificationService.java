package com.example.doit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    private static final int MAX_NOTIFICATIONS_LIMIT = 20;

    @Transactional
    public void createNotification(String recipient, String commenter, String commentText, String targetUrl, String commenterAvatarUrl) {
        if (recipient == null || recipient.equalsIgnoreCase(commenter)) {
            return;
        }

        Notification newNotification = new Notification(recipient, commenter, commentText, targetUrl, commenterAvatarUrl);
        notificationRepository.save(newNotification);

        List<Notification> history = notificationRepository.findByRecipientOrderByCreatedAtDesc(recipient);
        if (history.size() > MAX_NOTIFICATIONS_LIMIT) {
            List<Notification> excessItems = history.subList(MAX_NOTIFICATIONS_LIMIT, history.size());
            notificationRepository.deleteAll(excessItems);
        }
    }
}