const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '.env.local');
let apiKey = '';

try {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        // Try precise match first, then loose
        const match = envContent.match(/^GEMINI_API_KEY=(.+)$/m) || envContent.match(/^GOOGLE_GENERATIVE_AI_API_KEY=(.+)$/m);
        if (match) {
            apiKey = match[1].trim();
            // Remove quotes if present
            if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
                apiKey = apiKey.slice(1, -1);
            }
        }
    }
} catch (e) {
    console.error("Error reading .env.local:", e);
}

if (!apiKey) {
    console.error("❌ API Key could not be found in .env.local");
    console.log("Please ensure GEMINI_API_KEY is set in .env.local");
    process.exit(1);
}

console.log(`🔑 API Key found (starts with: ${apiKey.substring(0, 4)}...)`);

const versions = ['v1', 'v1beta'];

function checkVersion(version) {
    return new Promise((resolve) => {
        const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`\n=== [${version}] Available Models ===`);
                    if (json.models) {
                        const candidates = json.models.filter(m =>
                            m.supportedGenerationMethods &&
                            m.supportedGenerationMethods.includes('generateContent') &&
                            m.name.includes('gemini')
                        );

                        if (candidates.length > 0) {
                            candidates.forEach(m => console.log(`- ${m.name}`));
                        } else {
                            console.log("No 'generateContent' capable Gemini models found.");
                        }
                    } else {
                        console.log("⚠️ Error or No models:", json);
                    }
                } catch (e) {
                    console.error(`Error parsing response for ${version}:`, data);
                }
                resolve();
            });
        }).on('error', (e) => {
            console.error(`Network error for ${version}:`, e.message);
            resolve();
        });
    });
}

async function run() {
    await checkVersion('v1');
    await checkVersion('v1beta');
}

run();
