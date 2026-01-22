const prompt = "'Address' 컬럼의 [%3d]원 형식의 데이터는 빈칸으로 변경 해줘";
const lowerPrompt = prompt.toLowerCase();

// Test the character class used in Group 1
const charClassRegex = /[\[\]%A-Za-z0-9가-힣_\-]+/g;
const matches = Array.from(lowerPrompt.matchAll(charClassRegex));

console.log('Matches found:', matches.length);
matches.forEach((m, i) => {
    console.log(`Match ${i}: "${m[0]}"`);
});
