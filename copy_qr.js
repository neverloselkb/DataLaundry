const fs = require('fs');
const path = require('path');

const source = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\1d6fe99f-2366-4975-a6b5-a3acc054393f\\uploaded_image_1769095781371.png';
const destination = 'f:\\vibeWork\\data-clean-ai\\public\\kakaopay-qr.png';

try {
    fs.copyFileSync(source, destination);
    console.log('Successfully copied to ' + destination);
} catch (err) {
    console.error('Error copying file:', err);
    process.exit(1);
}
