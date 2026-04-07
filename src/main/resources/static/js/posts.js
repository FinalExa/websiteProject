async function submitPost() {
    const content = document.getElementById('post-content').value;

    const response = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });

    const result = await response.json();
    if (response.ok) {
        showToast(result.message, "success");
        document.getElementById('post-content').value = '';
        loadPosts();
    } else {
        showToast(result.message, "error");
    }
}

async function loadPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;

    try {
        const response = await fetch('/api/posts');
        const posts = await response.json();

        const templateReq = await fetch('/api/content/post-item');
        if (!templateReq.ok) throw new Error("Template fetch failed");
        const templateHtml = await templateReq.text();

        container.innerHTML = '';

        if (posts.length === 0) {
            container.innerHTML = '<p>No posts available.</p>';
            return;
        }

        for (const post of posts) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = templateHtml;

            tempDiv.querySelector('.post-img-target').src = post.profile_pic;

            const link = tempDiv.querySelector('.post-link-target');
            link.href = `/profile/${post.username}`;
            link.onclick = (e) => {
                e.preventDefault();
                navigateTo(`profile/${post.username}`);
            };

            tempDiv.querySelector('.post-username-target').innerText = `@${post.username}`;

            tempDiv.querySelector('.post-date-target').innerText = post.date;
            tempDiv.querySelector('.post-text-target').innerText = post.content;

            container.appendChild(tempDiv.firstElementChild);
        }
    } catch (error) {
        console.error("Error loading feed:", error);
    }
}

async function userPosts(username) {
    const container = document.getElementById('user-posts-container');

    if (!container) {
        setTimeout(() => userPosts(username), 50);
        return;
    }

    try {
        const response = await fetch(`/api/posts/user/${username}`);
        if (!response.ok) return;

        const posts = await response.json();
        const templateReq = await fetch('/api/content/post-item');
        const templateHtml = await templateReq.text();

        container.innerHTML = '';

        if (posts.length === 0) {
            container.innerHTML = '<p>No posts found for this user.</p>';
            return;
        }

        for (const post of posts) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = templateHtml;

            tempDiv.querySelector('.post-img-target').src = post.profile_pic;

            const link = tempDiv.querySelector('.post-link-target');
            link.href = `/profile/${post.username}`;
            link.onclick = (e) => {
                e.preventDefault();
                navigateTo(`profile/${post.username}`);
            };

            tempDiv.querySelector('.post-username-target').innerText = `@${post.username}`;

            tempDiv.querySelector('.post-date-target').innerText = post.date;
            tempDiv.querySelector('.post-text-target').innerText = post.content;

            container.appendChild(tempDiv.firstElementChild);
        }
    } catch (error) {
        console.error("Database fetch error:", error);
    }
}