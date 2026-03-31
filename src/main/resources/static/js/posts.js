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
        loadPosts(); // Refresh the feed
    } else {
        showToast(result.message, "error");
    }
}