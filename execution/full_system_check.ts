import { processDataLocal, detectDataIssues } from '../src/lib/core/processors';
// Note: In a real environment, we'd need to handle imports carefully. 
// Since we are running ad-hoc, we'll assume relative imports work or use a simplified approach for testing.

// Mock types for the script to run independently if needed, 
// but we'll try to import from the source.
import { DataRow, ProcessingOptions, ColumnSpecificOptions } from '../src/types';

const defaultOptions: ProcessingOptions = {
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

const testData: DataRow[] = [
    { id: 1, name: " 홍길동   ", tel: "01012345678", email: "test@naver.com", address: "서울시 강남구 역삼동 123-456", amount: "1500000", date: "2024.01.26" },
    { id: 2, name: "김철수 과장", tel: "02-123-4567", email: "bad-email", address: "경기도 성남시 분당구 정자동 1-1", amount: "일백오십만원", date: "24/01/26" },
    { id: 3, name: "Lee (CEO)", tel: "821098765432", email: "lee@gmail.com", address: "인천광역시 미추홀구 주안동", amount: "5,000", date: "어제" },
    { id: 4, name: "박영희!!!", tel: "010-0000-0000", email: "park@yahoo.com", address: "<html>부산광역시 해운대구</html>", amount: "123.45", date: "20240125" }
];

async function runCheck() {
    console.log("=========================================");
    console.log("🚀 데이터 세탁소 전 기능 자동 점검 시작");
    console.log("=========================================\n");

    let totalTests = 0;
    let passedTests = 0;

    const assert = (name: string, condition: boolean, got: any, expected: any) => {
        totalTests++;
        if (condition) {
            passedTests++;
            console.log(`✅ [PASS] ${name}`);
        } else {
            console.error(`❌ [FAIL] ${name}`);
            console.error(`   - Expected: ${JSON.stringify(expected)}`);
            console.error(`   - Got:      ${JSON.stringify(got)}`);
        }
    };

    // --- 1. 분석 기능 점검 (Analyzers) ---
    console.log("[1] 분석 기능(Analyzers) 점검");
    const issues = detectDataIssues(testData, {}, { autoDetect: true });
    assert("이슈 감지 확인 (공백)", issues.some(i => i.column === 'name' && i.message.includes('공백')), true, true);
    assert("이슈 감지 확인 (이메일)", issues.some(i => i.column === 'email' && i.message.includes('유효하지 않은')), true, true);
    assert("이슈 감지 확인 (금액)", issues.some(i => i.column === 'amount' && i.message.includes('텍스트')), true, true);
    console.log("");

    // --- 2. 정제 기능 점검: 전역 옵션 ---
    console.log("[2] 정제 기능: 전역 체크박스 옵션");
    const globalProcessed = processDataLocal(testData, "", { ...defaultOptions, removeWhitespace: true, formatMobile: true, formatNumber: true }, [], {});
    assert("공백 제거 확인", globalProcessed[0].name === "홍길동", globalProcessed[0].name, "홍길동");
    assert("휴대폰 포맷 확인", globalProcessed[0].tel === "010-1234-5678", globalProcessed[0].tel, "010-1234-5678");
    assert("금액 콤마 확인", globalProcessed[3].amount === "123.45", globalProcessed[3].amount, "123.45"); // Since it's num.toLocaleString('en-US') logic
    console.log("");

    // --- 3. 정제 기능 점검: 자연어 처리 (NLP) ---
    console.log("[3] 정제 기능: 자연어 처리(NLP)");

    // 3.1 단순 치환
    const nlpProcessed1 = processDataLocal(testData, "성함에서 '과장' 지워줘", defaultOptions, [], {});
    assert("NLP 단순 제거 (과장)", nlpProcessed1[1].name === "김철수", nlpProcessed1[1].name, "김철수");

    // 3.2 패딩
    const nlpProcessed2 = processDataLocal(testData, "id를 5자리 0으로 채워줘", defaultOptions, [], {});
    assert("NLP 패딩 확인", nlpProcessed2[0].id === "00001", nlpProcessed2[0].id, "00001");

    // 3.3 복합 치환 (A -> B)
    const nlpProcessed3 = processDataLocal(testData, "test@naver.com은 sample@test.com으로 변경", defaultOptions, [], {});
    assert("NLP 값 치환 확인", nlpProcessed3[0].email === "sample@test.com", nlpProcessed3[0].email, "sample@test.com");

    // 3.4 대문자 변환
    const nlpProcessed4 = processDataLocal(testData, "email은 대문자로 변경", defaultOptions, [], {});
    assert("NLP 대문자 확인", nlpProcessed4[0].email === "TEST@NAVER.COM", nlpProcessed4[0].email, "TEST@NAVER.COM");
    console.log("");

    // --- 4. 정제 기능 점검: 계층적 우선순위 ---
    console.log("[4] 계층적 우선순위 점검 (Layered Priority)");

    // 케이스: 전역 옵션(소문자) vs 개별 컬럼 옵션(대문자) -> 개별 옵션이 최종 승리해야 함 (Rule 2)
    const priorityProcessed = processDataLocal(
        testData,
        "",
        { ...defaultOptions, toLowerCase: true },
        [],
        { name: 'upperCase' }
    );
    assert("우선순위 확인 (개별 옵션 > 전역 옵션)", priorityProcessed[2].name === "LEE (CEO)", priorityProcessed[2].name, "LEE (CEO)");

    // 케이스: 잠금 컬럼 보호 (Rule 1)
    const lockedProcessed = processDataLocal(
        testData,
        "전부 대문자로 바꿔",
        { ...defaultOptions, toUpperCase: true },
        ['name'],
        {}
    );
    assert("잠금 컬럼 보호 확인", lockedProcessed[0].name === " 홍길동   ", lockedProcessed[0].name, " 홍길동   ");
    console.log("");

    console.log("=========================================");
    console.log(`📊 점검 완료: ${passedTests}/${totalTests} 케이스 통과`);
    console.log("=========================================");

    if (passedTests === totalTests) {
        console.log("🚀 모든 기능이 정상적으로 작동하고 있습니다!");
    } else {
        console.log("⚠️ 일부 기능에 문제가 발견되었습니다. 로그를 확인하세요.");
        process.exit(1);
    }
}

runCheck().catch(err => {
    console.error("❌ 점검 중 오류 발생:", err);
    process.exit(1);
});
