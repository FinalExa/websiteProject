async function loadLoginView() {
    const container = document.getElementById('auth-container');
    const title = document.getElementById('user-title');
    if (!container) return;

    try {
        const response = await fetch('/api/content/login-view');
        container.innerHTML = await response.text();
        if (title) title.innerText = "Login";
        attachLoginListener(); 
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
        if (title) title.innerText = "Create Account";
        attachRegisterListener(); // Ensure this is defined in process_data.js
    } catch (error) {
        console.error('Error loading register view:', error);
    }
}

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
				showToast("Welcome back!", "success");
				setTimeout(() => { navigateTo('user'); }, 1000);
			} else {
				showToast(result.message, "error");
			}
        } catch (error) {
            messageDiv.textContent = "Connection failed.";
            messageDiv.className = "text-error";
        }
    });
}

async function handleLogout() {
    try {
        const response = await fetch('/api/logout', { method: 'POST' });
        
        if (response.ok) {
            showToast("Logged out successfully", 'success');
            
            navigateTo('user');
        } else {
            showToast("Logout failed. Please try again.", 'error');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showToast("Connection error during logout.", 'error');
    }
}