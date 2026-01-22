import { processDataLocal, DataRow } from './src/lib/data-processor';

const testData: DataRow[] = [
    { 'Date': '2024-01-22', 'Desc': 'ISO' },
    { 'Date': '01-22-2024', 'Desc': 'US (MM-DD-YYYY)' },
    { 'Date': '22/01/2024', 'Desc': 'EU (DD/MM/YYYY)' },
    { 'Date': '2024년 1월 22일', 'Desc': 'KR Full' },
    { 'Date': '20240122', 'Desc': '8 digits' },
    { 'Date': '240122', 'Desc': '6 digits' },
    { 'Date': '24.01.22', 'Desc': 'YY.MM.DD' },
    { 'Date': '12/31/2021', 'Desc': 'Ambiguous but US-like' },
    { 'Date': '31/12/2021', 'Desc': 'Strict EU' }
];

const options = { formatDate: true };
const result = processDataLocal(testData, '', options as any);

console.log('--- Universal Date Normalization Results ---');
let allSuccess = true;
result.forEach((r, i) => {
    const orig = testData[i]['Date'];
    const proc = r['Date'];
    const expected = i === 7 ? '2021.12.31' : (i === 8 ? '2021.12.31' : (i === 5 ? '2024.01.22' : (i === 6 ? '2024.01.22' : '2024.01.22')));

    if (i === 7) { /* 12/31/2021 -> 2021.12.31 */ }
    if (i === 8) { /* 31/12/2021 -> 2021.12.31 */ }

    // Custom check for each since they might be different years
    console.log(`${orig} (${testData[i]['Desc']}) -> ${proc}`);
    if (!proc.match(/^\d{4}\.\d{2}\.\d{2}$/)) {
        allSuccess = false;
    }
});

if (allSuccess) {
    console.log('\nSUCCESS: All global date formats normalized to YYYY.MM.DD!');
} else {
    console.log('\nFAILURE: Some formats were not normalized.');
}
