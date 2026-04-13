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
        if (!Array.isArray(posts)) {
            container.innerHTML = `<p style="color: red;">${posts.message || "Session expired."}</p>`;
            return;
        }
        const templateReq = await fetch('/api/content/post-item');
        const templateHtml = await templateReq.text();
        container.innerHTML = '';
        for (const post of posts) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = templateHtml;
            tempDiv.querySelector('.post-img-target').src = post.profile_pic;
            const link = tempDiv.querySelector('.post-link-target');
            link.href = `/profile/${post.username}`;
            link.onclick = (e) => { e.preventDefault(); navigateTo(`profile/${post.username}`); };
            tempDiv.querySelector('.post-username-target').innerText = `@${post.username}`;
            tempDiv.querySelector('.post-date-target').innerText = post.date;
            tempDiv.querySelector('.post-text-target').innerText = post.content;
            const upSpan = tempDiv.querySelector('.upvote-count-target');
            const downSpan = tempDiv.querySelector('.downvote-count-target');
            if (upSpan && downSpan) {
                upSpan.innerText = post.upvotes || 0;
                downSpan.innerText = post.downvotes || 0;
                tempDiv.querySelector('.upvote-btn').onclick = () => handleVote(post.id, 'UPVOTE', upSpan, downSpan);
                tempDiv.querySelector('.downvote-btn').onclick = () => handleVote(post.id, 'DOWNVOTE', upSpan, downSpan);
            }
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
        for (const post of posts) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = templateHtml;
            tempDiv.querySelector('.post-img-target').src = post.profile_pic;
            const link = tempDiv.querySelector('.post-link-target');
            link.href = `/profile/${post.username}`;
            link.onclick = (e) => { e.preventDefault(); navigateTo(`profile/${post.username}`); };
            tempDiv.querySelector('.post-username-target').innerText = `@${post.username}`;
            tempDiv.querySelector('.post-date-target').innerText = post.date;
            tempDiv.querySelector('.post-text-target').innerText = post.content;
            const upSpan = tempDiv.querySelector('.upvote-count-target');
            const downSpan = tempDiv.querySelector('.downvote-count-target');
            if (upSpan && downSpan) {
                upSpan.innerText = post.upvotes || 0;
                downSpan.innerText = post.downvotes || 0;
                tempDiv.querySelector('.upvote-btn').onclick = () => handleVote(post.id, 'UPVOTE', upSpan, downSpan);
                tempDiv.querySelector('.downvote-btn').onclick = () => handleVote(post.id, 'DOWNVOTE', upSpan, downSpan);
            }
            container.appendChild(tempDiv.firstElementChild);
        }
    } catch (error) {
        console.error("Database fetch error:", error);
    }
}

async function handleVote(postId, type, upSpan, downSpan) {
    try {
        const response = await fetch(`/api/posts/${postId}/vote?type=${type}`, { method: 'POST' });
        if (response.ok) {
            const data = await response.json();
            upSpan.innerText = data.upvotes;
            downSpan.innerText = data.downvotes;
        }
    } catch (error) {
        console.error("Voting failed:", error);
    }
}