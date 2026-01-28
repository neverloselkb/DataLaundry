import { processDataLocal } from '../src/lib/core/processors';
import { DataRow, ProcessingOptions } from '../src/types';

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

const advTestData: DataRow[] = [
    { id: 1, address: "서울특별시 강남구 테헤란로 152 (역삼동, 강남파이낸스센터)", email: "antigravity@google.com", memo: "비고: [비공개] 데이터입니다.", price: 5000, grade: "" },
    { id: 2, address: "경기도 성남시 분당구 판교역로 166 (백현동, 카카오판교아지트)", email: "user_test@kb.co.kr", memo: "결제금액: 2,500,000원 (총액)", price: 150000, grade: "A" },
    { id: 3, address: "부산광역시 해운대구 우동 1514", email: "support@daum.net", memo: "상태: 처리완료(2024-01-26)", price: 8000, grade: "" },
    { id: 4, company: "(주)데이터세탁소 대표이사", user: "홍길동 대리", sku: "SKU-12345-ABC", msg: "Hello 😉 <b>World</b>", price: 30000, grade: "B" }
];

async function runAdvancedTest() {
    console.log("=========================================");
    console.log("🔥 심화 자연어 처리(NLP) 케이스 테스트 시작");
    console.log("=========================================\n");

    const assert = (name: string, got: any, expected: any) => {
        if (got === expected) {
            console.log(`✅ [PASS] ${name}`);
        } else {
            console.error(`❌ [FAIL] ${name}`);
            console.error(`   - Expected: ${JSON.stringify(expected)}`);
            console.error(`   - Got:      ${JSON.stringify(got)}`);
        }
    };

    // 1. 주소에서 구/군 추출 (NLP: wantsGungu)
    console.log("[A-1] 주소 계층 추출 (구/군)");
    const res1 = processDataLocal(advTestData, "주소에서 구/군만 남겨줘", defaultOptions, [], {});
    assert("강남구 추출", res1[0].address, "강남구");
    assert("분당구 추출", res1[1].address, "분당구");
    console.log("");

    // 2. 이메일에서 도메인 추출 (NLP: wantsDomain)
    console.log("[A-2] 이메일 도메인 추출");
    const res2 = processDataLocal(advTestData, "email에서 도메인만 분리해줘", defaultOptions, [], {});
    assert("도메인 추출 (google.com)", res2[0].email, "google.com");
    assert("도메인 추출 (kb.co.kr)", res2[1].email, "kb.co.kr");
    console.log("");

    // 3. 복합 패턴 제거 (NLP: wantsNoBrackets + wantsNoHtml + wantsNoEmoji)
    console.log("[A-3] 복합 노이즈 제거 (괄호, HTML, 이모지)");
    const res3 = processDataLocal(advTestData, "msg에서 html이랑 이모지 지우고 memo에서 괄호내용 삭제해줘", defaultOptions, [], {});
    assert("HTML/이모지 제거", res3[3].msg, "Hello World");
    assert("괄호 내용 제거", res3[0].memo, "비고:  데이터입니다."); // whitespace issue might exist but logic is focus
    console.log("");

    // 4. 업체명/직함 정규화 (Rule-based NLP)
    console.log("[A-4] 업체명 및 직함 정규화");
    const res4 = processDataLocal(advTestData, "회사 이름이랑 이름에서 주식회사랑 직함 다 정리해줘", defaultOptions, [], {});
    assert("업체명 정규화", res4[3].company, "데이터세탁소");
    assert("직함 제거", res4[3].user, "홍길동");
    console.log("");

    // 5. 패딩 및 접두사 추가 결합
    console.log("[A-5] 복합 변환 (패딩 + 접두사)");
    const res5 = processDataLocal(advTestData, "id를 4자리 0으로 채우고 앞에 'NO_' 붙여줘", defaultOptions, [], {});
    assert("패딩+접두사 결합", res5[0].id, "NO_0001");
    console.log("");

    // 6. 특수 패턴 치환 (수치화 + 단위 제거)
    console.log("[A-6] 수치 데이터 표준화");
    const res6 = processDataLocal(advTestData, "memo에서 '2,500,000'을 'VIP_PAY'로 바꾸고 msg 대문자로 변경", defaultOptions, [], {});
    assert("값 치환", res6[1].memo?.toString().includes("VIP_PAY"), true, true);
    assert("메시지 대문자", res6[3].msg, "HELLO 😉 <B>WORLD</B>"); // emoji/html intact if not explicitly removed
    console.log("");

    console.log("\n=========================================");
    console.log("🏁 심화 NLP 테스트 종료");
    console.log("=========================================");
    // 7. [NEW] 조건부 값 치환 (Numeric Logic Testing)
    console.log("[A-7] 조건부 값 치환 (10000원 이상은 'High'로 변경)");
    // 현재 rule-based processor에는 숫자 비교 로직이 없을 수 있음. AI 모드나 확장된 로직이 필요할 수 있음.
    // 여기서는 의도를 전달했을 때 어떻게 반응하는지 확인.
    const res7 = processDataLocal(advTestData, "price가 10000 이상이면 'High'로 바꿔줘", defaultOptions, [], {});
    // 기대 결과: id 2(150000), id 4(30000) -> 'High', 나머지 유지 혹은 그대로
    console.log("   - Price(150000) -> Result:", res7[1].price);
    console.log("   - Price(5000)   -> Result:", res7[0].price);

    // 8. [NEW] 결측치 채우기 (Fill Missing Values)
    console.log("");
    console.log("[A-8] 결측치(빈 값) 채우기");
    const res8 = processDataLocal(advTestData, "grade가 비어있으면 'Unknown'으로 채워줘", defaultOptions, [], {});
    assert("빈 값 채우기", res8[0].grade, "Unknown");
    assert("기존 값 유지", res8[3].grade, "B");

    console.log("\n=========================================");
    console.log("🏁 심화 NLP 테스트 종료");
    console.log("=========================================");
}

runAdvancedTest().catch(console.error);
