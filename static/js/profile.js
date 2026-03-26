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
            // Optional: Reload the page to see the new picture
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        console.error("Upload failed:", error);
        showToast("Server error during upload", "error");
    }
}