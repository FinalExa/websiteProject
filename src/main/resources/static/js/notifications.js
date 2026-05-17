let isDropdownTemplateLoaded = false;

document.addEventListener("DOMContentLoaded", () => {
    updateNotificationBadge();
    setInterval(updateNotificationBadge, 30000);
});

async function toggleNotificationDropdown(event) {
    if (event) event.stopPropagation();

    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;

    if (dropdown.style.display === 'none' && !isDropdownTemplateLoaded) {
        try {
            const response = await fetch('/api/content/notification-dropdown');
            if (response.ok) {
                dropdown.innerHTML = await response.text();
                isDropdownTemplateLoaded = true;
            }
        } catch (error) {
            console.error("Error setting up dropdown skeleton:", error);
        }
    }

    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'flex';
        await loadUserNotifications();
    } else {
        dropdown.style.display = 'none';
    }
}

async function loadUserNotifications() {
    const listContainer = document.getElementById('notification-items-list');
    if (!listContainer) return;

    try {
        const dataResponse = await fetch('/api/notifications');
        if (!dataResponse.ok) return;
        const notifications = await dataResponse.json();

        if (notifications.length === 0) {
            return;
        }

        const itemTemplateResponse = await fetch('/api/content/notification-item');
        if (!itemTemplateResponse.ok) return;
        const itemTemplateHtml = await itemTemplateResponse.text();

        listContainer.innerHTML = '';

        notifications.forEach(notif => {
            let itemHtml = itemTemplateHtml
                .replace('{id}', notif.id)
                .replace('{username}', notif.commenter)
                .replace('{comment-text}', notif.commentText)
                .replace('{time-ago}', formatTimeAgo(notif.createdAt))
                .replace('{unread-class}', notif.read ? '' : 'unread')
                .replace('{target-url}', notif.targetUrl)
                .replace('{avatar-url}', notif.commenterAvatarUrl || '/img/default-avatar.png'); // Use dynamic DB string

            listContainer.insertAdjacentHTML('beforeend', itemHtml);
        });

    } catch (error) {
        console.error("Error populating real-time notification data streams:", error);
    }
}

async function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    try {
        const response = await fetch('/api/notifications/unread-count');
        if (response.ok) {
            const data = await response.json();
            if (data.count > 0) {
                badge.innerText = data.count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Failed to update unread indicator counts:", error);
    }
}

async function handleNotificationClick(targetUrl, notificationId) {
    try {
        await fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' });

        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) dropdown.style.display = 'none';

        if (typeof navigateTo === 'function') {
            try {
                navigateTo(targetUrl);
            } catch (err) {
                window.location.href = targetUrl;
            }
        } else {
            window.location.href = targetUrl;
        }
    } catch (error) {
        console.error("Error resolving notification read state:", error);
    }
}

async function markAllNotificationsRead(event) {
    if (event) event.stopPropagation();
    try {
        const response = await fetch('/api/notifications/mark-all-read', { method: 'POST' });
        if (response.ok) {
            updateNotificationBadge();
            loadUserNotifications();
        }
    } catch (error) {
        console.error("Error execution bulk read operation:", error);
    }
}

function formatTimeAgo(dateTimeString) {
    const now = new Date();
    const past = new Date(dateTimeString);
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const elapsed = now - past;

    if (elapsed < msPerMinute) return 'Just now';
    if (elapsed < msPerHour) return Math.round(elapsed / msPerMinute) + ' mins ago';
    if (elapsed < msPerDay) return Math.round(elapsed / msPerHour) + ' hours ago';
    return Math.round(elapsed / msPerDay) + ' days ago';
}

window.addEventListener('click', (event) => {
    const dropdown = document.getElementById('notification-dropdown');
    const bellButton = document.getElementById('btn-notifications');
    if (dropdown && dropdown.style.display !== 'none') {
        if (!dropdown.contains(event.target) && !bellButton.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    }
});