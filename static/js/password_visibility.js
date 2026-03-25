function togglePasswordVisibility() {
    const passInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm_password');
    const checkbox = document.getElementById('toggle-pass');
    
    const type = checkbox.checked ? 'text' : 'password';
    passInput.type = type;
    if(confirmInput) confirmInput.type = type;
}