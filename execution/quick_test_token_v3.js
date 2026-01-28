
function testTokenLogicV3(prompt) {
    console.log(`\n---------------------------------------------------`);
    console.log(`Testing: "${prompt}"`);
    const lowerPrompt = prompt.toLowerCase();
    // Split by whitespace
    const tokens = lowerPrompt.split(/\s+/);

    const numericConditions = [];

    // Iterate tokens to find patterns: [Column] ... [Value] [Operator] ... [Target]
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // Try to parse token as number (removing commas)
        // Must start with digit
        if (/^[\d,]+$/.test(token)) {
            const valNum = parseFloat(token.replace(/,/g, ''));
            if (!isNaN(valNum)) {
                // Found a VALUE (Anchor). Now look around.

                // Look NEXT for Operator (within next 2 tokens)
                let operator = null;
                for (let j = 1; j <= 2 && i + j < tokens.length; j++) {
                    const next = tokens[i + j];
                    if (next.includes('이상') || next.includes('크거나')) operator = 'ge';
                    else if (next.includes('이하') || next.includes('작거나')) operator = 'le';
                    else if (next.includes('초과') || next.includes('크면')) operator = 'gt';
                    else if (next.includes('미만') || next.includes('작으면')) operator = 'lt';
                    else if (next.includes('같으면') || next.includes('동일')) operator = 'eq';
                    if (operator) break;
                }

                if (operator) {
                    // Look PREV for Column (immediate prev, stripping particles)
                    let col = "";
                    if (i > 0) {
                        let prev = tokens[i - 1];
                        prev = prev.replace(/(이|가|은|는)$/, '');
                        col = prev.trim();
                    }

                    // Look for Target Value
                    // Strategy: Find closest ACTION keyword AFTER current token
                    let target = "";
                    let actionIdx = -1;

                    // Expanded keywords: 바꾸, 설정, 하 (to catch '바꾸고', '설정해', '해줘')
                    // Regex: /바꿔|바꾸|변경|치환|수정|설정/
                    for (let k = i + 1; k < tokens.length; k++) {
                        if (/바꿔|바꾸|변경|치환|수정|설정/.test(tokens[k])) {
                            actionIdx = k;
                            break; // Take the closest one
                        }
                    }

                    if (actionIdx !== -1) {
                        let possible = tokens[actionIdx - 1];
                        // Remove trailing '로' or '으로'
                        // Handling quotes inside the token if stuck together
                        const quoteMatch = possible.match(/['"]([^'"]+)['"]/);
                        if (quoteMatch) {
                            target = quoteMatch[1];
                        } else {
                            target = possible.replace(/(으)?로$/, '');
                        }
                    } else {
                        // Fallback: if no action keyword found, maybe it's at the end?
                        // Or try global quote search if not found locally? 
                        // For now let's rely on action keyword.
                    }

                    if (col && target && valNum !== undefined) {
                        console.log(`[FOUND] Col: "${col}", Val: ${valNum}, Op: "${operator}", Target: "${target}"`);
                        numericConditions.push({ column: col, value: valNum, operator: operator, targetValue: target });
                        // NO BREAK here! Continue to find more patterns.
                    }
                }
            }
        }
    }

    if (numericConditions.length === 0) console.log("[NOT FOUND]");
}

// Scenarios
testTokenLogicV3("price가 10000 이상이면 'High'로 바꿔줘");
testTokenLogicV3("price 10000 이상이면 High로 바꾸고"); // 복합 문장 앞부분 테스트
testTokenLogicV3("price 10000 이상이면 High로 바꾸고, grade 비어있으면..."); 
