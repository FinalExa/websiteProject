// navigation.js - Core SPA Navigation Logic

async function navigateTo(pageName) {
    const main = document.getElementById('main-content');
    const apiPath = `/api/content/${pageName}`;
    const displayPath = `/${pageName}`;

    // Update URL without refreshing
    if (window.location.pathname !== displayPath) {
        window.history.pushState({ page: pageName }, "", displayPath);
    }

    // Special handling for the User/Auth page
    if (pageName === 'user') {
        const authCheck = await fetch('/api/check-auth');
        const auth = await authCheck.json();

        if (auth.is_logged_in) {
            const response = await fetch('/api/content/personal-area');
            main.innerHTML = await response.text();
            const userDisplay = document.getElementById('display-username');
            if (userDisplay) userDisplay.innerText = auth.user;
            return; 
        }
    }

    try {
        const response = await fetch(apiPath);
        if (!response.ok) throw new Error('Page not found');
        const html = await response.text();
        main.innerHTML = html;
        
        // Initialize page-specific scripts
        if (pageName === 'home') {
            if (typeof updateClock === "function") updateClock();
            if (typeof loadExternalText === "function") loadExternalText();
        }
        
        if (pageName === 'user') {
            loadLoginView(); // Defined in auth.js
        }
    } catch (error) {
        console.error('Navigation error:', error);
    }
}

// Global Event Listeners
window.addEventListener('popstate', () => {
    const page = window.location.pathname.replace('/', '') || 'home';
    navigateTo(page);
});

document.getElementById('btn-home').addEventListener('click', () => navigateTo('home'));
document.getElementById('btn-about').addEventListener('click', () => navigateTo('about'));
document.getElementById('btn-contact').addEventListener('click', () => navigateTo('contact'));
document.getElementById('btn-user').addEventListener('click', () => navigateTo('user'));

window.addEventListener('DOMContentLoaded', () => {
    let initialPage = window.location.pathname.replace('/', '') || 'home';
    navigateTo(initialPage);
});