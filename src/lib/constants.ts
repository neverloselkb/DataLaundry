import { ProcessingOptions } from '@/types';

export type OptionCategory = 'basic' | 'formatting' | 'business' | 'security' | 'industry';

export interface CleaningOptionItem {
    id: keyof ProcessingOptions;
    label: string;
    description?: string;
}

export interface CleaningOptionCategory {
    id: OptionCategory;
    label: string;
    items: CleaningOptionItem[];
}

export const CLEANING_OPTIONS_SCHEMA: CleaningOptionCategory[] = [
    {
        id: 'basic',
        label: '기본 정제',
        items: [
            { id: 'removeWhitespace', label: '공백 제거 (Trim)', description: '데이터 앞뒤의 불필요한 공백을 제거합니다.' },
            { id: 'cleanGarbage', label: '가비지 데이터 제거', description: '깨진 문자, N/A, 무의미한 특수문자 등을 제거합니다.' },
            { id: 'cleanName', label: '이름 노이즈 제거', description: '이름 컬럼에서 숫자나 특수문자를 제거합니다.' },
            { id: 'highlightChanges', label: '변경 사항 하이라이트', description: '엑셀 다운로드 시 변경된 셀을 색상으로 표시합니다.' },
        ]
    },
    {
        id: 'formatting',
        label: '포맷팅',
        items: [
            { id: 'formatDate', label: '날짜 (yyyy.MM.dd)', description: '다양한 날짜 형식을 2024.01.01 형태로 통일합니다.' },
            { id: 'formatDateTime', label: '일시 (yyyy.MM.dd HH:mm:ss)', description: '날짜와 시간을 표준 형식으로 변환합니다.' },
            { id: 'formatNumber', label: '숫자 (천단위 콤마)', description: '숫자에 천단위 구분 기호(,)를 추가합니다.' },
            { id: 'formatZip', label: '우편번호 (5자리)', description: '구 우편번호나 잘못된 형식을 5자리로 맞춥니다.' },
        ]
    },
    {
        id: 'business',
        label: '비즈니스 & 연락처',
        items: [
            { id: 'formatMobile', label: '휴대폰 (010-XXXX-XXXX)', description: '휴대폰 번호의 하이픈 형식을 통일합니다.' },
            { id: 'formatGeneralPhone', label: '유선전화 ( 지역번호 포함)', description: '일반 전화번호의 형식을 통일합니다.' },
            { id: 'formatBizNum', label: '사업자번호 (10자리)', description: '000-00-00000 형식으로 변환합니다.' },
            { id: 'formatCorpNum', label: '법인번호 (13자리)', description: '000000-0000000 형식으로 변환합니다.' },
            { id: 'cleanAmount', label: '금액 (한글 단위)', description: '"1억 5천만원" 같은 한글 금액을 숫자로 변환합니다.' },
            { id: 'formatUrl', label: 'URL 표준화', description: '웹사이트 주소에 https:// 프로토콜을 추가합니다.' },
            { id: 'cleanEmail', label: '이메일 검증', description: '유효하지 않은 이메일 형식을 제거합니다.' },
        ]
    },
    {
        id: 'security',
        label: '보안 (Masking)',
        items: [
            { id: 'maskPersonalData', label: '주민번호 마스킹', description: '주민등록번호 뒷자리를 *******로 가립니다.' },
            { id: 'maskAccount', label: '계좌번호 마스킹', description: '계좌번호 뒷자리를 ****로 가립니다.' },
            { id: 'maskCard', label: '카드번호 마스킹', description: '카드번호 중간/뒷자리를 ****로 가립니다.' },
            { id: 'maskName', label: '성함 마스킹', description: '성함 중간 글자를 *로 치환합니다. (예: 홍*동)' },
            { id: 'maskEmail', label: '이메일 마스킹', description: '이메일 아이디 뒷부분을 *로 가립니다.' },
            { id: 'maskAddress', label: '상세 주소 마스킹', description: '번지나 동호수 등 상세 주소를 가립니다.' },
            { id: 'maskPhoneMid', label: '연락처 중간자리 가림', description: '010-****-5678 형식으로 마스킹합니다.' },
            { id: 'categoryAge', label: '나이 범주화', description: '나이를 10단위 연령대(20대, 30대 등)로 변환합니다.' },
            { id: 'truncateDate', label: '날짜 절삭 (연/월)', description: '일(Day) 정보를 삭제하고 연월만 남깁니다.' },
        ]
    },
    {
        id: 'industry',
        label: '업종 특화',
        items: [
            { id: 'cleanCompanyName', label: '업체명 정규화 (B2B)', description: '(주), 주식회사 등 수식어를 제거합니다.' },
            { id: 'removePosition', label: '직함 제거 (인사)', description: '이름 뒤의 대리, 과장 등 직함을 제거합니다.' },
            { id: 'extractDong', label: '동/읍/면 추출 (부동신)', description: '주소에서 동, 읍, 면 단위만 분리합니다.' },
            { id: 'extractBuilding', label: '주소 건물명 추출', description: '아파트나 빌딩 이름만 분리해냅니다.' },
            { id: 'restoreExponential', label: '엑셀 지수 복원', description: '1.23E+12 형태의 운송장 지수를 환원합니다.' },
            { id: 'normalizeSKU', label: 'SKU 표준화', description: '모델명/코드 대문자 및 기호 정리합니다.' },
            { id: 'unifyUnit', label: '단위 수치화', description: 'kg, 평 등 단위를 제거하고 숫자만 남깁니다.' },
            { id: 'standardizeCurrency', label: '통화 기호 정리', description: '$, ￥ 등 기호를 제거하고 숫자로 통일합니다.' },
            { id: 'formatTrackingNum', label: '운송장번호 정제', description: '하이픈 등을 제거하고 숫자만 유지합니다.' },
            { id: 'cleanOrderId', label: '주문번호 정제', description: '매칭을 방해하는 특수문자를 일괄 제거합니다.' },
            { id: 'formatTaxDate', label: '세무용 날짜 (8자리)', description: 'YYYYMMDD 형태로 홈택스 업로드에 최적화합니다.' },
            { id: 'formatAccountingNum', label: '회계 음수 표기', description: '△, () 형태의 음수를 -1000으로 바꿉니다.' },
            { id: 'cleanAreaUnit', label: '면적 단위 제거', description: '㎡, 평 정보를 제거해 계산 가능하게 합니다.' },
            { id: 'cleanSnsId', label: 'SNS ID 추출', description: '계정 URL에서 ID만 깔끔하게 뽑아냅니다.' },
            { id: 'formatHashtag', label: '해시태그 표준화', description: '# 기호를 보강하고 공백을 정리합니다.' },
        ]
    },
];

export const TIPS = [
    "'주소에서 시/도만 남겨줘'",
    "'[%3d]원 형식의 데이터는 빈칸으로 변경해줘' (와일드카드 활용)",
    "'[%d]는 숫자, [%s]는 문자를 뜻해요'",
    "'Inactive는 [정지]로, active는 [정상]으로 변경해줘'",
    "'Name 컬럼에서 숫자랑 특수문자 빼줘'",
    "'우편번호가 5자리가 넘으면 지워줘'",
    "'Price, Cost 컬럼에 콤마 찍어줘'",
    "'날짜 형식을 yyyy-mm-dd로 통일해줘'",
    "'운송장번호 하이픈 빼줘'",
    "'주문번호에 특수문자 지워줘'",
    "'날짜를 8자리로 변경해줘 (세무)'",
    "'면적에서 평수 빼줘'"
];
