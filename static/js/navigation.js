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

        if (pageName === 'home') {
            if (typeof updateClock === "function") updateClock();
            if (typeof loadExternalText === "function") loadExternalText();
        }
		
		if (pageName === 'user') {
			if (typeof attachRegisterListener === "function") {
				attachRegisterListener();
			}
		}
    } catch (error) {
        console.error('Navigation error:', error);
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