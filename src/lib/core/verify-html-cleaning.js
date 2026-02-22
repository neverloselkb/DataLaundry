
const { processDataLocal } = require('./processors');

// Mock data based on user report
const mockData = [
    { '비고': '<p>문의드립니다</p>', 'Other': 'Test1' },
    { '비고': '<p>재고확인요망</p>', 'Other': 'Test2' },
    { '비고': '<div>반품신청</div>', 'Other': 'Test3' },
    { '비고': '<span>배송지연</span>', 'Other': 'Test4' },
    { '비고': '<strong>급함</strong>', 'Other': 'Test5' },
    { '비고': '<br>연락주세요', 'Other': 'Test6' }
];

// Options with HTML removal enabled
const options = {
    removeHtml: true,
    autoDetect: false, // User said autoDetect might be off
    removeWhitespace: false,
    // ... all other false
};

console.log("--- Input Data ---");
console.table(mockData);

try {
    const result = processDataLocal(
        mockData,
        '', // prompt
        options,
        [], // lockedColumns
        {}  // columnOptions
    );

    console.log("\n--- Processed Result (removeHtml: true) ---");
    console.table(result);

    // Validation
    const failed = result.filter(row => /<[^>]+>/.test(row['비고']));
    if (failed.length > 0) {
        console.error("\n[FAIL] HTML tags still present in:", failed);
        process.exit(1);
    } else {
        console.log("\n[PASS] All HTML tags removed.");
    }

} catch (e) {
    console.error("Execution Error:", e);
    process.exit(1);
}
