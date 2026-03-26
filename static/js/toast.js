function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close-btn">&times;</button>
    `;

    container.appendChild(toast);

    toast.querySelector('.toast-close-btn').onclick = () => {
        removeToast(toast);
    };

    setTimeout(() => {
        removeToast(toast);
    }, 4000);
}

function removeToast(toast) {
    if (!toast) return;
    toast.classList.add('fade-out');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 500);
}