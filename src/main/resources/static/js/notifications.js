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
            const response = await fetch('${window.APP_CONFIG.BACKEND_URL}/api/content/notification-dropdown');
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
        const dataResponse = await fetch('${window.APP_CONFIG.BACKEND_URL}/api/notifications');
        if (!dataResponse.ok) return;
        const notifications = await dataResponse.json();

        if (notifications.length === 0) {
            const emptyTemplateResponse = await fetch('${window.APP_CONFIG.BACKEND_URL}/api/content/notification-empty');
            if (emptyTemplateResponse.ok) {
                listContainer.innerHTML = await emptyTemplateResponse.text();
            }
            return;
        }

        const itemTemplateResponse = await fetch('${window.APP_CONFIG.BACKEND_URL}/api/content/notification-item');
        if (!itemTemplateResponse.ok) return;
        const itemTemplateHtml = await itemTemplateResponse.text();

        listContainer.innerHTML = '';

        notifications.forEach(notif => {
            let itemHtml = itemTemplateHtml
                .replace(/{id}/g, notif.id)
                .replace(/{username}/g, notif.commenter)
                .replace(/{comment-text}/g, notif.commentText)
                .replace(/{time-ago}/g, formatTimeAgo(notif.createdAt))
                .replace(/{unread-class}/g, notif.read ? '' : 'unread')
                .replace(/{target-url}/g, notif.targetUrl)
                .replace(/{avatar-url}/g, notif.commenterAvatarUrl || '/img/default-avatar.png');

            listContainer.insertAdjacentHTML('beforeend', itemHtml);
        });
    } catch (error) {
        console.error("Error running user notification view renderer:", error);
    }
}

async function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    try {
        const response = await fetch('${window.APP_CONFIG.BACKEND_URL}/api/notifications/unread-count');
        if (!response.ok) return;
        const data = await response.json();

        if (data.count > 0) {
            badge.textContent = data.count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error("Error requesting update to application badge count runtime:", error);
    }
}

async function handleNotificationClick(targetUrl, notificationId) {
    try {
        await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/notifications/${notificationId}/read`, { method: 'PUT' });

        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }

        if (typeof navigateTo === 'function') {
            navigateTo(targetUrl);
        } else {
            window.location.href = '/' + targetUrl;
        }
    } catch (error) {
        console.error("Error executing notification redirection sequence:", error);
    }
}

async function markAllNotificationsRead(event) {
    if (event) event.stopPropagation();
    try {
        const response = await fetch('${window.APP_CONFIG.BACKEND_URL}/api/notifications/mark-all-read', { method: 'POST' });
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