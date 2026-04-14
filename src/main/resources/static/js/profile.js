async function uploadPic() {
    const fileInput = document.getElementById('pic-upload');
    if (!fileInput || fileInput.files.length === 0) {
        showToast("Please select an image first", "error");
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch('/api/upload-profile-pic', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (response.ok) {
            showToast(result.message, "success");
            const currentAvatar = document.querySelector('.current-avatar');
            if (currentAvatar && result.newPath) {
                currentAvatar.src = result.newPath + '?t=' + new Date().getTime();
            }
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        console.error("Upload failed:", error);
        showToast("Server error during upload", "error");
    }
}