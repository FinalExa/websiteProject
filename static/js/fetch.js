async function loadExternalText() {
    try {
		const response = await fetch('/static/content.txt');
        
        if (!response.ok) {
            throw new Error('Could not find content.txt in the static folder');
        }

        const text = await response.text();

        document.getElementById('read-file-text').innerText = text;
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('read-file-text').innerText = "Failed to load content from file.";
    }
}