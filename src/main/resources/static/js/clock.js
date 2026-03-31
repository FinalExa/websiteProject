function updateClock() {
	const clockElement = document.getElementById('clock');
	if (!clockElement) return;
	
    const now = new Date();
    
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let seconds = now.getSeconds().toString().padStart(2, '0');
    
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    clockElement.textContent = timeString;
}

updateClock();
setInterval(updateClock, 1000);

async function getBackendMessage() {
    const response = await fetch('/api/data');
    const data = await response.json();
    console.log("Message from Python:", data.message);
    // You could inject data.message into your .main-text div here!
}

getBackendMessage();