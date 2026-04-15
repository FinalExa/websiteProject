async function toggleComments(btn) {
    const postCard = btn.closest('.post-card');
    const section = postCard.querySelector('.comments-section');
    const postId = postCard.dataset.postId;
    const container = postCard.querySelector('.comments-container');

    if (section.style.display === 'none' || section.style.display === '') {
        section.style.display = 'block';
        if (postId && container) {
            await loadComments(postId, container);
        }
    } else {
        section.style.display = 'none';
    }
}

async function loadComments(postId, container) {
    if (!postId || postId === "undefined" || !container) return;

    try {
        const [response, templateReq] = await Promise.all([
            fetch(`/api/posts/${postId}/comments`),
            fetch('/api/content/comment-item')
        ]);

        if (response.ok && templateReq.ok) {
            const comments = await response.json();
            const templateHtml = await templateReq.text();

            container.innerHTML = '';

            if (comments.length === 0) {
                container.innerHTML = '<p class="no-comments-msg">No comments yet.</p>';
                return;
            }

            comments.forEach(c => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = templateHtml;
                const commentEl = tempDiv.firstElementChild;

                const img = commentEl.querySelector('.comment-img-target');
                if (img) img.src = c.profile_pic || '/img/default-avatar.png';

                const user = commentEl.querySelector('.comment-username-target');
                if (user) user.innerText = c.username;

                const text = commentEl.querySelector('.comment-text-target');
                if (text) text.innerText = c.content;

                const link = commentEl.querySelector('.comment-link-target');
                if (link) link.href = `javascript:navigateTo('profile/${c.username}')`;

                container.appendChild(commentEl);
            });
        }
    } catch (error) {
        console.error("Error loading comments:", error);
    }
}

async function submitComment(btn) {
    const postCard = btn.closest('.post-card');
    const input = postCard.querySelector('.comment-input');
    const postId = postCard.dataset.postId;
    const container = postCard.querySelector('.comments-container');
    const countSpan = postCard.querySelector('.comment-count-target');

    if (!input.value.trim() || !postId) return;

    try {
        const response = await fetch(`/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: input.value })
        });

        if (response.ok) {
            input.value = '';
            await loadComments(postId, container);
            if (countSpan) {
                let current = parseInt(countSpan.innerText) || 0;
                countSpan.innerText = current + 1;
            }
        }
    } catch (error) {
        console.error("Comment submission failed:", error);
    }
}