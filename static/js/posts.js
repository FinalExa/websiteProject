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
        const isAuthor = auth.is_logged_in && auth.user === post.username;
        const deleteBtn = isAuthor 
            ? `<button onclick="deletePost(${post.id})" class="delete-post-btn">&times;</button>` 
            : '';

        return `
            <div class="main-text post-card">
                <div class="post-header">
                    <div>
                        <span class="post-author">@${post.username}</span>
                        <span class="post-date">${post.date}</span>
                    </div>
                    ${deleteBtn}
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