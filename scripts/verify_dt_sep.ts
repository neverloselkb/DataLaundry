import { processDataLocal, DataRow } from './src/lib/data-processor';

const testData: DataRow[] = [
    { 'Date': '2024-01-22 오후 02:30:15', 'Type': 'PM case' },
    { 'Date': '9/2/2021 10:15 AM', 'Type': 'AM case' },
    { 'Date': '20210515', 'Type': 'Simple date' }
];

console.log('--- Case 1: formatDate only ---');
const options1 = { formatDate: true, formatDateTime: false };
const result1 = processDataLocal(testData, '', options1 as any);
result1.forEach((r, i) => console.log(`${testData[i]['Date']} -> ${r['Date']}`));

console.log('\n--- Case 2: formatDateTime only ---');
const options2 = { formatDate: false, formatDateTime: true };
const result2 = processDataLocal(testData, '', options2 as any);
result2.forEach((r, i) => console.log(`${testData[i]['Date']} -> ${r['Date']}`));

const success1 = result1[0]['Date'] === '2024.01.22' && result1[1]['Date'] === '2021.09.02';
const success2 = result2[0]['Date'] === '2024.01.22 14:30:15' && result2[1]['Date'] === '2021.09.02 10:15:00';

if (success1 && success2) {
    console.log('\nSUCCESS: Date and DateTime functions are successfully separated and working!');
} else {
    console.log('\nFAILURE: One or more functions did not work correctly.');
}
