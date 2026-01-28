
// Simplified test for checkNLPTargetAmbiguity logic
function checkNLPTargetAmbiguity(prompt, headers = []) {
    const lowerPrompt = prompt.toLowerCase();
    const noiseWords = /^(패턴|문구|단어|텍스트|값|데이터|내용|항목|정보|필드|컬럼)$/;

    // 1. Original Regex (Requires particle)
    const targetMatches = Array.from(lowerPrompt.matchAll(/([가-힣a-zA-Z0-9_\(\)%_]+)(?:\s*(?:은|는|이|가|을|를|의|에서|컬럼|필드))/g));

    let hasValidTarget = targetMatches.some(m => {
        const target = m[1].toLowerCase();
        if (noiseWords.test(target)) return false;
        return headers.some(h => h.toLowerCase().includes(target) || target.includes(h.toLowerCase()));
    });

    // 2. [Improved] Token Matching (No particle required)
    if (!hasValidTarget && headers.length > 0) {
        const tokens = lowerPrompt.split(/\s+/);
        hasValidTarget = tokens.some(token => {
            const cleanToken = token.replace(/(은|는|이|가|을|를|의|에서)$/, '').trim();
            if (!cleanToken || noiseWords.test(cleanToken)) return false;

            return headers.some(h => {
                const lowerH = h.toLowerCase();
                return lowerH === cleanToken || (cleanToken.length >= 2 && lowerH.includes(cleanToken));
            });
        });
    }

    return { hasValidTarget };
}

// Test Cases
const headers = ["price", "grade", "address"];

console.log("Testing Ambiguity Check...");
console.log("1. 'price가 10000 이상' (With particle):", checkNLPTargetAmbiguity("price가 10000 이상", headers).hasValidTarget);
console.log("2. 'price 10000 이상' (No particle):", checkNLPTargetAmbiguity("price 10000 이상", headers).hasValidTarget);
console.log("3. 'grade 비어있으면' (No particle):", checkNLPTargetAmbiguity("grade 비어있으면", headers).hasValidTarget);
console.log("4. '없는컬럼 10000 이상' (Invalid col):", checkNLPTargetAmbiguity("foo 10000 이상", headers).hasValidTarget);
console.log("5. '값 변경해줘' (Ambiguous):", checkNLPTargetAmbiguity("값 변경해줘", headers).hasValidTarget);
