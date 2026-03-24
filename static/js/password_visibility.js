function togglePasswordVisibility() {
    const pass = document.getElementById("password");
    const confirm = document.getElementById("confirm_password");
    const type = pass.type === "password" ? "text" : "password";
    pass.type = type;
    confirm.type = type;
}