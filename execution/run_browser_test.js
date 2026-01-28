
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('🚀 Starting Browser NLP Test...');
    const browser = await puppeteer.launch({
        headless: false, // Show browser for demonstration effect (though user can't see, good for debugging if we could) - actually let's keep it false or 'new' to be safe. Let's use false to ensure it renders fully. Be careful with headless in some environments.
        // Actually, headless: "new" is better. But let's use false if possible, but standard is headless.
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        // 1. Navigate
        console.log('🌐 Navigating to localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

        // 2. Upload File
        console.log('📂 Uploading file...');
        const filePath = path.resolve('f:\\vibeWork\\data-clean-ai\\nlp_test_data.csv');
        // Ensure file exists
        if (!fs.existsSync(filePath)) throw new Error('Test file not found: ' + filePath);

        // Find file input. Based on previous knowledge, it might be hidden or generic.
        // Let's look for input[type=file]
        const fileInput = await page.$('input[type="file"]');
        if (!fileInput) throw new Error('File input element not found');
        await fileInput.uploadFile(filePath);

        // Wait for preview. Look for a cell that contains "5000" (original price) or "antigravity"
        await page.waitForFunction(() => document.body.innerText.includes('antigravity'), { timeout: 5000 });
        console.log('✅ File uploaded and preview loaded.');

        // 3. NLP Command
        // Find textarea or input for NLP. Placeholder often contains "자연어로". Use that selector strategy.
        console.log('⌨️ Typing NLP command...');
        const promptInput = await page.$('textarea[placeholder*="자연어로"], input[placeholder*="자연어로"]');
        if (!promptInput) {
            // Fallback: looking for class names? No, too risky.
            // Let's try finding by placeholder text which is safer.
            // Or try to find the "실행" button's sibling input.
            throw new Error('NLP Prompt input not found');
        }

        await promptInput.type("price가 10000 이상이면 'High'로 바꿔줘");

        // Click Run button. Look for "실행" or play icon.
        // Button often has text "실행" or similar.
        const runBtn = await page.evaluateHandle(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.find(b => b.innerText.includes('실행') || b.innerText.includes('Run'));
        });

        if (runBtn) {
            await runBtn.click();
        } else {
            // Try pressing Enter
            await promptInput.press('Enter');
        }

        console.log('⏳ Waiting for processing...');
        // Wait for "150000" to become "High".
        // Or just wait 2 seconds.
        await new Promise(r => setTimeout(r, 3000));

        // 4. Verify
        const pageContent = await page.content();
        const passed = pageContent.includes('High');

        if (passed) {
            console.log('🎉 NLP Test PASSED: Found "High" in the table.');
        } else {
            console.error('❌ NLP Test FAILED: "High" not found.');
        }

        // 5. Screenshot
        const screenshotPath = path.resolve('f:\\vibeWork\\data-clean-ai\\nlp_test_result.png');
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`📸 Screenshot saved to: ${screenshotPath}`);

    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        await browser.close();
        console.log('🚪 Browser closed.');
    }
})();
