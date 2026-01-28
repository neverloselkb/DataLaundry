
import { processDataLocal } from '../src/lib/core/processors';

// Mock console.log to catch output if needed, or just rely on return value
const originalLog = console.log;
console.log = (...args) => {
    // originalLog(...args); 
};

/**
 * 정규식 로직 단위 테스트
 */
async function testRegexLogic() {
    originalLog("=== NLP Regex Logic Test ===");

    const mockData = [
        { id: '1', name: 'A', price: '500' },
        { id: '2', name: 'B', price: '15000' },
        { id: '3', name: 'C', price: '9000' },
        { id: '4', name: 'D', price: '25000' }
    ];

    const scenarios = [
        {
            name: "Basic Case: price가 10000 이상",
            prompt: "price가 10000 이상이면 'High'로 바꿔줘",
            expectedChange: true
        },
        {
            name: "No Space: price가10000 이상 (Check Regex Robustness)",
            prompt: "price가10000 이상이면 'High'로 바꿔줘",
            expectedChange: true // \s+가 있어서 실패할 수도 있음 -> \s*로 수정 필요 여부 확인
        },
        {
            name: "English Particle Failure Case (User Error): 가격이 10000 이상",
            prompt: "가격이 10000 이상이면 'High'로 바꿔줘",
            expectedChange: false // 컬럼명 불일치로 실패해야 함
        },
        {
            name: "Loose Space: price  가  10000  이상",
            prompt: "price  가  10000  이상이면 'High'로 바꿔줘",
            expectedChange: true
        }
    ];

    for (const scenario of scenarios) {
        originalLog(`\nTesting: ${scenario.name}`);
        // Deep copy data
        const data = JSON.parse(JSON.stringify(mockData));

        // Options: basic clean false, to isolate NLP
        const options = {
            removeWhitespace: false,
            removeSpecialCharacters: false,
            toLower: false,
            toUpper: false,
            capitalize: false,
            dateFormat: '',
            fillNull: '',
            removeDuplicates: false,
            autoDetect: false
        };

        const result = await processDataLocal(data, options, scenario.prompt);

        // Check Row 2 (price 15000)
        const row2 = result[1];
        const isChanged = row2['price'] === 'High';

        if (isChanged === scenario.expectedChange) {
            originalLog(`[PASS] Result: ${row2['price']} (Expected: ${scenario.expectedChange ? 'High' : '15000'})`);
        } else {
            originalLog(`[FAIL] Result: ${row2['price']} (Expected: ${scenario.expectedChange ? 'High' : '15000'})`);
        }
    }
}

testRegexLogic();
