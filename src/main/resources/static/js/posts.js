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
        loadPosts(); // Refresh the feed
    } else {
        showToast(result.message, "error");
    }
}

async function loadPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;

    // Get current auth status to know who is viewing
    const authCheck = await fetch('/api/check-auth');
    const auth = await authCheck.json();

    const response = await fetch('/api/posts');
    const posts = await response.json();

    container.innerHTML = posts.map(post => {
		return `
			<div class="main-text post-card">
				<div class="post-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
					<img src="${post.profile_pic}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
					<div>
						<span class="post-author" style="font-weight: bold;">@${post.username}</span>
						<span class="post-date" style="font-size: 0.8rem; color: gray;">${post.date}</span>
					</div>
				</div>
				<p>${post.content}</p>
			</div>
		`;
	}).join('');
}

async function deletePost(postId) {
    if (!confirm("Are you sure you want to delete this post?")) return;

    const response = await fetch(`/api/delete-post/${postId}`, {
        method: 'DELETE'
    });

    const result = await response.json();
    if (response.ok) {
        showToast(result.message, "success");
        loadPosts();
    } else {
        showToast(result.message, "error");
    }
}

async function userPosts(username) {
    const container = document.getElementById('user-posts-container');

    if (!container) {
        setTimeout(() => userPosts(username), 50);
        return;
    }

    try {

        const response = await fetch(`/api/posts/user/${username}`); //
        if (!response.ok) return;

        const posts = await response.json();
        const templateReq = await fetch('/api/content/post-item'); //
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
            tempDiv.querySelector('.post-username-target').innerText = post.username;
            tempDiv.querySelector('.post-date-target').innerText = post.date;
            tempDiv.querySelector('.post-text-target').innerText = post.content;

            container.appendChild(tempDiv.firstElementChild);
        }
    } catch (e) {
        console.error("Post loading failed:", e);
    }
}