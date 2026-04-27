async function submitPost() {
    const content = document.getElementById('post-content').value;
    const fileInput = document.getElementById('post-image-file');

    const file = fileInput.files ? fileInput.files[0] : null;

    if (file && file.size > 8 * 1024 * 1024) {
        if (typeof showToast === 'function') {
            showToast("File is too large! Maximum size is 10MB.", "error");
        } else {
            alert("File is too large! Maximum size is 10MB.");
        }
        return;
    }

    if (!content.trim() && !file) {
        return;
    }

    const formData = new FormData();
    formData.append('content', content);
    if (file) {
        formData.append('file', file);
    }

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            document.getElementById('post-content').value = '';
            fileInput.value = '';
            document.getElementById('post-image-preview-container').style.display = 'none';

            if (typeof showToast === 'function') showToast("Post created!", "success");

            setTimeout(() => {
                if (typeof loadHomeFeed === 'function') loadHomeFeed();
            }, 300);
        } else if (response.status === 413) {
            if (typeof showToast === 'function') showToast("Server rejected the file size.", "error");
        }
    } catch (e) {
        console.error("Error posting:", e);
        if (typeof showToast === 'function') showToast("An error occurred during upload.", "error");
    }
}

function renderPost(templateHtml, post) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = templateHtml;

    const fragment = document.createDocumentFragment();

    const shareIndicator = tempDiv.querySelector('.share-indicator');
    if (post.shared_post && shareIndicator) {
        shareIndicator.style.display = 'block';
        shareIndicator.querySelector('.sharer-name-target').innerText = post.username;
        fragment.appendChild(shareIndicator);
    }

    const postEl = tempDiv.querySelector('.post-card');
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

    const textTarget = postEl.querySelector('.post-text-target');
    const imageViewport = postEl.querySelector('.post-image-viewport');
    const contentImg = postEl.querySelector('.post-content-image');
    const nestedContainer = postEl.querySelector('.nested-post-container');

    if (post.content && post.content.trim() !== "") {
        textTarget.innerText = post.content;
        textTarget.style.display = 'block';
    } else {
        textTarget.style.display = 'none';
    }

    if (post.image_url) {
        if (imageViewport && contentImg) {
            imageViewport.style.display = 'block';
            contentImg.src = post.image_url;
        }
    } else if (imageViewport) {
        imageViewport.style.display = 'none';
    }

    if (post.shared_post && nestedContainer) {
        nestedContainer.style.display = 'block';

        const previewDiv = document.createElement('div');
        previewDiv.className = 'original-post-preview';
        previewDiv.style.cssText = 'border: 1px solid #e0e0e0; border-left: 4px solid #007bff; padding: 10px; margin-top: 10px; background: #fafafa; border-radius: 4px; cursor: pointer;';

        let originalImgHtml = post.shared_post.image_url
            ? `<img src="${post.shared_post.image_url}" style="max-width:100%; max-height:150px; display:block; margin-top:5px; object-fit:contain;">`
            : '';

        previewDiv.innerHTML = `
            <strong>@${post.shared_post.username}</strong>
            <p>${post.shared_post.content || ""}</p>
            ${originalImgHtml}
        `;

        const originalId = post.shared_post.id;
        previewDiv.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (originalId) navigateTo(`post/${originalId}`);
        };

        nestedContainer.innerHTML = '';
        nestedContainer.appendChild(previewDiv);
    } else if (nestedContainer) {
        nestedContainer.style.display = 'none';
    }

    const upSpan = postEl.querySelector('.upvote-count-target');
    const downSpan = postEl.querySelector('.downvote-count-target');
    const commentSpan = postEl.querySelector('.comment-count-target');

    if (upSpan) upSpan.innerText = post.upvotes || 0;
    if (downSpan) downSpan.innerText = post.downvotes || 0;
    if (commentSpan) commentSpan.innerText = post.commentCount || 0;

    const upBtn = postEl.querySelector('.upvote-btn');
    const downBtn = postEl.querySelector('.downvote-btn');
    if (upBtn) upBtn.onclick = (e) => { e.stopPropagation(); handleVote(post.id, 'UPVOTE', upSpan, downSpan, upBtn); };
    if (downBtn) downBtn.onclick = (e) => { e.stopPropagation(); handleVote(post.id, 'DOWNVOTE', upSpan, downSpan, downBtn); };

    fragment.appendChild(postEl);
    return fragment;
}

function previewPostImage(input) {
    const container = document.getElementById('post-image-preview-container');
    const img = document.getElementById('post-image-preview');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
            container.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    } else {
        container.style.display = 'none';
    }
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
                const postWrapper = renderPost(templateHtml, post);
                container.appendChild(postWrapper);
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

            const postWrapper = renderPost(templateHtml, post);
            const postCard = postWrapper.querySelector('.post-card');
            postCard.onclick = null;
            postCard.style.cursor = 'default';
            target.appendChild(postWrapper);

            const commentBtn = postCard.querySelector('.comment-toggle-btn');
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

function toggleShareBox(btn) {
    const postCard = btn.closest('.post-card');
    const shareBox = postCard.querySelector('.share-textbox');
    shareBox.style.display = shareBox.style.display === 'none' ? 'flex' : 'none';
    if (shareBox.style.display === 'flex') {
        shareBox.querySelector('.share-input').focus();
    }
}


async function submitShare(btn) {
    const postCard = btn.closest('.post-card');
    const postId = postCard.dataset.postId;
    const caption = postCard.querySelector('.share-input').value;

    try {
        const response = await fetch(`/api/posts/${postId}/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: caption })
        });

        if (response.ok) {
            postCard.querySelector('.share-textbox').style.display = 'none';
            if (typeof showToast === 'function') showToast("Post shared!", "success");

            if (typeof loadHomeFeed === 'function') loadHomeFeed();
            else loadPosts();
        }
    } catch (e) {
        console.error("Share failed", e);
    }
}