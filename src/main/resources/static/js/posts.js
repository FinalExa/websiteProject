function renderPost(templateHtml, post) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = templateHtml;
    const postEl = tempDiv.firstElementChild;

    postEl.dataset.postId = post.id;
    postEl.onclick = () => navigateTo(`post/${post.id}`);

    const pic = post.profile_pic || '/img/default-avatar.png';
    postEl.querySelector('.post-img-target').src = pic;
    postEl.querySelector('.post-username-target').innerText = post.username;
    postEl.querySelector('.post-link-target').href = `javascript:navigateTo('profile/${post.username}')`;

    const rawDate = post.date || post.date_posted || post.datePosted;
    if (rawDate) {
        postEl.querySelector('.post-date-target').innerText = new Date(rawDate).toLocaleString();
    }

    postEl.querySelector('.post-text-target').innerText = post.content;

    const upSpan = postEl.querySelector('.upvote-count-target');
    const downSpan = postEl.querySelector('.downvote-count-target');
    const commentSpan = postEl.querySelector('.comment-count-target');

    if (upSpan) upSpan.innerText = post.upvotes || 0;
    if (downSpan) downSpan.innerText = post.downvotes || 0;
    if (commentSpan) commentSpan.innerText = post.commentCount || 0;

    const upBtn = postEl.querySelector('.upvote-btn');
    const downBtn = postEl.querySelector('.downvote-btn');
    const commentBtn = postEl.querySelector('.comment-toggle-btn');

    if (upBtn) {
        upBtn.onclick = (e) => {
            e.stopPropagation();
            handleVote(post.id, 'UPVOTE', upSpan, downSpan, upBtn);
        };
    }

    if (downBtn) {
        downBtn.onclick = (e) => {
            e.stopPropagation();
            handleVote(post.id, 'DOWNVOTE', upSpan, downSpan, downBtn);
        };
    }

    if (commentBtn) {
        commentBtn.onclick = (e) => {
            e.stopPropagation();
            toggleComments(commentBtn);
        };
    }

    return postEl;
}

async function loadPosts(targetUsername = null) {
    const container = document.getElementById('posts-container') || document.getElementById('user-posts-container');
    if (!container) return;

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

            for (const post of posts) {
                container.appendChild(renderPost(templateHtml, post));
            }
        }
    } catch (error) {
        console.error("Failed to load posts:", error);
    }
}

async function loadSinglePost(postId) {
    const target = document.getElementById('single-post-target');
    if (!target) return;

    try {
        const [response, templateReq] = await Promise.all([
            fetch(`/api/posts/${postId}`),
            fetch('/api/content/post-item')
        ]);

        if (response.ok && templateReq.ok) {
            const post = await response.json();
            const templateHtml = await templateReq.text();
            target.innerHTML = '';
            const postEl = renderPost(templateHtml, post);
            postEl.onclick = null;
            postEl.style.cursor = 'default';
            target.appendChild(postEl);

            // Auto-open comments in single view
            const commentBtn = postEl.querySelector('.comment-toggle-btn');
            if (commentBtn) toggleComments(commentBtn);
        }
    } catch (error) {
        console.error("Failed to load single post:", error);
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