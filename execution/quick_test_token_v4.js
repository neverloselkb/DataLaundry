
function testTokenLogicV4(prompt) {
    console.log(`\n---------------------------------------------------`);
    console.log(`Testing: "${prompt}"`);
    const lowerPrompt = prompt.toLowerCase();

    // [Revised Logic V4] Unified Token Parser
    const tokens = lowerPrompt.split(/\s+/);
    const nullKeywords = ['비어', '없으', '공백', '빈값', 'null'];
    const actionPattern = /바꿔|바꾸|변경|치환|수정|설정|채워|넣어/;

    const numericConditions = [];
    const nullFillings = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // --- A. Numeric Condition Logic ---
        if (/^[\d,]+$/.test(token)) {
            const valNum = parseFloat(token.replace(/,/g, ''));
            if (!isNaN(valNum)) {
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
                    let col = "";
                    if (i > 0) {
                        let prev = tokens[i - 1];
                        prev = prev.replace(/(이|가|은|는)$/, '');
                        col = prev.trim();
                    }

                    let target = "";
                    let actionIdx = -1;
                    for (let k = i + 1; k < tokens.length; k++) {
                        if (actionPattern.test(tokens[k])) {
                            actionIdx = k;
                            break;
                        }
                    }

                    if (actionIdx !== -1 && actionIdx > i) {
                        let targetIdx = actionIdx - 1;
                        // [Safety] Skip standalone particle
                        if (targetIdx > i && /^(으로|로)$/.test(tokens[targetIdx])) targetIdx--;

                        let possible = tokens[targetIdx];
                        const quoteMatch = possible.match(/['"]([^'"]+)['"]/);
                        if (quoteMatch) { target = quoteMatch[1]; }
                        else { target = possible.replace(/(으)?로$/, ''); }
                    }

                    if (col && target && valNum !== undefined) {
                        numericConditions.push({ column: col, value: valNum, operator: operator, targetValue: target });
                    }
                }
            }
        }

        // --- B. Null Filling Logic ---
        let isNullTrigger = false;
        for (const nk of nullKeywords) { if (token.includes(nk)) { isNullTrigger = true; break; } }

        if (isNullTrigger) {
            let col = "";
            if (i > 0) {
                let prev = tokens[i - 1];
                prev = prev.replace(/(이|가|은|는)$/, '');
                col = prev.trim();
            }

            let fillVal = "";
            let actionIdx = -1;
            for (let k = i + 1; k < tokens.length; k++) {
                if (actionPattern.test(tokens[k])) {
                    actionIdx = k;
                    break;
                }
            }

            if (actionIdx !== -1 && actionIdx > i) {
                let targetIdx = actionIdx - 1;
                // [Safety] Skip standalone particle
                if (targetIdx > i && /^(으로|로)$/.test(tokens[targetIdx])) targetIdx--;
                let possible = tokens[targetIdx];
                const quoteMatch = possible.match(/['"]([^'"]+)['"]/);
                if (quoteMatch) { fillVal = quoteMatch[1]; }
                else { fillVal = possible.replace(/(으)?로$/, ''); }
            }

            if (col && fillVal) {
                nullFillings.push({ column: col, fillValue: fillVal });
            }
        }
    }

    console.log("Numeric Conditions:", JSON.stringify(numericConditions));
    console.log("Null Fillings:", JSON.stringify(nullFillings));
}

// Scenarios
testTokenLogicV4("price 10000 이상이면 High로 바꾸고, grade 비어있으면 Unknown으로 채워");
testTokenLogicV4("price 10000 이상이면 High로 바꾸고, grade 비어있으면 Unknown 으로 채워"); // 띄어쓰기 된 '으로'
