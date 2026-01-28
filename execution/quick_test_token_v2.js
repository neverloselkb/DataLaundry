
// Simplified token logic test based on patched code
function testTokenLogic(prompt) {
    console.log(`\nTesting: "${prompt}"`);
    const lowerPrompt = prompt.toLowerCase();
    const tokens = lowerPrompt.split(/\s+/);

    let found = false;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (/^[\d,]+$/.test(token)) {
            const valNum = parseFloat(token.replace(/,/g, ''));
            if (!isNaN(valNum)) {
                let operator = null;
                for (let j = 1; j <= 2 && i + j < tokens.length; j++) {
                    const next = tokens[i + j];
                    if (next.includes('이상') || next.includes('크거나')) operator = 'ge';
                    else if (next.includes('이하') || next.includes('작거나')) operator = 'le';

                    if (operator) break;
                }

                if (operator) {
                    let col = "";
                    if (i > 0) {
                        let prev = tokens[i - 1];
                        prev = prev.replace(/(이|가|은|는)$/, '');
                        col = prev.trim();
                    }

                    let target = "";
                    const targetMatch = prompt.match(/['"]([^'"]+)['"]/);
                    if (targetMatch) {
                        target = targetMatch[1];
                    } else {
                        const actionIndex = tokens.findIndex(t => /바꿔|변경/.test(t));
                        if (actionIndex > i) {
                            let possible = tokens[actionIndex - 1];
                            possible = possible.replace(/(으)?로$/, '');
                            target = possible;
                        }
                    }

                    console.log(`[FOUND] Col: "${col}", Val: ${valNum}, Op: "${operator}", Target: "${target}"`);
                    found = true;
                    break;
                }
            }
        }
    }
    if (!found) console.log("[NOT FOUND]");
}

// Scenarios
testTokenLogic("price가 10000 이상이면 'High'로 바꿔줘");
testTokenLogic("price 10000 이상이면 'High'로 바꿔줘");
testTokenLogic("price  10000  이상이면 High로 바꿔줘");
testTokenLogic("price가10000 이상"); // 붙여쓰기는 실패함 (정상)
