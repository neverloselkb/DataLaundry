import { DataRow, ProcessingOptions, ColumnSpecificOptions } from '@/types';
import { normalizeDate, normalizeDateTime, parseKoreanAmount, GARBAGE_REGEX } from './utils';

/**
 * 로컬 브라우저 환경에서 데이터를 정제하는 핵심 함수입니다.
 * 사용자 옵션(체크박스)과 프롬프트(자연어)를 기반으로 정제 로직을 수행합니다.
 * 
 * @param data 원본 데이터 배열
 * @param prompt 사용자 입력 프롬프트 (자연어 명령어)
 * @param options 선택된 정제 옵션들
 * @param lockedColumns 수정 잠금 처리된 컬럼 목록
 * @param columnOptions 컬럼별 개별 정제 옵션
 * @returns 정제된 데이터 배열
 */
export function processDataLocal(
    data: DataRow[],
    prompt: string,
    options: ProcessingOptions = {
        removeWhitespace: false, // 공백 제거
        formatMobile: false,     // 휴대폰 번호 포맷
        formatGeneralPhone: false, // 일반 전화번호 포맷
        formatDate: false,       // 날짜 포맷
        formatDateTime: false,   // 일시 포맷
        formatNumber: false,     // 숫자 포맷
        cleanEmail: false,       // 이메일 정제
        formatZip: false,        // 우편번호 정제
        highlightChanges: false, // 변경사항 하이라이트
        cleanGarbage: false,     // 가비지 데이터 제거
        cleanAmount: false,      // 금액 단위 정제
        cleanName: false,         // 이름 정제
        formatBizNum: false,      // 사업자번호 포맷
        formatCorpNum: false,     // 법인번호 포맷
        formatUrl: false,         // URL 표준화
        maskPersonalData: false,   // 개인정보 마스킹
        formatTrackingNum: false, // 운송장번호 정제
        cleanOrderId: false,      // 주문번호 정제
        formatTaxDate: false,     // 세무용 날짜
        formatAccountingNum: false, // 회계 음수
        cleanAreaUnit: false,     // 면적 단위 제거
        cleanSnsId: false,        // SNS ID 추출
        formatHashtag: false      // 해시태그 표준화
    },
    lockedColumns: string[] = [],
    columnOptions: ColumnSpecificOptions = {}
): DataRow[] {
    const lowerPrompt = prompt.toLowerCase();

    // 원본 데이터 보존을 위해 얕은 복사 수행
    let processed = data.map(row => ({ ...row }));

    // 프롬프트 내 키워드 포함 여부 확인 헬퍼
    const filterBy = (keywords: string[]) => keywords.some(k => lowerPrompt.includes(k));
    // 실행 동사 포함 여부 (단순 명사 언급과 구분하기 위함)
    const hasAction = filterBy(['지워', '제거', '삭제', '없애', '정리', '닦아', '통일', '표준', '바꿔', '변경', '추출', '분리', '남겨']);

    // 1. 휴대폰 및 전화번호 정제 (Phone & Mobile)
    const hasPhoneOptions = Object.values(columnOptions).some(v => v === 'mobile' || v === 'phone');
    if (options.formatMobile || options.formatGeneralPhone || hasPhoneOptions || filterBy(['휴대폰', '전화번호', '폰번호', '연락처'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;

                const colOption = columnOptions[key];
                const lowerKey = key.toLowerCase();
                const isPhoneCol = lowerKey.includes('연락처') || lowerKey.includes('전화번호') || lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('tel');

                // 개별 옵션 또는 전역 필터링 대상일 때 처리
                if (colOption === 'mobile' || colOption === 'phone' || isPhoneCol) {
                    let val = String(newRow[key]);
                    const shortPatternMatch = val.match(/(\d{3,4})[-. ]?(\d{4})/);
                    let onlyDigits = val.replace(/\D/g, '');

                    // 국제전화 코드 82 처리
                    if (onlyDigits.startsWith('82')) {
                        onlyDigits = '0' + onlyDigits.substring(2);
                    }

                    // 휴대폰 번호 포맷 (01X-XXXX-XXXX)
                    if (onlyDigits.startsWith('01') && (colOption === 'mobile' || options.formatMobile || filterBy(['휴대폰', '모바일', '010', '01']))) {
                        if (onlyDigits.length >= 10 && onlyDigits.length <= 11) {
                            newRow[key] = onlyDigits.replace(/^(01[016789])(\d{3,4})(\d{4})$/, "$1-$2-$3");
                            continue;
                        }
                    }

                    // 일반 유선전화 포맷 (지역번호-국번-번호)
                    if (onlyDigits.startsWith('0') && (colOption === 'phone' || options.formatGeneralPhone || filterBy(['지역번호', '유선전화', '일반전화']))) {
                        if (onlyDigits.length >= 9 && onlyDigits.length <= 11) {
                            const areaCode = onlyDigits.startsWith('02') ? 2 : 3;
                            const regex = new RegExp(`^(\\d{${areaCode}})(\\d{3,4})(\\d{4})$`);
                            if (regex.test(onlyDigits)) {
                                newRow[key] = onlyDigits.replace(regex, "$1-$2-$3");
                                continue;
                            }
                        }
                    }

                    // 개별 옵션이 '이동전화'인데 강제 변환이 필요한 경우 (글로벌 옵션 없이도)
                    if (colOption === 'mobile' && onlyDigits.length >= 10) {
                        newRow[key] = onlyDigits.replace(/^(01[016789])(\d{3,4})(\d{4})$/, "$1-$2-$3");
                        continue;
                    }

                    // 기타 번호 포맷 (글로벌 옵션 기준)
                    if (onlyDigits.length >= 7 && onlyDigits.length <= 8) {
                        newRow[key] = onlyDigits.replace(/(\d{3,4})(\d{4})/, "$1-$2");
                    } else if (shortPatternMatch && onlyDigits.length < 11) {
                        newRow[key] = shortPatternMatch[1] + '-' + shortPatternMatch[2];
                    } else if (onlyDigits.length >= 7 && onlyDigits.length <= 11) {
                        newRow[key] = onlyDigits.replace(/(\d{2,3})(\d{3,4})(\d{4})/, "$1-$2-$3");
                    } else if (/[A-Za-z가-힣]/.test(val) && onlyDigits.length < 7) {
                        newRow[key] = '';
                    }
                }
            }
            return newRow;
        });
    }

    // 2. 공백 제거 (Whitespace)
    if (options.removeWhitespace || ((filterBy(['공백', '스페이스', '빈칸'])) && hasAction)) {
        const targetName = filterBy(['이름', '성함', '성명']);
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                // 옵션이 꺼져있는데 이름만 대상으로 하는 경우 필터링
                if (!options.removeWhitespace && targetName) {
                    const keyLower = key.toLowerCase();
                    if (!key.includes('이름') && !key.includes('성함') && !key.includes('성명') && !keyLower.includes('name')) continue;
                }
                if (typeof newRow[key] === 'string') {
                    newRow[key] = (newRow[key] as string).trim();
                }
            }
            return newRow;
        });
    }

    // 3. 날짜 및 일시 정제 (Date / DateTime)
    // 글로벌 옵션 OR 컬럼별 옵션이 하나라도 있으면 실행
    const hasColumnDateOptions = Object.values(columnOptions).some(v => v === 'date' || v === 'datetime');

    if (options.formatDate || options.formatDateTime || hasColumnDateOptions || filterBy(['날짜', '일시', '일자', 'date'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;

                // 1. 컬럼별 지정 옵션 우선 확인
                const colOption = columnOptions[key];

                if (colOption === 'datetime') {
                    const val = String(newRow[key]).trim();
                    const normalizedDT = normalizeDateTime(val);
                    if (normalizedDT) {
                        newRow[key] = normalizedDT;
                        continue;
                    }
                }

                if (colOption === 'date') {
                    const val = String(newRow[key]).trim();
                    const normalized = normalizeDate(val);
                    if (normalized) {
                        newRow[key] = normalized;
                        continue;
                    }
                }

                // 2. 글로벌 옵션 적용 (단, 컬럼별 옵션이 설정된 컬럼은 위에서 처리/continue 되거나, 무시됨)
                // 만약 컬럼별 옵션이 'null'이 아니고 설정되어 있다면 글로벌 옵션은 무시해야 함.
                if (colOption) continue;

                const lowerKey = key.toLowerCase();
                const isDateCol = lowerKey.includes('날짜') || lowerKey.includes('일시') || lowerKey.includes('일자') || lowerKey.includes('date') || lowerKey.includes('time');

                if (isDateCol) {
                    const val = String(newRow[key]).trim();

                    // 일시 포맷 (DateTime)
                    if (options.formatDateTime) {
                        const normalizedDT = normalizeDateTime(val);
                        if (normalizedDT) {
                            newRow[key] = normalizedDT;
                            continue;
                        }
                    }

                    // 날짜 포맷 (Date)
                    if (options.formatDate || filterBy(['날짜', '일시', '일자', 'date'])) {
                        const normalized = normalizeDate(val);
                        if (normalized) {
                            newRow[key] = normalized;
                        } else if (/오늘|어제|그저께|그제/.test(val)) {
                            // 상대 날짜 처리
                            const now = new Date();
                            let diff = 0;
                            if (val.includes('어제')) diff = -1;
                            if (val.includes('그저께') || val.includes('그제')) diff = -2;
                            const targetDate = new Date(now.getTime() + (diff * 24 * 60 * 60 * 1000));
                            newRow[key] = `${targetDate.getFullYear()}.${String(targetDate.getMonth() + 1).padStart(2, '0')}.${String(targetDate.getDate()).padStart(2, '0')}`;
                        }
                    }
                }
            }
            return newRow;
        });
    }

    // 4. 주소 시/도 추출 (City/Province)
    if (filterBy(['주소', '지역', '거주지']) && filterBy(['시/도', '도', '추출', '분리', '남겨'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            let addressKey = Object.keys(newRow).find(k => k.includes('주소') || k.toLowerCase().includes('address') || k.includes('위치'));
            if (addressKey && typeof newRow[addressKey] === 'string') {
                const addr = newRow[addressKey] as string;
                const sido = addr.split(' ')[0];
                newRow['시/도'] = sido;
            }
            return newRow;
        });
    }

    // 5. 중복 행 제거 (Duplicates)
    if (filterBy(['중복']) && filterBy(['제거', '삭제', '없애', '지워'])) {
        const seen = new Set();
        processed = processed.filter(row => {
            const str = JSON.stringify(row);
            if (seen.has(str)) return false;
            seen.add(str);
            return true;
        });
    }

    // 6. 단순 행 삭제 (Generic removal - 예시 로직)
    if (filterBy(['삭제', '제외']) && filterBy(['행', '데이터', '줄'])) {
        processed = processed.slice(0, Math.max(1, processed.length - 1));
    }

    // 7. 숫자 천단위 콤마 포맷 (Simple Number Formatting)
    const hasAmountOptions = Object.values(columnOptions).some(v => v === 'amount' || v === 'amountKrn');
    if (options.formatNumber || hasAmountOptions || filterBy(['숫자', '콤마', '포맷'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const val = String(newRow[key]).trim();
                const lowerKey = key.toLowerCase();
                const colOption = columnOptions[key];

                // 이름, 코드, ID, 주소 등은 숫자로 보일 수 있어도 콤마 찍지 않음
                const skipKeywords = ['이름', '고객명', '성함', '성명', '주소', 'address', 'id', '코드', 'code', '번호', 'no'];
                const isSkipCol = skipKeywords.some(k => lowerKey.includes(k));

                if (colOption === 'amount' || (!isSkipCol && !/^0/.test(val) && !val.match(/^(19|20)\d{2}[-.]?\d{2}[-.]?\d{2}$/))) {
                    // 旣 숫자이거나 콤마가 있는 숫자인 경우
                    const cleanVal = val.replace(/,/g, '');
                    if (/^\d+(\.\d+)?$/.test(cleanVal)) {
                        const num = parseFloat(cleanVal);
                        if (!isNaN(num)) {
                            newRow[key] = num.toLocaleString('en-US');
                        }
                    }
                }
            }
            return newRow;
        });
    }

    // 8. 금액 정밀 정제 (Advanced Amount & Unit Cleaning)
    if (options.cleanAmount || hasAmountOptions || filterBy(['금액', '가격', '단가', '돈', '단위', '만', '천', '백'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const val = String(newRow[key]).trim();
                const lowerKey = key.toLowerCase();
                const colOption = columnOptions[key];
                const isMoneyCol = /금액|가격|비용|매출|입금|출금|잔액|price|amount|cost|balance|fee/.test(lowerKey);

                if (colOption === 'amount' || colOption === 'amountKrn' || isMoneyCol || /[만천백]원$/.test(val)) {
                    // 1. 한글 단위가 포함된 경우 또는 개별 옵션이 amountKrn인 경우
                    if (colOption === 'amountKrn' || /[만천백]/.test(val)) {
                        const parsedValue = parseKoreanAmount(val);
                        if (parsedValue > 0) {
                            newRow[key] = parsedValue.toLocaleString('en-US');
                            continue;
                        }
                    }

                    // 2. 숫자만 추출
                    const digitsOnly = val.replace(/[^0-9.-]/g, '');
                    const num = parseFloat(digitsOnly);
                    if (!isNaN(num)) {
                        newRow[key] = num.toLocaleString('en-US');
                    } else if (val !== '') {
                        newRow[key] = '0';
                    }
                }
            }
            return newRow;
        });
    }

    // 9. 이메일 정제 (Email)
    const hasEmailOptions = Object.values(columnOptions).includes('email');
    if (options.cleanEmail || hasEmailOptions || filterBy(['이메일', '메일', 'email'])) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const val = String(newRow[key]).trim();
                const lowerKey = key.toLowerCase();
                const colOption = columnOptions[key];

                const isEmailCol = lowerKey.includes('이메일') || lowerKey.includes('email') || val.includes('@');

                if (colOption === 'email' || isEmailCol) {
                    if (val && !emailRegex.test(val)) {
                        newRow[key] = ''; // 유효하지 않은 이메일은 제거
                    }
                }
            }
            return newRow;
        });
    }

    // 10. 우편번호 정제 (Zip Code)
    const normalizedZipPrompt = lowerPrompt.replace(/\s+/g, '');
    const hasZipKeyword = filterBy(['우편번호', 'zip', 'postal', '우편']);
    const hasZipOptions = Object.values(columnOptions).includes('zip');

    // 프롬프트 해석 로직: "5자리 제거", "5자리 초과 삭제" 등
    const hasFive = filterBy(['5자리', '5자', '다섯자리', '5글자']) || normalizedZipPrompt.includes('5자리') || normalizedZipPrompt.includes('5자') || normalizedZipPrompt.includes('5');
    const hasOver = filterBy(['넘', '초과', '이상', '많']) || normalizedZipPrompt.includes('넘') || normalizedZipPrompt.includes('over');
    const hasClear = filterBy(['빈칸', '지워', '삭제', '제거', 'empty', 'clear']) || (filterBy(['변경', '바꿔', '처리']) && filterBy(['빈칸', '공백', 'empty']));
    const shouldClearLongZip = (hasFive && hasClear) || (hasFive && hasOver && hasClear);

    if (options.formatZip || hasZipKeyword || hasZipOptions || (hasZipKeyword && shouldClearLongZip)) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const lowerKey = key.toLowerCase();
                const normalizedKey = lowerKey.replace(/\s+/g, '');
                const colOption = columnOptions[key];

                const isZipCandidate = normalizedKey.includes('우편번호') || normalizedKey.includes('우편') || lowerKey.includes('zip') || lowerKey.includes('postal');

                if (colOption === 'zip' || isZipCandidate) {
                    const val = String(newRow[key]).trim();
                    let onlyDigits = val.replace(/\D/g, '');

                    // 특정 조건 시 제거
                    if (shouldClearLongZip && onlyDigits.length > 5 && colOption !== 'zip') {
                        newRow[key] = '';
                        continue;
                    }

                    // 5자리보다 길면 앞자리만 사용 (단, 하이픈이 없는 경우)
                    if (onlyDigits.length > 5 && !val.includes('-')) {
                        onlyDigits = onlyDigits.substring(0, 5);
                    }

                    if (onlyDigits.length > 0 && onlyDigits.length <= 6) {
                        newRow[key] = onlyDigits.padStart(5, '0');
                    }
                }
            }
            return newRow;
        });
    }

    // 11. 사업자/법인번호 정제 (Business/Corp Number)
    const hasBizOptions = Object.values(columnOptions).some(v => v === 'bizNum' || v === 'corpNum');
    if (options.formatBizNum || options.formatCorpNum || hasBizOptions || filterBy(['사업자', '법인', '등록번호', 'biz', 'corp'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const lowerKey = key.toLowerCase();
                const val = String(newRow[key]).trim();
                const onlyDigits = val.replace(/[^0-9]/g, '');
                const colOption = columnOptions[key];

                // 사업자등록번호 (10자리)
                if (colOption === 'bizNum' || options.formatBizNum || (filterBy(['사업자']) && !filterBy(['법인']))) {
                    if (colOption === 'bizNum' || lowerKey.includes('사업자') || lowerKey.includes('biz')) {
                        if (onlyDigits.length === 10) {
                            newRow[key] = onlyDigits.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
                        }
                    }
                }

                // 법인등록번호 (13자리)
                if (colOption === 'corpNum' || options.formatCorpNum || filterBy(['법인', 'corp'])) {
                    if (colOption === 'corpNum' || lowerKey.includes('법인') || lowerKey.includes('corp')) {
                        if (onlyDigits.length === 13) {
                            newRow[key] = onlyDigits.replace(/(\d{6})(\d{7})/, '$1-$2');
                        }
                    }
                }
            }
            return newRow;
        });
    }

    // 12. URL 표준화 (URL Standardization)
    const hasUrlOptions = Object.values(columnOptions).includes('url');
    if (options.formatUrl || hasUrlOptions || filterBy(['url', '주소', '사이트', '홈페이지', 'web'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const lowerKey = key.toLowerCase();
                const colOption = columnOptions[key];

                if (colOption === 'url' || lowerKey.includes('url') || lowerKey.includes('web') || lowerKey.includes('site') || lowerKey.includes('page')) {
                    let val = String(newRow[key]).trim();
                    if (val && !val.startsWith('http') && val.includes('.')) {
                        newRow[key] = 'https://' + val;
                    }
                }
            }
            return newRow;
        });
    }

    // 13. 개인정보 마스킹 (Privacy Masking)
    const hasRrnOptions = Object.values(columnOptions).includes('rrn');
    if (options.maskPersonalData || hasRrnOptions || filterBy(['마스킹', '가림', '숨김', 'mask', 'privacy', '주민번호'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const val = String(newRow[key]).trim();
                const colOption = columnOptions[key];

                // 주민등록번호 패턴 (6자리-7자리) 또는 개별 설정인 경우
                if (colOption === 'rrn' || /\d{6}[-.]?[1-4]\d{6}/.test(val)) {
                    // 뒷자리 마스킹 (하이픈 유지/추가)
                    newRow[key] = val.replace(/(\d{6})[-.]?([1-4])\d{6}/, '$1-$2******');
                }
            }
            return newRow;
        });
    }

    // 14. 매핑 및 치환 (Mapping) - 프롬프트 기반
    if (filterBy(['변경', '변환', '교체', '바꿔', '수정', '치환'])) {
        // "A는 B로 바꿔줘" 형태 파싱
        const mappingRegex = /([\[\]%A-Za-z0-9가-힣_\-]+)\s*(?:데이터|값|문구|텍스트|형식|패턴)?(?:\s*의)?\s*(?:데이터|값|문구|텍스트)?\s*(?:는|은|->|:|를|을)\s*([\[\]%A-Za-z0-9가-힣_\-\s]+)/g;
        const matches = Array.from(lowerPrompt.matchAll(mappingRegex));
        const mappings: Record<string, string> = {};

        matches.forEach(m => {
            let from = m[1].trim().toLowerCase();
            let to = m[2].trim();

            // 어미 제거
            to = to.replace(/(?:으로|로|라고|하게|으로\s+변경|로\s+변경|로\s+수정|변경\s*해\s*줘|변경해줘|해\s*줘|해줘)$/, '').trim();
            to = to.replace(/(으로|로|라고|하게)$/, '').trim();

            if (['빈칸', '공백', 'empty', 'blank', '없음', '제거'].includes(to)) {
                to = '';
            }

            if (from && (to !== undefined)) {
                mappings[from] = to;
            }
        });

        if (Object.keys(mappings).length > 0) {
            let targetCol: string | undefined;
            // 특정 컬럼 지정 여부 확인: "ColName 컬럼의..."
            const colHintMatch = lowerPrompt.match(/['"]?([A-Za-z0-9가-힣]+)['"]?\s*컬럼/);
            if (colHintMatch) {
                const hint = colHintMatch[1].toLowerCase();
                targetCol = Object.keys(processed[0] || {}).find(k => k.toLowerCase().includes(hint));
            }

            // 와일드카드 패턴 매핑 준비
            const patternMappings: { regex: RegExp; replacement: string }[] = [];
            for (const mapFrom in mappings) {
                if (mapFrom.includes('%')) {
                    let regexStr = mapFrom
                        .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // 정규식 특수문자 이스케이프
                        .replace(/(?:\\\[)?%d(?:\\\])?/g, '\\d+')           // %d -> 숫자
                        .replace(/(?:\\\[)?%s(?:\\\])?/g, '.+')             // %s -> 문자
                        .replace(/(?:\\\[)?%(\d+)d(?:\\\])?/g, '\\d{$1}')   // %3d -> 숫자 3자리
                        .replace(/(?:\\\[)?%(\d+)s(?:\\\])?/g, '.{$1}');    // %5s -> 문자 5자리

                    try {
                        patternMappings.push({
                            regex: new RegExp(`^${regexStr}$`, 'i'),
                            replacement: mappings[mapFrom]
                        });
                    } catch (e) {
                        console.error('Failed to compile pattern regex:', regexStr);
                    }
                }
            }

            processed = processed.map(row => {
                const newRow = { ...row };
                for (const key in newRow) {
                    if (targetCol && key !== targetCol) continue;
                    let val = String(newRow[key]).toLowerCase().trim();

                    if (mappings[val] !== undefined && !val.includes('[%')) {
                        newRow[key] = mappings[val];
                    } else {
                        for (const pm of patternMappings) {
                            if (pm.regex.test(val)) {
                                newRow[key] = pm.replacement;
                                break;
                            }
                        }
                    }
                }
                return newRow;
            });
        }
    }

    // 15. 가비지 데이터 제거 (Garbage Cleaning)
    if (options.cleanGarbage || filterBy(['가비지', '쓰레기', '의미없는', '깨진', 'garbage', 'noise'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const val = String(newRow[key]).trim();
                if (GARBAGE_REGEX.test(val)) {
                    newRow[key] = '';
                }
            }
            return newRow;
        });
    }

    // 16. 이름 데이터 정제 (Clean Name)
    if (options.cleanName || (filterBy(['이름', '성함', '성명', '고객명']) && hasAction)) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const lowerKey = key.toLowerCase();
                const isNameCol = ['이름', '고객명', '성함', '성명', 'name'].some(k => lowerKey.includes(k));

                if (isNameCol) {
                    let val = String(newRow[key]);
                    // 한글, 영문, 공백을 제외한 모든 문자 제거
                    const cleaned = val.replace(/[^가-힣a-zA-Z\s]/g, '').trim();
                    if (cleaned !== val) {
                        newRow[key] = cleaned;
                    }
                }
            }
            return newRow;
        });
    }
    // 17. 업종별 특화 정제 (Industry Specific)

    // (1) 운송장번호 정제 (Tracking Number)
    const hasTrackingOptions = Object.values(columnOptions).includes('trackingNum');
    if (options.formatTrackingNum || hasTrackingOptions || filterBy(['운송장', '송장', '택배번호', 'tracking'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const colOption = columnOptions[key];
                const isTrackingCol = /운송장|송장|택배/.test(key) || key.toLowerCase().includes('tracking');

                if (colOption === 'trackingNum' || isTrackingCol) {
                    let val = String(newRow[key]).trim();
                    if (val.includes('E+') || val.includes('e+')) {
                        const num = Number(val);
                        if (!isNaN(num)) val = num.toString();
                    }
                    const onlyDigits = val.replace(/[^0-9]/g, '');
                    if (onlyDigits.length > 5) {
                        newRow[key] = onlyDigits;
                    }
                }
            }
            return newRow;
        });
    }

    // (2) 주문번호 정제 (Order ID)
    const hasOrderOptions = Object.values(columnOptions).includes('orderId');
    if (options.cleanOrderId || hasOrderOptions || filterBy(['주문번호', '오더', 'order'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const colOption = columnOptions[key];
                const isOrderIdCol = /주문|오더|order/.test(key.toLowerCase());

                if (colOption === 'orderId' || isOrderIdCol) {
                    let val = String(newRow[key]).trim();
                    const cleaned = val.replace(/[^a-zA-Z0-9]/g, '');
                    if (cleaned.length > 0) newRow[key] = cleaned;
                }
            }
            return newRow;
        });
    }

    // (3) 세무용 날짜 (Tax Date) - YYYYMMDD
    if (options.formatTaxDate || filterBy(['세무', '신고', '8자리', '홈택스'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                if (/날짜|일자|date|시간/.test(key.toLowerCase())) {
                    let val = String(newRow[key]).trim();
                    const digits = val.replace(/[^0-9]/g, '');
                    if (digits.length === 8) {
                        newRow[key] = digits; // 이미 8자리
                    } else if (digits.length > 8 && digits.startsWith('20')) {
                        newRow[key] = digits.substring(0, 8); // 시분초 제거
                    }
                }
            }
            return newRow;
        });
    }

    // (4) 회계 음수 (Accounting Negative)
    if (options.formatAccountingNum || filterBy(['회계', '음수', '괄호', '마이너스'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                let val = String(newRow[key]).trim();
                // (1,000) or △1,000 패턴
                if (/^\(.*\)$/.test(val) || /^[△▲]/.test(val)) {
                    // 숫자와 점만 추출
                    const cleanNum = val.replace(/[^0-9.]/g, '');
                    if (cleanNum) {
                        newRow[key] = '-' + cleanNum;
                    }
                }
            }
            return newRow;
        });
    }

    // (5) 면적 단위 제거 (Real Estate Area)
    const hasAreaOptions = Object.values(columnOptions).includes('area');
    if (options.cleanAreaUnit || hasAreaOptions || filterBy(['면적', '평수', '제곱미터', 'm2', 'area'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const colOption = columnOptions[key];
                const isAreaCol = /면적|평|area|size/.test(key.toLowerCase());

                if (colOption === 'area' || isAreaCol) {
                    let val = String(newRow[key]).trim();
                    const cleanNum = val.replace(/[^0-9.]/g, '');
                    if (cleanNum && val.match(/[0-9]/)) {
                        newRow[key] = cleanNum;
                    }
                }
            }
            return newRow;
        });
    }

    // (6) SNS ID 추출 (Marketing)
    const hasSnsOptions = Object.values(columnOptions).includes('snsId');
    if (options.cleanSnsId || hasSnsOptions || filterBy(['아이디', '계정', 'id', 'sns'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const colOption = columnOptions[key];
                const isSnsCol = /id|아이디|계정|instagram|sns/.test(key.toLowerCase());

                if (colOption === 'snsId' || isSnsCol) {
                    let val = String(newRow[key]).trim();
                    if (val.includes('/')) {
                        const parts = val.split('/');
                        val = parts[parts.length - 1] || parts[parts.length - 2];
                    }
                    val = val.replace('@', '');
                    val = val.split('?')[0];

                    if (val) newRow[key] = val;
                }
            }
            return newRow;
        });
    }

    // (7) 해시태그 표준화 (Marketing)
    const hasHashtagOptions = Object.values(columnOptions).includes('hashtag');
    if (options.formatHashtag || hasHashtagOptions || filterBy(['해시태그', '태그', 'tag', '키워드'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const colOption = columnOptions[key];
                const isHashtagCol = /태그|tag|키워드/.test(key.toLowerCase());

                if (colOption === 'hashtag' || isHashtagCol) {
                    let val = String(newRow[key]).trim();
                    if (!val) continue;

                    const tags = val.split(/[,,\s]+/).filter(Boolean).map(t => {
                        t = t.replace(/#/g, '');
                        return '#' + t;
                    });
                    newRow[key] = tags.join(' ');
                }
            }
            return newRow;
        });
    }

    return processed;
}
