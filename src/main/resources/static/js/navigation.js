async function updateNavigation(forceData = null) {
    try {
        const data = forceData || await (await fetch('/api/check-auth')).json();

        const loggedInNav = document.getElementById('logged-in-nav') || document.getElementById('loggedInNav');
        const userBtn = document.getElementById('btn-user');
        const homeFeedBtn = document.getElementById('home-feed'); // Target the Home Feed button

        if (data.is_logged_in) {
            document.body.dataset.currentUser = data.user;
            if (loggedInNav) loggedInNav.style.display = 'block';
            if (homeFeedBtn) homeFeedBtn.style.display = 'block';
            if (userBtn) userBtn.innerText = "User Center";
        } else {
            if (loggedInNav) loggedInNav.style.display = 'none';
            if (homeFeedBtn) homeFeedBtn.style.display = 'none';
            if (userBtn) userBtn.innerText = "Login";
        }
    } catch (error) {
        console.error("Auth check failed", error);
    }
}

async function navigateTo(pageName) {
    const main = document.getElementById('main-content');
    if (!main) return;

    const authCheck = await fetch('/api/check-auth');
    const auth = await authCheck.json();

    if (!auth.is_logged_in && pageName !== 'user') {
        pageName = 'user';
    }

    const displayPath = `/${pageName}`;
    if (window.location.pathname !== displayPath) {
        window.history.pushState({ page: pageName }, "", displayPath);
    }

    try {
        const response = await fetch(`/api/content/${pageName}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();

        if (pageName === 'user') {
            main.innerHTML = `<div class="auth-wrapper"><h2 id="user-title">Login</h2><div id="auth-container"></div></div>`;
            if (typeof loadLoginView === 'function') await loadLoginView();
        } else {
            main.innerHTML = html;
        }

        if (pageName === 'user_center') {
            fetch('/api/data').then(res => res.json()).then(data => {
                const userField = document.getElementById('display-username');
                const picField = document.getElementById('display-profile-pic');
                if (userField) userField.innerText = data.user;
                if (picField) picField.src = data.profile_pic + "?v=" + Date.now();
            });
        }
        else if (pageName === 'home') {
            if (typeof loadHomeFeed === 'function') loadHomeFeed();
        }
        else if (pageName.includes('profile/')) {
            const username = pageName.split('/').pop();
            fetch(`/api/user-info/${username}`).then(res => res.json()).then(data => {
                const nameHeader = document.getElementById('profile-username-header');
                const picHeader = document.getElementById('profile-avatar-header');
                if (nameHeader) nameHeader.innerText = data.username;
                if (picHeader) picHeader.src = data.profile_pic;
            });
            if (typeof loadProfilePosts === 'function') loadProfilePosts(username);
        }

        else if (pageName.includes('post/')) {
            const postId = pageName.split('/').pop();
            const container = document.getElementById('single-post-target');

            if (container) {
                try {
                    const [postRes, templateRes] = await Promise.all([
                        fetch(`/api/posts/${postId}`),
                        fetch('/api/content/post-item')
                    ]);

                    const postData = await postRes.json();
                    const templateHtml = await templateRes.text();

                    container.innerHTML = '';
                    container.appendChild(renderPost(templateHtml, postData));
                } catch (err) {
                    console.error("Error loading single post:", err);
                    container.innerHTML = "<p>Error loading post.</p>";
                }
            }
        }

        await updateNavigation(auth);

    } catch (e) {
        console.error("Navigation error:", e);
        main.innerHTML = `<div class="error">Failed to load ${pageName}</div>`;
    }
}

async function loadPostsIntoContainer(apiUrl, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
        const [postsReq, templateReq] = await Promise.all([
            fetch(apiUrl),
            fetch('/api/content/post-item')
        ]);
        const posts = await postsReq.json();
        const templateHtml = await templateReq.text();
        container.innerHTML = posts.length === 0 ? '<p>No posts found.</p>' : '';
        posts.forEach(post => {
            container.appendChild(renderPost(templateHtml, post));
        });
    } catch (e) { console.error("Failed to load posts", e); }
}

function loadHomeFeed() {
    loadPostsIntoContainer('/api/posts', 'posts-container');
}

async function goToMyPublicProfile() {
    const res = await fetch('/api/check-auth');
    const data = await res.json();
    if (data.is_logged_in) {
        navigateTo(`profile/${data.user}`);
    } else {
        navigateTo('user');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-user')?.addEventListener('click', () => navigateTo('user_center'));

    document.getElementById('btn-my-profile')?.addEventListener('click', (e) => {
        e.preventDefault();
        goToMyPublicProfile();
    });

    const path = window.location.pathname.replace(/^\/+/g, '') || 'home';
    navigateTo(path);
});

window.addEventListener('popstate', () => {
    const path = window.location.pathname.substring(1) || 'home';
    navigateTo(path);
});