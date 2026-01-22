import { processDataLocal, DataRow } from './src/lib/data-processor';

const testData: DataRow[] = [
    { 'Address': '1234원', 'ID': '1' }, // 4 digits
    { 'Address': '695원', 'ID': '2' },  // 3 digits
];

export { };
const prompt = "'Address' 컬럼의 [%4d]원을 빈칸으로 변경";
const result = processDataLocal(testData, prompt);

console.log('Result for [%4d]원 -> blank:');
result.forEach((r, i) => {
    console.log(`Row ${i + 1} (${testData[i]['Address']}): ${r['Address'] === '' ? '(BLANK)' : r['Address']}`);
});

const success = result[0]['Address'] === '' && result[1]['Address'] === '695원';
if (success) {
    console.log('\nSUCCESS: [%4d]원 worked correctly (matched 4-digits only).');
} else {
    console.log('\nFAILURE: Pattern matching did not work as expected.');
}

const prompt2 = "'Address' 컬럼의 [%d]원을 빈칸으로 변경";
const result2 = processDataLocal(testData, prompt2);
console.log('\nResult for [%d]원 -> blank:');
result2.forEach((r, i) => {
    console.log(`Row ${i + 1} (${testData[i]['Address']}): ${r['Address'] === '' ? '(BLANK)' : r['Address']}`);
});
