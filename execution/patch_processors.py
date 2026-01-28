
import os
import re

file_path = r'f:\vibeWork\data-clean-ai\src\lib\core\processors.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
logic_inserted = False

token_logic = """        // [Revised Logic] Token-based Parsing (No more complex Regex)
        const tokens = lowerPrompt.split(/\\s+/);
        
        // Iterate tokens to find patterns: [Column] ... [Value] [Operator] ... [Target]
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            // Try to parse token as number (removing commas)
            if (/^[\\d,]+$/.test(token)) {
                const valNum = parseFloat(token.replace(/,/g, ''));
                if (!isNaN(valNum)) {
                    let operator = null; // 'ge' | 'le' | 'gt' | 'lt' | 'eq'
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
                        let col = "";
                        if (i > 0) {
                            let prev = tokens[i-1];
                            prev = prev.replace(/(이|가|은|는)$/, '');
                            col = prev.trim();
                        }
                        
                        let target = "";
                        const quoteMatch = lowerPrompt.match(/['"]([^'"]+)['"]/);
                        if (quoteMatch) { target = quoteMatch[1]; } 
                        else {
                            const actionIdx = tokens.findIndex(t => /바꿔|변경|치환|수정/.test(t));
                            if (actionIdx > i) {
                                let possible = tokens[actionIdx - 1];
                                possible = possible.replace(/(으)?로$/, '');
                                target = possible;
                            }
                        }

                        if (col && target && valNum !== undefined) {
                             numericConditions.push({ column: col, value: valNum, operator: operator, targetValue: target });
                             break;
                        }
                    }
                }
            }
        }
"""

for line in lines:
    # Start of the block to replace
    if 'const conditionRegex =' in line:
        skip = True
        if not logic_inserted:
            new_lines.append(token_logic)
            logic_inserted = True
        continue
    
    if skip:
        # Check for the end of the block.
        # The block consists of regex def -> matches def -> matches.forEach loop.
        # The loop ends with '        });' (8 spaces indent)
        # We need to skip everything until we see the closing brace of the Loop or the IF block.
        # The safest bet is: we are inside `if (triggerNumericOps && triggerActions) {`
        # So we skip until we see a line that is just '    }' (4 spaces indent), which closes the IF.
        if line.strip() == '}' and line.startswith('    }'): # This closes the IF block
             skip = False
             new_lines.append(line) # Add the closing brace of IF
        # Else: just skip
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully patched processors.ts")
