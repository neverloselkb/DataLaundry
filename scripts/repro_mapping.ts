import { processDataLocal, DataRow } from '../src/lib/data-processor';

const testData: DataRow[] = [
    { 'Address': '[xxx원]', 'ID': '4' }
];

export { };
const localPrompt = "'Address' 컬럼의 [xxx원] 데이터는 빈칸으로 변경 해줘";
const result = processDataLocal(testData, localPrompt);

console.log('Result for [xxx원] -> blank:');
result.forEach((r, i) => {
    console.log(`Row ${i + 1}: ${r['Address'] === '' ? '(BLANK)' : r['Address']}`);
});

const success = result[0]['Address'] === '';
if (success) {
    console.log('\nSUCCESS: [xxx원] was successfully changed to blank!');
} else {
    console.log('\nFAILURE: [xxx원] was not changed to blank.');
}
