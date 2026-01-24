const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\58643a1c-e46d-41a8-b52c-191c9352806e\\data_clean_favicon_1769253081410.png';
const targets = [
    'f:\\vibeWork\\data-clean-ai\\public\\icon.png',
    'f:\\vibeWork\\data-clean-ai\\src\\app\\icon.png',
    'f:\\vibeWork\\data-clean-ai\\public\\favicon.ico'
];

targets.forEach(dest => {
    try {
        const dir = path.dirname(dest);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.copyFileSync(src, dest);
        console.log(`Copied for ${dest}`);
    } catch (e) {
        console.error(`Failed for ${dest}: ${e.message}`);
    }
});

const oldFavicon = 'f:\\vibeWork\\data-clean-ai\\src\\app\\favicon.ico';
if (fs.existsSync(oldFavicon)) {
    try {
        fs.unlinkSync(oldFavicon);
        console.log('Deleted old favicon.ico');
    } catch (e) {
        console.error(`Failed to delete ${oldFavicon}: ${e.message}`);
    }
}
