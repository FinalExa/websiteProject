let commentTemplateHtml = null;

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
        const dataResponse = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/posts/${postId}/comments`);
        if (!dataResponse.ok) return;
        const comments = await dataResponse.json();

        container.innerHTML = '';

        if (comments.length === 0) {
            container.innerHTML = '<p class="no-comments-msg">No comments yet.</p>';
            return;
        }

        if (!commentTemplateHtml) {
            const templateResponse = await fetch('/templates/comment_item.html');
            if (templateResponse.ok) {
                commentTemplateHtml = await templateResponse.text();
            } else {
                console.error("Failed to load comment_item.html component file.");
                return;
            }
        }

        comments.forEach(c => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = commentTemplateHtml;
            const commentEl = tempDiv.firstElementChild;

            const img = commentEl.querySelector('.comment-img-target');
            if (img) img.src = c.profile_pic || '/img/default-avatar.png';

            const usernameSpan = commentEl.querySelector('.comment-username-target');
            if (usernameSpan) usernameSpan.innerHTML = `<strong>${c.username}</strong>`;

            const textDiv = commentEl.querySelector('.comment-text-target');
            if (textDiv) textDiv.innerText = c.content;

            const link = commentEl.querySelector('.comment-link-target');
            if (link) link.href = `javascript:navigateTo('profile/${c.username}')`;

            container.appendChild(commentEl);
        });

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
        const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/posts/${postId}/comment`, {
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