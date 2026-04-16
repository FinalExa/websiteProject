function renderPost(templateHtml, post) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = templateHtml;
    const postEl = tempDiv.firstElementChild;

    postEl.dataset.postId = post.id;
    postEl.onclick = () => navigateTo(`post/${post.id}`);

    const pic = post.profile_pic || '/img/default-avatar.png';
    postEl.querySelector('.post-img-target').src = pic;
    postEl.querySelector('.post-username-target').innerText = post.username;

    const link = postEl.querySelector('.post-link-target');
    link.href = "#";
    link.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigateTo(`profile/${post.username}`);
    };

    postEl.querySelector('.post-text-target').innerText = post.content;

    const upSpan = postEl.querySelector('.upvote-count-target');
    const downSpan = postEl.querySelector('.downvote-count-target');
    if (upSpan) upSpan.innerText = post.upvotes || 0;
    if (downSpan) downSpan.innerText = post.downvotes || 0;

    return postEl;
}

async function loadPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;

    try {
        const [response, templateReq] = await Promise.all([
            fetch('/api/posts'),
            fetch('/api/content/post-item')
        ]);

        if (response.ok && templateReq.ok) {
            const posts = await response.json();
            const templateHtml = await templateReq.text();
            container.innerHTML = '';

            for (const post of posts) {
                const postEl = await renderPost(templateHtml, post);
                container.appendChild(postEl);
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

            const postEl = await renderPost(templateHtml, post);
            postEl.onclick = null;
            postEl.style.cursor = 'default';
            target.appendChild(postEl);

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

function openShareModal(btn) {
    const postCard = btn.closest('.post-card');
    const postId = postCard.dataset.postId;
    const caption = prompt("Write something about this post...");

    if (caption !== null) {
        performShare(postId, caption);
    }
}

async function performShare(originalPostId, caption) {
    try {
        const response = await fetch(`/api/posts/${originalPostId}/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: caption })
        });

        if (response.ok) {
            if (typeof showToast === 'function') {
                showToast("Post shared successfully!", "success");
            }
            loadPosts();
        }
    } catch (e) {
        console.error("Share failed", e);
    }
}