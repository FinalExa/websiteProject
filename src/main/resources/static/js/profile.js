async function loadProfilePosts(username) {
    const container = document.getElementById('user-posts-container');
    if (!container) return;

    try {
        const [postsReq, templateReq] = await Promise.all([
            fetch(`/api/posts?username=${username}`),
            fetch('/api/content/post-item')
        ]);

        const posts = await postsReq.json();
        const templateHtml = await templateReq.text();

        container.innerHTML = '';
        posts.forEach(post => {
            const postEl = renderPost(templateHtml, post);
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
        const response = await fetch('/api/upload-profile-pic', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (response.ok) {
            showToast(result.message, "success");
            const currentAvatar = document.querySelector('.current-avatar');
            if (currentAvatar && result.newPath) {
                currentAvatar.src = result.newPath + '?t=' + new Date().getTime();
            }
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        console.error("Upload failed:", error);
        showToast("Server error during upload", "error");
    }
}