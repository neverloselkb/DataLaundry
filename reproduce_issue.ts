
import { processDataLocal } from './src/lib/data-processor';

const mockData: any[] = [
    { '우편번호': '12345', '이름': '정상1' },
    { '우편번호': '123456', '이름': '초과1' },
    { '우편번호': '12345-6789', '이름': '초과2' },
    { 'Address': '123456', '이름': '초과3 (영문컬럼)' }
];

const prompt = "우편번호가 5자리가 넘어가는 건 빈칸으로 변경";

const options = {
    removeWhitespace: false,
    formatMobile: false,
    formatGeneralPhone: false,
    formatDate: false,
    formatNumber: false,
    cleanEmail: false,
    formatZip: true, // User might have checked this, or relying on NLP
    highlightChanges: false,
    cleanGarbage: false,
    cleanAmount: false,
    cleanName: false
};

// Case 1: Option Checked
console.log("--- Case 1: Option Checked ---");
const result1 = processDataLocal(mockData, prompt, options);
console.log(JSON.stringify(result1, null, 2));

// Case 2: Option Unchecked (relying on NLP trigger)
console.log("--- Case 2: Option Unchecked ---");
const options2 = { ...options, formatZip: false };
const result2 = processDataLocal(mockData, prompt, options2);
console.log(JSON.stringify(result2, null, 2));
