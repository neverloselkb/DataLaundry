
import os

file_path = r'f:\vibeWork\data-clean-ai\src\lib\core\processors.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
logic_inserted = False

# This V3 logic includes:
# 1. Expanded Action Keywords (바꿔|바꾸|변경|치환|수정|설정)
# 2. NO BREAK after finding a condition (to support multi-conditions)
# 3. Dynamic Target Search (Find closest action AFTER current token)

token_logic_v3 = """        // [Revised Logic V3] Token-based Parsing (Support Multi & Complex Sentences)
        const tokens = lowerPrompt.split(/\\s+/);
        
        // Iterate tokens to find patterns
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            // Try to parse token as number (removing commas)
            if (/^[\\d,]+$/.test(token)) {
                const valNum = parseFloat(token.replace(/,/g, ''));
                if (!isNaN(valNum)) {
                    // Found a VALUE. Look around.
                    
                    // Look NEXT for Operator
                    let operator = null;
                    for (let j = 1; j <= 2 && i + j < tokens.length; j++) {
                        const next = tokens[i+j];
                        if (next.includes('이상') || next.includes('크거나')) operator = 'ge';
                        else if (next.includes('이하') || next.includes('작거나')) operator = 'le';
                        else if (next.includes('초과') || next.includes('크면')) operator = 'gt';
                        else if (next.includes('미만') || next.includes('작으면')) operator = 'lt';
                        else if (next.includes('같으면') || next.includes('동일')) operator = 'eq';
                        if (operator) break;
                    }
                    
                    if (operator) {
                        // Look PREV for Column
                        let col = "";
                        if (i > 0) {
                            let prev = tokens[i-1];
                            prev = prev.replace(/(이|가|은|는)$/, '');
                            col = prev.trim();
                        }
                        
                        // Look for Target Value: Find closest ACTION keyword AFTER current token
                        let target = "";
                        let actionIdx = -1;
                        
                        // Expanded keywords: 바꾸, 설정, 하 (to catch '바꾸고', '설정해')
                        for (let k = i + 1; k < tokens.length; k++) {
                            if (/바꿔|바꾸|변경|치환|수정|설정/.test(tokens[k])) {
                                actionIdx = k;
                                break; // Take the closest one
                            }
                        }

                        if (actionIdx !== -1) {
                            let possible = tokens[actionIdx - 1];
                            const quoteMatch = possible.match(/['"]([^'"]+)['"]/);
                            if (quoteMatch) { target = quoteMatch[1]; } 
                            else {
                                target = possible.replace(/(으)?로$/, '');
                            }
                        }

                        if (col && target && valNum !== undefined) {
                             numericConditions.push({ column: col, value: valNum, operator: operator, targetValue: target });
                             // NO BREAK! Continue to find more conditions in the same prompt.
                        }
                    }
                }
            }
        }
"""

for line in lines:
    # We target the previous V2 logic start to replace it
    if '// [Revised Logic] Token-based Parsing' in line:
        skip = True
        if not logic_inserted:
            new_lines.append(token_logic_v3)
            logic_inserted = True
        continue
    
    if skip:
        # We need to skip until we see the "Disable old regex logic" part or the closing of the previous block.
        # The previous block ended with "        // const matches = Array.from(lowerPrompt.matchAll(conditionRegex));"
        # Let's just look for the line that says "const conditionRegex = null;" which was part of our V2 patch.
        if 'const conditionRegex = null;' in line:
             skip = False
             new_lines.append(line)
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully patched processors.ts to V3")
