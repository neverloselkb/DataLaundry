
import { processDataLocal } from './src/lib/core/processors';
import { detectDataIssues } from './src/lib/core/analyzers';
import { DataRow } from './src/types';

const defaultOptions = {
    removeWhitespace: false, formatMobile: false, formatGeneralPhone: false, formatDate: false, formatDateTime: false,
    formatNumber: false, cleanEmail: false, formatZip: false, highlightChanges: false, cleanGarbage: false,
    cleanAmount: false, cleanName: false, formatBizNum: false, formatCorpNum: false, formatUrl: false,
    maskPersonalData: false, formatTrackingNum: false, cleanOrderId: false, formatTaxDate: false, formatAccountingNum: false,
    cleanAreaUnit: false, cleanSnsId: false, formatHashtag: false, cleanCompanyName: false, removePosition: false,
    extractDong: false, maskAccount: false, maskCard: false, maskName: false, maskEmail: false, maskAddress: false,
    maskPhoneMid: false, categoryAge: false, truncateDate: false, restoreExponential: false, extractBuilding: false,
    normalizeSKU: false, unifyUnit: false, standardizeCurrency: false, removeHtml: false, removeEmoji: false,
    toUpperCase: false, toLowerCase: false, useAI: false, autoDetect: false
};

const testCases = [
    { card: '123456789', id: 1, desc: 'Length 9 (Too Short)', expectMask: false, expectWarning: true },
    { card: '1234567890', id: 2, desc: 'Length 10 (Min)', expectMask: true, expectWarning: false },
    { card: '1234567890123456789', id: 3, desc: 'Length 19 (Max)', expectMask: true, expectWarning: false },
    { card: '12345678901234567890', id: 4, desc: 'Length 20 (Too Long)', expectMask: false, expectWarning: true },
];

const data: DataRow[] = testCases.map(tc => ({ card: tc.card, id: tc.id }));

// 1. Test Masking
console.log('--- Testing Masking ---');
const processed = processDataLocal(data, '', defaultOptions, [], { card: 'cardMask' });

let pass = true;

processed.forEach((row, idx) => {
    const tc = testCases[idx];
    const masked = row.card!.toString().includes('****');
    if (masked !== tc.expectMask) {
        console.error(`❌ FAIL [${tc.desc}]: Expected Mask=${tc.expectMask}, Got=${masked} (Value: ${row.card})`);
        pass = false;
    } else {
        console.log(`✅ PASS [${tc.desc}]: Mask=${masked}`);
    }
});

// 2. Test Analysis issues
console.log('\n--- Testing Analysis ---');
const issues = detectDataIssues(data, {}, { maskCard: true });
const cardIssues = issues.filter(i => i.column === 'card');

testCases.forEach(tc => {
    const hasWarning = cardIssues.some(i => i.affectedRows?.includes(tc.id - 1)); // row index is 0-based
    if (hasWarning !== tc.expectWarning) {
        console.error(`❌ FAIL [${tc.desc}]: Expected Warning=${tc.expectWarning}, Got=${hasWarning}`);
        pass = false;
    } else {
        console.log(`✅ PASS [${tc.desc}]: Warning=${hasWarning}`);
    }
});

// @ts-ignore
if (!pass) process.exit(1);
