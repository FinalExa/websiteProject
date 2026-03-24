async function navigateTo(pageName) {
    const main = document.getElementById('main-content');
    const apiPath = `/api/content/${pageName}`;
    const displayPath = `/${pageName}`;

    try {
        const response = await fetch(apiPath);
        if (!response.ok) throw new Error('Page not found');
        const html = await response.text();
        
        main.innerHTML = html;

        if (window.location.pathname !== displayPath) {
            window.history.pushState({ page: pageName }, "", displayPath);
        }

        // Handle specific page logic
        if (pageName === 'home') {
            if (typeof updateClock === "function") updateClock();
            if (typeof loadExternalText === "function") loadExternalText();
        }
		
        // When landing on the 'user' shell, load the login view by default
		if (pageName === 'user') {
            if (typeof loadLoginView === "function") {
                loadLoginView();
            }
		}
    } catch (error) {
        console.error('Navigation error:', error);
    }
}

// Logic for switching views within the User page
async function loadLoginView() {
    const container = document.getElementById('auth-container');
    const title = document.getElementById('user-title');
    if (!container) return;

    try {
        const response = await fetch('/api/content/login-view');
        container.innerHTML = await response.text();
        title.innerText = "Login";
        
        // attachLoginListener(); // You can add this once the login API is ready
    } catch (error) {
        console.error('Error loading login view:', error);
    }
}

async function loadRegisterView() {
    const container = document.getElementById('auth-container');
    const title = document.getElementById('user-title');
    if (!container) return;

    try {
        const response = await fetch('/api/content/register-view');
        container.innerHTML = await response.text();
        title.innerText = "Create Account";
        
        // Re-attach the registration submit listener
        if (typeof attachRegisterListener === "function") {
            attachRegisterListener();
        }
    } catch (error) {
        console.error('Error loading register view:', error);
    }
}

window.addEventListener('popstate', (event) => {
    const page = window.location.pathname.replace('/', '') || 'home';
    navigateTo(page);
});

document.getElementById('btn-home').addEventListener('click', () => navigateTo('home'));
document.getElementById('btn-about').addEventListener('click', () => navigateTo('about'));
document.getElementById('btn-contact').addEventListener('click', () => navigateTo('contact'));
document.getElementById('btn-user').addEventListener('click', () => navigateTo('user'));

window.addEventListener('DOMContentLoaded', () => {
    let initialPage = window.location.pathname.replace('/', '');
    if (!initialPage || initialPage === "") {
        initialPage = 'home';
    }
    navigateTo(initialPage);
});

function attachLoginListener() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageDiv = document.getElementById('form-message');
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                messageDiv.textContent = result.message;
                messageDiv.style.color = "green";

                setTimeout(() => {
                    navigateTo('user'); 
                }, 1000);

            } else {
                messageDiv.textContent = result.message;
                messageDiv.style.color = "red";
            }
        } catch (error) {
            messageDiv.textContent = "Connection failed.";
            messageDiv.style.color = "red";
        }
    });
}

async function loadLoginView() {
    const container = document.getElementById('auth-container');
    const title = document.getElementById('user-title');
    if (!container) return;

    try {
        const response = await fetch('/api/content/login-view');
        container.innerHTML = await response.text();
        title.innerText = "Login";
        
        attachLoginListener(); 
    } catch (error) {
        console.error('Error loading login view:', error);
    }
}

async function navigateTo(pageName) {
    const main = document.getElementById('main-content');
    let apiPath = `/api/content/${pageName}`;
    const displayPath = `/${pageName}`;

	if (pageName === 'home') {
		if (typeof updateClock === "function") updateClock();
		if (typeof loadExternalText === "function") loadExternalText();
	}
	
    if (pageName === 'user') {
        const authCheck = await fetch('/api/check-auth');
        const auth = await authCheck.json();

        if (auth.is_logged_in) {
            const response = await fetch('/api/content/personal-area');
            main.innerHTML = await response.text();
            document.getElementById('display-username').innerText = auth.user;
            return; // Exit here
        }
    }

    try {
        const response = await fetch(apiPath);
        if (!response.ok) throw new Error('Page not found');
        const html = await response.text();
        main.innerHTML = html;
        
        if (pageName === 'user') {
            loadLoginView();
        }
    } catch (error) {
        console.error('Navigation error:', error);
    }
}

async function handleLogout() {
    const response = await fetch('/api/logout', { method: 'POST' });
    if (response.ok) {
        navigateTo('user');
    }
}

async function updateNavbar() {
    const userBtn = document.getElementById('btn-user');
    try {
        const response = await fetch('/api/check-auth');
        const auth = await response.json();

        if (auth.is_logged_in) {
            userBtn.textContent = "My Account";
        } else {
            userBtn.textContent = "Login";
        }
    } catch (e) {
        console.error("Navbar update failed", e);
    }
}