async function navigateTo(pageName) {
    const main = document.getElementById('main-content');
	
    const authCheck = await fetch('/api/check-auth');
    const auth = await authCheck.json();

    updateNavVisibility(auth.is_logged_in);

    if (!auth.is_logged_in) {
        if (pageName !== 'user') {
            window.history.replaceState({ page: 'user' }, "", "/user");
            pageName = 'user'; 
        }
    }

    if (auth.is_logged_in && pageName === 'user') {
        const response = await fetch('/api/content/personal-area');
        main.innerHTML = await response.text();
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
        const response = await fetch(apiPath);
        if (!response.ok) throw new Error('Page not found');
        const html = await response.text();
        main.innerHTML = html;
        
        if (pageName === 'home') {
            if (typeof updateClock === "function") updateClock();
			loadPosts();
            if (typeof loadExternalText === "function") loadExternalText();
        }
        
        if (pageName === 'user' && !auth.is_logged_in) {
            loadLoginView(); 
        }
    } catch (error) {
        console.error('Navigation error:', error);
    }
}

window.addEventListener('popstate', () => {
    const page = window.location.pathname.replace('/', '') || 'home';
    navigateTo(page);
});

document.getElementById('btn-home').addEventListener('click', () => navigateTo('home'));
document.getElementById('btn-about').addEventListener('click', () => navigateTo('about'));
document.getElementById('btn-contact').addEventListener('click', () => navigateTo('contact'));
document.getElementById('btn-user').addEventListener('click', () => navigateTo('user'));

window.addEventListener('DOMContentLoaded', () => {
    const initialPage = window.location.pathname.replace('/', '') || 'home';
    navigateTo(initialPage);
});

function updateNavVisibility(isLoggedIn) {
    const centerGroup = document.querySelector('.center-group');
    if (centerGroup) {
        centerGroup.style.display = isLoggedIn ? 'flex' : 'none';
    }
}