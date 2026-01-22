import { detectDataIssues, DataRow } from './src/lib/data-processor';

const testData: DataRow[] = [
    { '주소': '서울 강남구 테헤란로 123', '이름': '홍길동' },
    { '주소': '경기도 성남시 분당구', '이름': '김철수' },
    { '주소': '부산 해운대구', '이름': '이영희' },
    { '주소': '제주', '이름': '박민수' }, // Messy
    { '주소': '미정', '이름': '최주환' }, // Messy
    { '주소': '데이터 없음', '이름': '강하나' }, // Messy
    { '주소': '나중에 입력', '이름': '조보아' }, // Messy
];

const issues = detectDataIssues(testData);
console.log('Detected Issues count:', issues.length);

const addressIssue = issues.find(i => i.column === '주소' && i.promptSuggestion);
if (addressIssue) {
    console.log('SUCCESS: Address issue with prompt suggestion detected!');
    console.log('Message:', addressIssue.message);
    console.log('Suggestion:', addressIssue.promptSuggestion);
    console.log('Affected rows length:', addressIssue.affectedRows?.length);
} else {
    console.log('FAILURE: Address issue not detected or missing prompt suggestion.');
    console.log('All issues:', JSON.stringify(issues, null, 2));
}
