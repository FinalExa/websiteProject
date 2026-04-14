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

            const postEl = tempDiv.firstElementChild;
            // CRITICAL: Link the HTML element to the database ID for comments
            postEl.dataset.postId = post.id;

            postEl.querySelector('.post-img-target').src = post.profile_pic;
            const link = postEl.querySelector('.post-link-target');
            link.href = `/profile/${post.username}`;
            link.onclick = (e) => {
                e.preventDefault();
                navigateTo(`profile/${post.username}`);
            };

            postEl.querySelector('.post-username-target').innerText = `@${post.username}`;
            postEl.querySelector('.post-date-target').innerText = post.date;
            postEl.querySelector('.post-text-target').innerText = post.content;

            const commentCountSpan = postEl.querySelector('.comment-count-target');
            if (commentCountSpan) {
                commentCountSpan.innerText = post.commentCount || 0;
            }

            const upSpan = postEl.querySelector('.upvote-count-target');
            const downSpan = postEl.querySelector('.downvote-count-target');
            const upBtn = postEl.querySelector('.upvote-btn');
            const downBtn = postEl.querySelector('.downvote-btn');

            if (upSpan && downSpan) {
                upSpan.innerText = post.upvotes || 0;
                downSpan.innerText = post.downvotes || 0;

                if (post.user_vote === 'UPVOTE') upBtn.classList.add('upvoted');
                if (post.user_vote === 'DOWNVOTE') downBtn.classList.add('downvoted');

                upBtn.onclick = function() { handleVote(post.id, 'UPVOTE', upSpan, downSpan, this); };
                downBtn.onclick = function() { handleVote(post.id, 'DOWNVOTE', upSpan, downSpan, this); };
            }

            container.appendChild(postEl);
        }
    } catch (error) {
        console.error("Database fetch error:", error);
    }
}

async function handleVote(postId, type, upSpan, downSpan, clickedBtn) {
    try {
        const response = await fetch(`/api/posts/${postId}/vote?type=${type}`, { method: 'POST' });
        if (response.ok) {
            const data = await response.json();
            upSpan.innerText = data.upvotes;
            downSpan.innerText = data.downvotes;

            const parent = clickedBtn.parentElement;
            const upBtn = parent.querySelector('.upvote-btn');
            const downBtn = parent.querySelector('.downvote-btn');

            upBtn.classList.remove('upvoted');
            downBtn.classList.remove('downvoted');

            if (data.user_vote === 'UPVOTE') upBtn.classList.add('upvoted');
            if (data.user_vote === 'DOWNVOTE') downBtn.classList.add('downvoted');
        }
    } catch (error) {
        console.error("Vote error:", error);
    }
}