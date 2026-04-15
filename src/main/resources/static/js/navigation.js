async function updateNavigation(forceData = null) {
    try {
        const data = forceData || await (await fetch('/api/check-auth')).json();
        const loggedInNav = document.getElementById('logged-in-nav');
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

    // Redirect to login if trying to access user_center while logged out
    if (pageName === 'user_center' && !auth.is_logged_in) {
        pageName = 'user';
    }

    const displayPath = `/${pageName}`;
    if (window.location.pathname !== displayPath) {
        window.history.pushState({ page: pageName }, "", displayPath);
    }

    try {
        let contentUrl;
        let profileUser = null;
        let postId = null;

        // Routing Logic
        if (pageName === 'user_center') {
            contentUrl = `/api/content/personal_area_content`;
        } else if (pageName.startsWith('profile/')) {
            profileUser = pageName.split('/')[1];
            contentUrl = `/api/content/user_profile_public`;
        } else if (pageName.startsWith('post/')) {
            postId = pageName.split('/')[1];
            contentUrl = `/api/content/post_view`;
        } else {
            contentUrl = `/api/content/${pageName}`;
        }

        const response = await fetch(contentUrl);
        if (!response.ok) throw new Error('Page not found');
        main.innerHTML = await response.text();

        if (postId) {
            loadSinglePost(postId);
        } else if (profileUser) {
            loadPosts(profileUser);
        } else if (pageName === 'home') {
            loadPosts();
        } else if (pageName === 'user' && !auth.is_logged_in) {
            loadLoginView();
        } else if (pageName === 'user_center') {
            const userDisplay = document.getElementById('display-username');
            if (userDisplay) userDisplay.innerText = auth.user;

            try {
                const dataResponse = await fetch('/api/data');
                if (dataResponse.ok) {
                    const userData = await dataResponse.json();
                    const picDisplay = document.getElementById('display-profile-pic');
                    if (picDisplay && userData.profile_pic) {
                        picDisplay.src = userData.profile_pic + "?v=" + Date.now();
                    }
                }
            } catch (e) {
                console.error("Failed to load user profile data", e);
            }
        }

    } catch (error) {
        console.error('Navigation error:', error);
        main.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }

    await updateNavigation(auth);
}

document.getElementById('btn-user').addEventListener('click', () => {
    navigateTo('user_center');
});

window.addEventListener('popstate', () => {
    const path = window.location.pathname.substring(1) || 'home';
    navigateTo(path);
});

window.addEventListener('DOMContentLoaded', () => {
    let path = window.location.pathname.replace(/^\/+/g, '');
    const initialPage = path || 'home';
    navigateTo(initialPage);
});

async function goToMyPublicProfile() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        if (data.is_logged_in && data.user) {
            navigateTo(`profile/${data.user}`);
        }
    } catch (e) {
        console.error("Profile navigation failed", e);
    }
}