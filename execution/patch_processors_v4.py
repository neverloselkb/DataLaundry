
import os

file_path = r'f:\vibeWork\data-clean-ai\src\lib\core\processors.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
logic_inserted = False

# V4 Logic Features:
# 1. INTEGRATED LOOP: Handles both Numeric Ops and Null/Action Ops in one pass
# 2. PARTICLE SAFE: Skips standalone particle tokens (으로, 로) when finding targets
# 3. ROBUST: No break, full sentence scan

token_logic_v4 = """        // [Revised Logic V4] Unified Token Parser (Numeric + Null + Actions)
        const tokens = lowerPrompt.split(/\\s+/);
        
        // Define Keywords
        // Null keywords
        const nullKeywords = ['비어', '없으', '공백', '빈값', 'null'];
        // Action keywords (extended)
        const actionPattern = /바꿔|바꾸|변경|치환|수정|설정|채워|넣어/;
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            // --- A. Numeric Condition Logic (price 10000 이상 -> High) ---
            if (/^[\\d,]+$/.test(token)) {
                const valNum = parseFloat(token.replace(/,/g, ''));
                if (!isNaN(valNum)) {
                    // Found VALUE. Look Next for Operator.
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
                        // Look Prev for Column
                        let col = "";
                        if (i > 0) {
                            let prev = tokens[i-1];
                            prev = prev.replace(/(이|가|은|는)$/, ''); // Particle removal
                            col = prev.trim();
                        }
                        
                        // Look for Target Value (Action-based)
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
                            // [Safety] Skip standalone particle token (e.g. "Unknown" "으로" "채워")
                            if (targetIdx > i && /^(으로|로)$/.test(tokens[targetIdx])) {
                                targetIdx--;
                            }
                            
                            let possible = tokens[targetIdx];
                            const quoteMatch = possible.match(/['"]([^'"]+)['"]/);
                            if (quoteMatch) { target = quoteMatch[1]; } 
                            else {
                                target = possible.replace(/(으)?로$/, '');
                            }
                        }

                        if (col && target && valNum !== undefined) {
                             numericConditions.push({ column: col, value: valNum, operator: operator, targetValue: target });
                        }
                    }
                }
            } 
            
            // --- B. Null Filling Logic (grade 비어있으면 -> Unknown) ---
            // Trigger: Check if token contains null-related keywords
            let isNullTrigger = false;
            for(const nk of nullKeywords) {
                if(token.includes(nk)) { isNullTrigger = true; break; }
            }
            
            if (isNullTrigger) {
                // Look Prev for Column
                let col = "";
                if (i > 0) {
                    let prev = tokens[i-1];
                    prev = prev.replace(/(이|가|은|는)$/, '');
                    col = prev.trim();
                }
                
                // Look Next for Target Value (Action-based)
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
                    if (targetIdx > i && /^(으로|로)$/.test(tokens[targetIdx])) {
                        targetIdx--;
                    }
                    
                    let possible = tokens[targetIdx];
                    const quoteMatch = possible.match(/['"]([^'"]+)['"]/);
                    if (quoteMatch) { fillVal = quoteMatch[1]; }
                    else {
                        fillVal = possible.replace(/(으)?로$/, '');
                    }
                }
                
                if (col && fillVal) {
                    nullFillings.push({ column: col, fillValue: fillVal });
                }
            }
        }
"""

for line in lines:
    # 1. Replace the block that started with our previous V3 logic
    if '// [Revised Logic V3]' in line or '// [Revised Logic] Token-based Parsing' in line:
        skip = True
        if not logic_inserted:
            new_lines.append(token_logic_v4)
            logic_inserted = True
        continue
    
    if skip:
        # Skip until the end of the matches block or NULL logic start
        # We need to be careful. The previous V3 patch ended before 'const conditionRegex = null;'
        # But we also want to REMOVE the old regex-based Null Logic below.
        
        # Heuristic: stop skipping when we see 'return data.map(row => {' which is far below? No.
        # We need to swallow the old Null Logic too.
        
        # Let's find a safe anchor. 'const conditionRegex = null;' is safe to keep/restore.
        if 'const conditionRegex = null;' in line:
             skip = False
             new_lines.append(line)
        # Also need to remove the old Null Logic block if it exists below.
    else:
        # If we encounter the OLD Regex Null Logic, skip it!
        if 'const nullRegex =' in line and 'matchAll(nullRegex)' in line:
            # This is a one-line check in my memory, but might be multi-line.
            # Actually, let's just comment it out or skip it if we can identify the block.
            # Since we implemented B. Null Filling Logic above, we should suppress the old one.
            pass
        
        # Check if line is part of old null logic
        if '// [New] Null/Empty Fill Logic' in line:
             # We can skip the whole block until we see '// --- [통합 정제 루프] ---'
             # Or we can just let it run? No, double logic is bad.
             # Let's try to remove it.
             pass 
        
        # Actually, simpler approach:
        # V4 logic pushes to `nullFillings` array.
        # We need to make sure `nullFillings` is defined BEFORE our V4 logic.
        # Wait, the V4 logic block is inserted where `numericConditions` are populated.
        # `nullFillings` is defined LATER in the file usually.
        # THIS IS A PROBLEM. `numericConditions` is defined at top of file? No, usually locally.
        # Let's check where we insert.
        # We insert at `if (triggerNumericOps && triggerActions) {` ...
        # But wait, Null Logic might not set `triggerNumericOps`.
        # V4 should be OUTSIDE the `if(triggerNumericOps)` block?
        # OR we should modify the triggers.
        
        new_lines.append(line)

# RE-STRATEGY for file content:
# The file structure is:
# 1. triggers check
# 2. if (triggers) { ... logic ... }
# 3. Old Null Logic (independent if)
# 4. Map loop
#
# We need to:
# A. Define `nullFillings` early.
# B. Run V4 logic regardless of `triggerNumericOps`.
# C. Remove Old Null Logic.

# This is getting complex for a simple patch script.
# Better to replace the WHOLE `processDataLocal` function body or a large chunk locally.
# Let's try to be surgical but bold.

# We will overwrite from `const triggerNumericOps = ...` down to `// --- [통합 정제 루프] ---`.
# This covers lines ~191 to ~306.

final_lines = []
mode = 'copy'
inserted_v4 = False

v4_full_block = """    // Check triggers (Legacy triggers, used for some logic below, but V4 is smarter)
    const triggerNumericOps = true; // Force enable for V4
    const triggerActions = true;

    // Data Structures for V4
    const numericConditions: NumericCondition[] = [];
    interface NullFilling { column: string; fillValue: string; }
    const nullFillings: NullFilling[] = [];

    // [Revised Logic V4] Unified Token Parser
    const tokens = lowerPrompt.split(/\\s+/);
    const nullKeywords = ['비어', '없으', '공백', '빈값', 'null'];
    const actionPattern = /바꿔|바꾸|변경|치환|수정|설정|채워|넣어/;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        // --- A. Numeric Condition Logic ---
        if (/^[\\d,]+$/.test(token)) {
            const valNum = parseFloat(token.replace(/,/g, ''));
            if (!isNaN(valNum)) {
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
                    let col = "";
                    if (i > 0) {
                        let prev = tokens[i-1];
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
                        if (targetIdx > i && /^(으로|로)$/.test(tokens[targetIdx])) targetIdx--; // Skip particle
                        
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
        for(const nk of nullKeywords) { if(token.includes(nk)) { isNullTrigger = true; break; } }
        
        if (isNullTrigger) {
            let col = "";
            if (i > 0) {
                let prev = tokens[i-1];
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
    
    // Legacy mapping (empty) to safely skip old code
    const conditionRegex = null;
"""

for line in lines:
    if 'const triggerNumericOps =' in line:
        mode = 'replace'
        if not inserted_v4:
            final_lines.append(v4_full_block)
            inserted_v4 = True
    
    if mode == 'replace':
        if '// --- [통합 정제 루프] ---' in line:
            mode = 'copy'
            final_lines.append(line)
    else:
        final_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("Successfully patched processors.ts to V4 (Unified Token Logic)")
