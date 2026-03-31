async function navigateTo(pageName) {
    const main = document.getElementById('main-content');
    
    const authCheck = await fetch('/api/check-auth');
    const auth = await authCheck.json();

    if (!auth.is_logged_in && pageName !== 'user') {
        window.history.replaceState({ page: 'user' }, "", "/user");
        pageName = 'user'; 
    }

    updateNavVisibility(auth.is_logged_in, pageName);
	
    if (auth.is_logged_in && pageName === 'user') {
        const response = await fetch('/api/content/personal-area');
        main.innerHTML = await response.text();
        
        if (window.location.pathname !== '/user') {
            window.history.pushState({ page: 'user' }, "", "/user");
        }

        const userDisplay = document.getElementById('display-username');
        if (userDisplay) userDisplay.innerText = auth.user;
        return;
    }
	
    const apiPath = `/api/content/${pageName}`;
    const displayPath = `/${pageName}`;

    if (window.location.pathname !== displayPath) {
        window.history.pushState({ page: pageName }, "", displayPath);
    }

    try {
        const response = await fetch(`/api/content/${pageName}`);
        
        if (response.status === 401) {
            navigateTo('user');
            return;
        }

        if (!response.ok) throw new Error('Page not found');
        const html = await response.text();
        main.innerHTML = html;
        
        if (pageName === 'home') {
            if (typeof updateClock === "function") updateClock();
            if (typeof loadPosts === "function") loadPosts(); 
        }
        
        if (pageName === 'user' && !auth.is_logged_in) {
            loadLoginView(); 
        }
    } catch (error) {
        console.error('Navigation error:', error);
    }
}

document.getElementById('btn-user').addEventListener('click', async () => {
    const authCheck = await fetch('/api/check-auth');
    const auth = await authCheck.json();

    if (!auth.is_logged_in) {
        navigateTo('user');
    } else {
        const isCurrentlyOnAccount = window.location.pathname.includes('user');
        if (isCurrentlyOnAccount) {
            navigateTo('home');
        } else {
            navigateTo('user');
        }
    }
});

window.addEventListener('popstate', () => {
    const page = window.location.pathname.replace('/', '') || 'home';
    navigateTo(page);
});

window.addEventListener('DOMContentLoaded', () => {
    const initialPage = window.location.pathname.replace('/', '') || 'home';
    navigateTo(initialPage);
});

function updateNavVisibility(isLoggedIn, currentPage) {
    const userBtn = document.getElementById('btn-user');
    if (!userBtn) return;

    if (!isLoggedIn) {
        userBtn.innerText = "Login";
    } else {
        const onAccount = currentPage ? (currentPage === 'user') : window.location.pathname.includes('user');
        userBtn.innerText = onAccount ? "Back to Feed" : "My Account";
    }
}