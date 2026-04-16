async function updateNavigation(forceData = null) {
    try {
        const data = forceData || await (await fetch('/api/check-auth')).json();

        // FIX: Check both common naming conventions to be safe
        const loggedInNav = document.getElementById('logged-in-nav') || document.getElementById('loggedInNav');
        const userBtn = document.getElementById('btn-user');

        if (data.is_logged_in) {
            if (loggedInNav) loggedInNav.style.display = 'block';
            if (userBtn) userBtn.innerText = "User Center";
        } else {
            if (loggedInNav) loggedInNav.style.display = 'none';
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

    if (pageName === 'user_center' && !auth.is_logged_in) {
        pageName = 'user';
    }

    const displayPath = `/${pageName}`;
    if (window.location.pathname !== displayPath) {
        window.history.pushState({ page: pageName }, "", displayPath);
    }

    try {
        // We use the full pageName (e.g., 'profile/username')
        // Your Java controller needs @GetMapping("/api/content/{page}/**") to handle this
        let contentUrl = `/api/content/${pageName}`;

        const response = await fetch(contentUrl);
        if (!response.ok) throw new Error("Page not found");

        const html = await response.text();
        main.innerHTML = html;

        // DATA LOADING LOGIC
        if (pageName === 'home') {
            loadHomeFeed();
        } else if (pageName.startsWith('profile/')) {
            const username = pageName.split('/')[1];
            loadPublicProfile(username);
        } else if (pageName.startsWith('post/')) {
            const postId = pageName.split('/')[1];
            if (typeof loadSinglePost === 'function') loadSinglePost(postId);
        } else if (pageName === 'user_center') {
            const nameDisp = document.getElementById('display-username');
            if (nameDisp) nameDisp.innerText = auth.user;
            loadUserCenterData();
        }

    } catch (error) {
        console.error('Navigation error:', error);
        main.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }

    await updateNavigation(auth);
}

async function loadPublicProfile(username) {
    try {
        const response = await fetch(`/api/user-info/${username}`);
        if (response.ok) {
            const data = await response.json();
            const headerName = document.getElementById('profile-username-header');
            const headerPic = document.getElementById('profile-avatar-header');
            if (headerName) headerName.innerText = data.username;
            if (headerPic) headerPic.src = data.profile_pic || '/img/default-avatar.png';
        }
    } catch (e) { console.error("Profile header error", e); }

    loadPostsIntoContainer(`/api/posts?username=${username}`, 'user-posts-container');
}

async function loadUserCenterData() {
    const res = await fetch('/api/data');
    if (res.ok) {
        const data = await res.json();
        const pic = document.getElementById('display-profile-pic');
        if (pic && data.profile_pic) pic.src = data.profile_pic + "?v=" + Date.now();
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

// FIX: Ensure the "Go to Profile" logic is correctly mapped
async function goToMyPublicProfile() {
    const res = await fetch('/api/check-auth');
    const data = await res.json();
    if (data.is_logged_in) {
        navigateTo(`profile/${data.user}`);
    } else {
        navigateTo('user');
    }
}

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    // User Center Button
    document.getElementById('btn-user')?.addEventListener('click', () => navigateTo('user_center'));

    // THE MISSING LINK: The "Go to Profile" button listener
    // Make sure your button in index.html has id="btn-go-to-profile" or similar
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