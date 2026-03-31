function checkPasswordStrength() {
    const password = document.getElementById('password').value;
    const meter = document.getElementById('strength-meter');
    const text = document.getElementById('strength-text');
    
    // Exact same criteria as the backend
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);

    let strength = 0;
    if (hasLength) strength++;
    if (hasUpper && hasLower) strength++;
    if (hasNumber) strength++;
    if (hasSpecial) strength++;

    const colors = ["#ff4d4d", "#ffa64d", "#ffff4d", "#4dff4d"];
    const labels = ["Too Weak", "Weak", "Fair", "Strong (Ready!)"];

    if (password === "") {
        meter.style.width = "0%";
        text.innerText = "";
    } else {
        meter.style.width = (strength / 4) * 100 + "%";
        meter.style.backgroundColor = colors[strength - 1] || colors[0];
        text.innerText = labels[strength - 1] || labels[0];
    }
}