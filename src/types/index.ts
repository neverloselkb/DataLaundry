/**
 * 기본 데이터 행 타입 정의
 * JSON 형태의 키-값 쌍으로 데이터를 표현합니다.
 * 값은 문자열, 숫자, 불리언 또는 null일 수 있습니다.
 */
export type DataRow = Record<string, string | number | boolean | null>;

/**
 * 데이터 정제 옵션 인터페이스
 * 사용자가 선택할 수 있는 다양한 정제 필터들을 정의합니다.
 */
export type ProcessingOptions = {
    removeWhitespace: boolean;    // 앞뒤 공백 제거
    formatMobile: boolean;        // 휴대폰 번호 포맷 통일
    formatGeneralPhone: boolean;  // 일반 전화번호 포맷 통일
    formatDate: boolean;          // 날짜 형식 통일
    formatDateTime: boolean;      // 일시 형식 통일
    formatNumber: boolean;        // 숫자 천단위 콤마
    cleanEmail: boolean;          // 이메일 정제
    formatZip: boolean;           // 우편번호 형식 통일
    highlightChanges: boolean;    // 변경 사항 하이라이트 (Excel 다운로드 시)
    cleanGarbage: boolean;        // 특수문자 등 가비지 데이터 제거
    cleanAmount: boolean;         // 금액 데이터 정제 (한글 단위 변환 등)
    cleanName: boolean;           // 이름 정제 (숫자/특수문자 제거)
    formatBizNum: boolean;        // 사업자등록번호 포맷 (000-00-00000)
    formatCorpNum: boolean;       // 법인등록번호 포맷 (000000-0000000)
    formatUrl: boolean;           // URL 표준화 (https://)
    maskPersonalData: boolean;    // 개인정보 마스킹 (주민번호 등)
    formatTrackingNum: boolean;   // 운송장번호 정제
    cleanOrderId: boolean;        // 주문번호 특수문자 제거
    formatTaxDate: boolean;       // 세무 신고용 날짜 (8자리)
    formatAccountingNum: boolean; // 회계 음수 표기 변환
    cleanAreaUnit: boolean;       // 면적 단위 제거 (계산용)
    cleanSnsId: boolean;          // SNS ID 추출
    formatHashtag: boolean;       // 해시태그 표준화
    cleanCompanyName: boolean;    // 업체명 정규화 (수식어 제거)
    removePosition: boolean;      // 이름 내 직함 제거
    extractDong: boolean;         // 상세 주소(동읍면) 추출
    maskAccount: boolean;         // 계좌번호 마스킹
    maskCard: boolean;            // 카드번호 마스킹
    maskName: boolean;            // 성함 마스킹 (홍*동)
    maskEmail: boolean;           // 이메일 마스킹 (아이디 일부)
    maskAddress: boolean;         // 상세 주소 마스킹
    maskPhoneMid: boolean;        // 연락처 중간자리 마스킹
    categoryAge: boolean;         // 나이 범주화 (10단위)
    truncateDate: boolean;        // 날짜 절삭 (연/월만 남김)
    restoreExponential: boolean;  // 엑셀 지수 표기(E+) 복원
    extractBuilding: boolean;     // 주소 내 건물명 추출
    normalizeSKU: boolean;        // SKU/모델명 표준화
    unifyUnit: boolean;           // 단위 제거 및 수치화 (kg, 평 등)
    standardizeCurrency: boolean; // 통화 기호 제거 및 통일
    useAI: boolean;               // 자연어 스마트 정제 엔진 사용 여부
};

/**
 * 데이터 이슈 타입 정의
 * 데이터 분석 중 발견된 문제점들을 분류합니다.
 */
export type DataIssue = {
    column: string;                   // 문제가 발견된 컬럼명
    type: 'warning' | 'error' | 'info'; // 이슈의 심각도
    message: string;                  // 사용자에게 보여줄 메시지
    suggestion?: Partial<ProcessingOptions>; // 해결을 위한 추천 옵션
    promptSuggestion?: string;        // 자연어 처리를 위한 추천 프롬프트
    fixType?: 'maxLength';            // 특정 수정 로직이 필요한 경우 (예: 길이 제한)
    affectedRows?: number[];          // 해당 이슈가 발견된 행의 인덱스 목록
};

/**
 * 데이터 처리 통계 정보
 * 정제 전후의 변화량을 추적합니다.
 */
export interface ProcessingStats {
    totalRows: number;        // 전체 행 수
    changedCells: number;     // 변경된 셀의 수
    resolvedIssues: number;   // 해결된 이슈의 수
    qualityScore: number;     // 데이터 건강도 점수 (0-100)
    completeness: number;      // 데이터 완결성 (결측치 없는 비율 %)
    validity: number;          // 데이터 유효성 (이슈 없는 비율 %)
}

/**
 * 컬럼별 최대 길이 제약 조건
 * key: 컬럼명, value: 최대 길이
 */
export type ColumnLimits = Record<string, number>;

/**
 * 컬럼별 정제 옵션 타입
 * 특정 컬럼에 대해 전역 설정보다 우선순위를 갖는 정제 옵션을 정의합니다.
 */
export type ColumnOptionType =
    | 'date'         // 날짜 (YYYY-MM-DD)
    | 'datetime'     // 일시 (YYYY-MM-DD HH:mm)
    | 'mobile'       // 휴대폰 (010-0000-0000)
    | 'phone'        // 일반전화 (02-000-0000)
    | 'zip'          // 우편번호 (5자리)
    | 'bizNum'       // 사업자번호 (000-00-00000)
    | 'corpNum'      // 법인번호 (000000-0000000)
    | 'email'        // 이메일
    | 'url'          // URL (https://)
    | 'rrn'          // 주민번호 마스킹
    | 'amount'       // 금액 (콤마)
    | 'amountKrn'    // 금액 (한글 단위 변환)
    | 'trackingNum'  // 운송장번호
    | 'orderId'      // 주문번호
    | 'area'         // 면적 (단위 제거)
    | 'snsId'        // SNS ID
    | 'hashtag'      // 해시태그
    | 'companyClean' // 업체명 정규화
    | 'positionRemove' // 직함 제거
    | 'dongExtract'  // 동/읍/면 추출
    | 'accountMask'  // 계좌번호 마스킹
    | 'cardMask'     // 카드번호 마스킹
    | 'nameMask'     // 성함 마스킹
    | 'emailMask'    // 이메일 마스킹
    | 'addressMask'  // 상세 주소 마스킹
    | 'phoneMidMask' // 연락처 중간자리 가림
    | 'ageCategory'  // 나이 범주화
    | 'dateTruncate' // 날짜 절삭
    | 'exponentialRestore' // 지수 표기 복원
    | 'buildingExtract'    // 건물명 추출
    | 'skuNormalize'       // SKU 표준화
    | 'unitUnify'          // 단위 수치화
    | 'currencyStandardize' // 통화 표준화
    | 'trim'               // 공백 제거 (타켓 컬럼 전용)
    | 'garbage'            // 가비지 제거 (타켓 컬럼 전용)
    | 'nameClean'          // 이름 노이즈 제거 (타겟 컬럼 전용)
    | 'emailClean'         // 이메일 정제 (타겟 컬럼 전용)
    | null;
export type ColumnSpecificOptions = Record<string, ColumnOptionType>;

/**
 * 사용자 정의 정제 프리셋 인터페이스
 */
export interface CleaningPreset {
    id: string;               // 고유 ID
    name: string;             // 프리셋 이름
    icon?: string;            // 이모지 아이콘
    description?: string;     // 상세 설명
    options: ProcessingOptions;       // 전역 체크박스 상태
    prompt: string;                   // 자연어 명령어
    columnOptions: ColumnSpecificOptions; // 컬럼별 타켓 설정
    createdAt: number;        // 생성일
    isSystem?: boolean;       // 시스템 기본 제공 여부
}
