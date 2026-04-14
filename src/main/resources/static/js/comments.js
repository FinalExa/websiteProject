async function toggleComments(btn) {
    const postCard = btn.closest('.post-card');
    const section = postCard.querySelector('.comments-section');
    const postId = postCard.dataset.postId;
    const container = postCard.querySelector('.comments-container');

    if (section.style.display === 'none' || section.style.display === '') {
        section.style.display = 'block';
        await loadComments(postId, container);
    } else {
        section.style.display = 'none';
    }
}

async function loadComments(postId, container) {
    try {
        const [response, templateReq] = await Promise.all([
            fetch(`/api/posts/${postId}/comments`, {
                headers: { 'Accept': 'application/json' }
            }),
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

                commentEl.querySelector('.comment-avatar-target').src = c.profile_pic;
                commentEl.querySelector('.comment-username-target').innerText = `@${c.username}`;
                commentEl.querySelector('.comment-text-target').innerText = c.content;

                commentEl.querySelector('.comment-link-target').href = `/profile/${c.username}`;

                container.appendChild(commentEl);
            });
        } else {
            console.error(`Error: Data Status ${response.status}, Template Status ${templateReq.status}`);
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
    const countSpan = postCard.querySelector('.comment-count-target'); // This targets the "0 Comments" text

    if (!input.value.trim()) return;

    try {
        const response = await fetch(`/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ content: input.value })
        });

        if (response.ok) {
            input.value = '';
            await loadComments(postId, container);

            if (countSpan) {
                let currentCount = parseInt(countSpan.innerText) || 0;
                countSpan.innerText = currentCount + 1;
            }
        }
    } catch (error) {
        console.error("Comment submission error:", error);
    }
}