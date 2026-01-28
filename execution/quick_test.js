
// Mock regex logic from processors.ts
function testRegex(prompt) {
    console.log(`\nTesting: "${prompt}"`);
    const lowerPrompt = prompt.toLowerCase();

    // The regex we implemented
    const conditionRegex = /(.+?)(?:이|가|은|는)?\s+([\d,]+)\s*(이상|이하|초과|미만|보다\s*크면|보다\s*작으면|와\s*같으면)\s*(?:이면|라면)?\s*['"]?([^'"]+)['"]?(?:(으)로)?\s*(?:바꿔|변경|치환|수정)/g;

    const matches = Array.from(lowerPrompt.matchAll(conditionRegex));
    console.log(`Matches found: ${matches.length}`);

    matches.forEach(m => {
        let col = m[1].toLowerCase().trim();
        col = col.replace(/(이|가|은|는)$/, '');

        const val = parseFloat(m[2].replace(/,/g, ''));
        const opStr = m[3];
        let target = m[4];
        target = target.replace(/['"]/g, '').trim();

        console.log(`[Captured] Col: "${col}", Val: ${val}, Op: "${opStr}", Target: "${target}"`);
    });
}

// Scenarios
testRegex("price가 10000 이상이면 'High'로 바꿔줘"); // Normal
testRegex("price가10000 이상이면 'High'로 바꿔줘"); // No Space (Will fail with \s+)
testRegex("가격이 10000 이상이면 'High'로 바꿔줘"); // Korean Name
testRegex("price 10000 이상이면 'High'로 바꿔줘"); // No Particle
