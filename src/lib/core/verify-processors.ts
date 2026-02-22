import { processDataLocal } from './processors';
import { DataRow, ProcessingOptions } from '@/types';

// Mock Data
const mockData: DataRow[] = [
    { '이름': '홍길동', '전화번호': '010-1234-5678', '이메일': 'test@example.com', '주소': '서울시 강남구' },
    { '이름': '김철수', '전화번호': '01098765432', '이메일': 'invalid-email', '주소': '경기도 성남시' },
    { '이름': '이영희', '전화번호': '02-123-4567', '이메일': 'young@test.co.kr', '주소': '부산시 해운대구' }
];

// Mock Options
const defaultOptions: ProcessingOptions = {
    removeWhitespace: false,
    formatMobile: false,
    formatGeneralPhone: false,
    formatDate: false,
    formatDateTime: false,
    formatNumber: false,
    cleanEmail: false,
    formatZip: false,
    cleanGarbage: false,
    cleanAmount: false,
    cleanName: false,
    formatBizNum: false,
    formatCorpNum: false,
    formatUrl: false,
    maskPersonalData: false,
    maskAccount: false,
    maskCard: false,
    maskName: false,
    maskEmail: false,
    maskAddress: false,
    maskPhoneMid: false,
    categoryAge: false,
    truncateDate: false,
    restoreExponential: false,
    extractBuilding: false,
    normalizeSKU: false,
    unifyUnit: false,
    standardizeCurrency: false,
    cleanCompanyName: false,
    removePosition: false,
    extractDong: false,
    cleanAreaUnit: false,
    cleanSnsId: false,
    formatHashtag: false,
    formatTaxDate: false,
    formatAccountingNum: false,
    autoDetect: false,
    removeHtml: false,
    removeEmoji: false,
    toUpperCase: false,
    toLowerCase: false,
    formatTrackingNum: false,
    cleanOrderId: false,
    useAI: false,
    highlightChanges: false
};

const runTest = (name: string, prompt: string, options: Partial<ProcessingOptions>, expectedCheck: (result: DataRow[]) => boolean) => {
    console.log(`Testing: ${name}`);
    try {
        const mergedOptions = { ...defaultOptions, ...options };
        const result = processDataLocal(mockData, prompt, mergedOptions);
        if (expectedCheck(result)) {
            console.log(`✅ Passed`);
        } else {
            console.error(`❌ Failed`);
            console.log('Result:', JSON.stringify(result, null, 2));
        }
    } catch (e) {
        console.error(`❌ Error: ${e}`);
    }
    console.log('---');
};

console.log('Starting Verification...\n');

// Test 1: Basic Option - Remove Whitespace (Not applicable to this mock data but logic check)
// Let's test Mobile Formatting
runTest(
    'Format Mobile (Checkbox)',
    '',
    { formatMobile: true },
    (res) => res[1]['전화번호'] === '010-9876-5432'
);

// Test 2: NLP - Mask Name
runTest(
    'NLP: Mask Name',
    '이름 마스킹해줘',
    {},
    (res) => res[0]['이름'] === '홍*동' && res[1]['이름'] === '김*수'
);

// Test 3: NLP - Address Extraction (Sido)
runTest(
    'NLP: Extract Sido',
    '주소에서 시도 분리해줘',
    {},
    (res) => res[0]['주소'] === '서울시' && res[2]['주소'] === '부산시'
);

// Test 4: Combined - Email Cleaning
runTest(
    'Clean Email',
    '',
    { cleanEmail: true, autoDetect: true }, // autoDetect needed to find '이메일' col
    (res) => res[1]['이메일'] === '' && res[0]['이메일'] === 'test@example.com'
);

console.log('Verification Complete.');
