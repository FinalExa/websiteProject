async function loadPosts(targetUsername = null) {
    const container = document.getElementById('posts-container') || document.getElementById('user-posts-container');

    if (!container) {
        setTimeout(() => loadPosts(targetUsername), 50);
        return;
    }

    try {
        const url = targetUsername ? `/api/posts/user/${targetUsername}` : '/api/posts';
        const [response, templateReq] = await Promise.all([
            fetch(url),
            fetch('/api/content/post-item')
        ]);

        if (response.ok && templateReq.ok) {
            const posts = await response.json();
            const templateHtml = await templateReq.text();
            container.innerHTML = '';

            const nameHeader = document.getElementById('profile-username-header');
            const picHeader = document.getElementById('profile-avatar-header');

            if (targetUsername && nameHeader) {
                nameHeader.innerText = `@${targetUsername}`;
                if (posts.length > 0 && picHeader) {
                    picHeader.src = posts[0].profile_pic;
                }
            }

            if (posts.length === 0) {
                container.innerHTML = '<p class="no-posts-msg">No posts to show yet.</p>';
                return;
            }

            for (const post of posts) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = templateHtml;
                const postEl = tempDiv.firstElementChild;

                postEl.dataset.postId = post.id;
                postEl.querySelector('.post-img-target').src = post.profile_pic;
                postEl.querySelector('.post-username-target').innerText = `@${post.username}`;
                postEl.querySelector('.post-link-target').href = `/profile/${post.username}`;
                postEl.querySelector('.post-text-target').innerText = post.content;
                postEl.querySelector('.post-date-target').innerText = new Date(post.date).toLocaleString();

                const countSpan = postEl.querySelector('.comment-count-target');
                if (countSpan) countSpan.innerText = post.commentCount || 0;

                const upSpan = postEl.querySelector('.upvote-count-target');
                const downSpan = postEl.querySelector('.downvote-count-target');
                const upBtn = postEl.querySelector('.upvote-btn');
                const downBtn = postEl.querySelector('.downvote-btn');

                upSpan.innerText = post.upvotes || 0;
                downSpan.innerText = post.downvotes || 0;

                if (post.user_vote === 'UPVOTE') upBtn.classList.add('upvoted');
                if (post.user_vote === 'DOWNVOTE') downBtn.classList.add('downvoted');

                upBtn.onclick = () => handleVote(post.id, 'UPVOTE', upSpan, downSpan, upBtn);
                downBtn.onclick = () => handleVote(post.id, 'DOWNVOTE', upSpan, downSpan, downBtn);

                container.appendChild(postEl);
            }
        }
    } catch (error) {
        console.error("Failed to load posts:", error);
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
            parent.querySelector('.upvote-btn').classList.toggle('upvoted', data.user_vote === 'UPVOTE');
            parent.querySelector('.downvote-btn').classList.toggle('downvoted', data.user_vote === 'DOWNVOTE');
        }
    } catch (e) { console.error("Vote failed", e); }
}