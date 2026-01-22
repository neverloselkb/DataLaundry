export { };
const localPrompt = "'Address' 컬럼의 [%4d]원을 빈칸으로 변경";
const lowerPrompt = localPrompt.toLowerCase();

// Current regex
const mappingRegex = /([\[\]%A-Za-z0-9가-힣_\-]+)\s*(?:데이터|값|문구|텍스트|형식|패턴)?(?:\s*의)?\s*(?:데이터|값|문구|텍스트)?\s*(?:는|은|->|:|를|을)\s*([\[\]%A-Za-z0-9가-힣_\-\s]+)/g;
let matches = Array.from(lowerPrompt.matchAll(mappingRegex));

console.log('--- Greedy Regex Results ---');
console.log('Matches found:', matches.length);
matches.forEach((m, i) => {
    console.log(`Match ${i}: Group1: "${m[1]}", Group2: "${m[2]}"`);
});

// Non-greedy regex
const nonGreedyRegex = /([\[\]%A-Za-z0-9가-힣_\-]+?)\s*(?:데이터|값|문구|텍스트|형식|패턴)?(?:\s*의)?\s*(?:데이터|값|문구|텍스트)?\s*(?:는|은|->|:|를|을)\s*([\[\]%A-Za-z0-9가-힣_\-\s]+)/g;
matches = Array.from(lowerPrompt.matchAll(nonGreedyRegex));

console.log('\n--- Non-Greedy Regex Results ---');
console.log('Matches found:', matches.length);
matches.forEach((m, i) => {
    console.log(`Match ${i}: Group1: "${m[1]}", Group2: "${m[2]}"`);
});
