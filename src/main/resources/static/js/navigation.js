async function updateNavigation(forceData = null) {
    try {
        const data = forceData || await (await fetch('/api/check-auth')).json();
        const loggedInNav = document.getElementById('logged-in-nav');
        const userBtn = document.getElementById('btn-user');
        const isUserCenter = window.location.pathname === '/user_center';


        if (data.is_logged_in) {
            if (loggedInNav) loggedInNav.style.display = 'block'; // Show My Profile
            if (userBtn) userBtn.innerText = "User Center";
        } else {
            if (loggedInNav) loggedInNav.style.display = 'none'; // Hide My Profile
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
        if (pageName.startsWith('profile/')) {
            const username = pageName.split('/')[1];
            const response = await fetch(`/api/public-profile/${username}`);
            if (!response.ok) throw new Error('Profile not found');
            main.innerHTML = await response.text();

            if (typeof userPosts === 'function') {
                userPosts(username);
            }
        }
        else if (pageName === 'user_center') {
            const response = await fetch('/api/content/personal-area');
            main.innerHTML = await response.text();
        }
        else {
            const response = await fetch(`/api/content/${pageName}`);
            if (!response.ok) throw new Error('Page not found');
            main.innerHTML = await response.text();

            if (pageName === 'home' && typeof loadPosts === "function") loadPosts();
            if (pageName === 'user' && !auth.is_logged_in && typeof loadLoginView === "function") loadLoginView();
        }
    } catch (error) {
        console.error('Navigation error:', error);
    }

    await updateNavigation(auth);
}

document.getElementById('btn-user').addEventListener('click', () => {
    navigateTo('user_center');
});

window.addEventListener('popstate', () => {
    const path = window.location.pathname.startsWith('/') ? window.location.pathname.substring(1) : window.location.pathname;
    const page = path || 'home';
    navigateTo(page);
});

window.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.startsWith('/') ? window.location.pathname.substring(1) : window.location.pathname;
    const initialPage = path || 'home';
    navigateTo(initialPage);
});

async function goToMyPublicProfile() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        if (data.is_logged_in && data.user) {
            navigateTo(`profile/${data.user}`);
        } else {
            navigateTo('user');
        }
    } catch (error) {
        console.error("Error redirecting to profile:", error);
    }
}