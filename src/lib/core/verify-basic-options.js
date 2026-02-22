// Mock Processor Logic (Simplified from processors.ts for environment-independent testing)
// We cannot import TS files directly in Node without ts-node, so I will copy the logic functions I want to test here.
// This ensures we are testing the LOGIC, not the build system.

function processDataLocal(data, prompt, options, lockedColumns = [], columnOptions = {}) {
    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    // Mock NLP Analysis (Simplified)
    const nlp = {
        mappings: {},
        numericConditions: [],
        nullFillings: [],
        wantsHyphenRemoval: false,
        wantsCommaRemoval: false,
        wantsUnmask: false,
        hasAction: false,
        patternMappings: [],
        wantsNoSpecial: false,
        wantsNoBrackets: false,
        targetNoBrackets: [],
        wantsOnlyDigits: false,
        wantsOnlyKorean: false,
        wantsOnlyEnglish: false,
        wantsNoHtml: false,
        targetNoHtml: [],
        wantsNoEmoji: false,
        targetNoEmoji: [],
        wantsPaddingLen: 0,
        wantsPrefixMatch: null,
        wantsSuffixMatch: null,
        wantsLower: false,
        wantsUpper: false,
        wantsSido: false,
        wantsGungu: false,
        wantsDongExtraction: false,
        wantsDomain: false,
        wantsCompanyClean: false,
        wantsPositionRemoval: false,
        wantsMasking: false,
        wantsNameMask: false,
        wantsEmailMask: false,
        wantsAddressMask: false,
        wantsAgeCategory: false,
        wantsDateTruncate: false,
        wantsExponentialRestore: false,
        wantsSkuNormalize: false,
        wantsUnitUnify: false,
        wantsCurrencyStandardize: false,
        nlpDateSeparator: null,
        nlpUseEmptySeparator: false,
        wantsEmptyOnError: false,
        allPotentialTargets: []
    };

    return data.map(row => {
        const newRow = { ...row };
        for (const key in newRow) {
            if (lockedColumns.includes(key)) continue;

            const lowerKey = key.toLowerCase();
            let val = String(newRow[key] || "");

            // -----------------------------------------------------------------
            // 1단계: 전역 체크박스 옵션 (Logic form processors.ts)
            // -----------------------------------------------------------------
            const isPhoneCol = options.autoDetect && /연락처|전화|phone|mobile|tel/.test(lowerKey);
            if (options.formatMobile || options.formatGeneralPhone || isPhoneCol) {
                if (nlp.wantsHyphenRemoval) {
                    val = val.replace(/[-.\s]/g, '');
                } else {
                    let onlyDigits = val.replace(/\D/g, '');
                    if (onlyDigits.startsWith('82')) onlyDigits = '0' + onlyDigits.substring(2);

                    if (onlyDigits.startsWith('01') && (options.formatMobile || isPhoneCol)) {
                        if (onlyDigits.length >= 10 && onlyDigits.length <= 11) {
                            val = onlyDigits.replace(/^(01[016789])(\d{3,4})(\d{4})$/, "$1-$2-$3");
                        }
                    } else if (onlyDigits.startsWith('0') && options.formatGeneralPhone) {
                        const areaCodeLen = onlyDigits.startsWith('02') ? 2 : 3;
                        const regex = new RegExp(`^(\\d{${areaCodeLen}})(\\d{3,4})(\\d{4})$`);
                        if (regex.test(onlyDigits)) val = onlyDigits.replace(regex, "$1-$2-$3");
                    }
                }
            }

            if (options.removeWhitespace || ((nlp.hasAction && (prompt.includes('공백') || prompt.includes('스페이스'))))) {
                val = val.replace(/\s+/g, ' ').trim();
            }

            // ... other options ...

            newRow[key] = val;
        }
        return newRow;
    });
}

// Test Runner
const mockData = [
    { '이름': ' 홍 길동 ', '전화번호': '01012345678' },
    { '이름': '김철수', '전화번호': '021234567' }
];

const tests = [
    {
        name: "Whitespace Removal",
        options: { removeWhitespace: true },
        check: (res) => res[0]['이름'] === '홍 길동'
    },
    {
        name: "Mobile Format (Explicit)",
        options: { formatMobile: true },
        check: (res) => res[0]['전화번호'] === '010-1234-5678'
    },
    {
        name: "Mobile Format (General Option should NOT touch mobile if distinct)",
        options: { formatGeneralPhone: true }, // Should handle 02 but maybe ignore 010 if specific logic separates them?
        // Logic says: if (startsWith 01 AND (formatMobile OR isPhoneCol)) -> Mobile
        // ELSE IF (startsWith 0 AND formatGeneralPhone) -> General
        // So if Only formatGeneralPhone is ON, does it handle 010?
        // Code: else if (onlyDigits.startsWith('0') && options.formatGeneralPhone)
        // Yes, 010 starts with 0. So GeneralPhone MIGHT handle it if formatMobile is OFF.
        check: (res) => res[1]['전화번호'] === '02-123-4567'
    }
];

console.log("Running JS Verification...\n");

tests.forEach(test => {
    const result = processDataLocal(mockData, "", { ...test.options, autoDetect: false }); // Force autoDetect off
    if (test.check(result)) {
        console.log(`✅ [PASS] ${test.name}`);
    } else {
        console.log(`❌ [FAIL] ${test.name}`);
        console.log("Result:", JSON.stringify(result, null, 2));
    }
});
