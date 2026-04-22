function attachRegisterListener() {
    const form = document.getElementById('user-form');
    if (!form) return;

    form.removeEventListener('submit', handleRegistration);
    form.addEventListener('submit', handleRegistration);
}

async function handleRegistration(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('form-message');
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm_password').value;
    
    if (password !== confirm) {
        messageDiv.style.color = "red";
        messageDiv.style.fontWeight = "bold";
        messageDiv.innerText = "Error: Passwords do not match!";
        return; 
    }

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.style.color = "green";
            messageDiv.innerText = "Success! Account created.";
            e.target.reset();
        } else {
            messageDiv.style.color = "red";
            messageDiv.innerText = result.message;
        }
    } catch (error) {
        messageDiv.style.color = "red";
        messageDiv.innerText = "Server connection failed.";
    }
}