const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '.env.local');
let apiKey = '';

try {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=(.+)/);
        if (match) {
            apiKey = match[1].trim().replace(/['"]/g, '');
        }
    }
} catch (e) { }

if (!apiKey) {
    console.error("No API Key found");
    process.exit(1);
}

async function check() {
    console.log("Checking v1beta models...");
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!res.ok) {
            console.log(`Error: ${res.status} ${res.statusText}`);
            const txt = await res.text();
            console.log(txt);
            return;
        }
        const data = await res.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.name.includes("gemini")) console.log(m.name);
            });
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

check();
