async function loadProfilePosts(username) {
    const container = document.getElementById('user-posts-container');
    if (!container) return;

    try {
        const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/posts?username=${username}`);
        if (!response.ok) throw new Error("Could not fetch profile feed posts.");

        const posts = await response.json();
        container.innerHTML = '';

        if (posts.length === 0) {
            container.innerHTML = '<p class="no-posts-msg">No posts shared yet.</p>';
            return;
        }

        const postCardTemplate = document.getElementById('post-card-template')?.outerHTML || '';

        posts.forEach(post => {
            const postEl = renderPost(postCardTemplate, post);
            container.appendChild(postEl);
        });
    } catch (e) {
        console.error("Failed to load profile posts", e);
    }
}

async function uploadPic() {
    const fileInput = document.getElementById('pic-upload');
    if (!fileInput || fileInput.files.length === 0) {
        showToast("Please select an image first", "error");
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/upload-profile-pic`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (response.ok) {
            showToast(result.message, "success");
            const currentAvatar = document.querySelector('.current-avatar');
            if (currentAvatar && result.newPath) {
                currentAvatar.src = `${window.APP_CONFIG.BACKEND_URL}${result.newPath}?t=${new Date().getTime()}`;
            }
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        console.error("Upload failed:", error);
        showToast("Server error during upload", "error");
    }
}