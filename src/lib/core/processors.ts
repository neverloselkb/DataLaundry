import { DataRow, ProcessingOptions } from '@/types';
import { normalizeDate, normalizeDateTime, parseKoreanAmount, GARBAGE_REGEX } from './utils';

/**
 * 로컬 브라우저 환경에서 데이터를 정제하는 핵심 함수입니다.
 * 사용자 옵션(체크박스)과 프롬프트(자연어)를 기반으로 정제 로직을 수행합니다.
 * 
 * @param data 원본 데이터 배열
 * @param prompt 사용자 입력 프롬프트 (자연어 명령어)
 * @param options 선택된 정제 옵션들
 * @param lockedColumns 수정 잠금 처리된 컬럼 목록
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
        cleanName: false         // 이름 정제
    },
    lockedColumns: string[] = []
): DataRow[] {
    const lowerPrompt = prompt.toLowerCase();

    // 원본 데이터 보존을 위해 얕은 복사 수행
    let processed = data.map(row => ({ ...row }));

    // 프롬프트 내 키워드 포함 여부 확인 헬퍼
    const filterBy = (keywords: string[]) => keywords.some(k => lowerPrompt.includes(k));
    // 실행 동사 포함 여부 (단순 명사 언급과 구분하기 위함)
    const hasAction = filterBy(['지워', '제거', '삭제', '없애', '정리', '닦아', '통일', '표준', '바꿔', '변경', '추출', '분리', '남겨']);

    // 1. 휴대폰 및 전화번호 정제 (Phone & Mobile)
    if (options.formatMobile || options.formatGeneralPhone || filterBy(['휴대폰', '전화번호', '폰번호', '연락처'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const lowerKey = key.toLowerCase();
                const isPhoneCol = lowerKey.includes('연락처') || lowerKey.includes('전화번호') || lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('tel');

                if (isPhoneCol) {
                    let val = String(newRow[key]);
                    const shortPatternMatch = val.match(/(\d{3,4})[-. ]?(\d{4})/);
                    let onlyDigits = val.replace(/\D/g, '');

                    // 국제전화 코드 82 처리
                    if (onlyDigits.startsWith('82')) {
                        onlyDigits = '0' + onlyDigits.substring(2);
                    }

                    // 휴대폰 번호 포맷 (01X-XXXX-XXXX)
                    if (onlyDigits.startsWith('01') && (options.formatMobile || filterBy(['휴대폰', '모바일', '010', '01']))) {
                        if (onlyDigits.length >= 10 && onlyDigits.length <= 11) {
                            newRow[key] = onlyDigits.replace(/^(01[016789])(\d{3,4})(\d{4})$/, "$1-$2-$3");
                            continue; // 처리 완료 시 다음 키로
                        }
                    }

                    // 일반 유선전화 포맷 (지역번호-국번-번호)
                    if (onlyDigits.startsWith('0') && (options.formatGeneralPhone || filterBy(['지역번호', '유선전화', '일반전화']))) {
                        if (onlyDigits.length >= 9 && onlyDigits.length <= 11) {
                            const areaCode = onlyDigits.startsWith('02') ? 2 : 3;
                            const regex = new RegExp(`^(\\d{${areaCode}})(\\d{3,4})(\\d{4})$`);
                            if (regex.test(onlyDigits)) {
                                newRow[key] = onlyDigits.replace(regex, "$1-$2-$3");
                                continue;
                            }
                        }
                    }

                    // 기타 번호 포맷 (XXXX-XXXX 등)
                    if (onlyDigits.length >= 7 && onlyDigits.length <= 8) {
                        newRow[key] = onlyDigits.replace(/(\d{3,4})(\d{4})/, "$1-$2");
                    } else if (shortPatternMatch && onlyDigits.length < 11) {
                        newRow[key] = shortPatternMatch[1] + '-' + shortPatternMatch[2];
                    } else if (onlyDigits.length >= 7 && onlyDigits.length <= 11) {
                        newRow[key] = onlyDigits.replace(/(\d{2,3})(\d{3,4})(\d{4})/, "$1-$2-$3");
                    } else if (/[A-Za-z가-힣]/.test(val) && onlyDigits.length < 7) {
                        // 전화번호 컬럼인데 문자열이 섞인 경우 (가비지) 제거
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
    if (options.formatDate || options.formatDateTime || filterBy(['날짜', '일시', '일자', 'date'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
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
    if (options.formatNumber || filterBy(['숫자', '콤마', '포맷'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const val = String(newRow[key]).trim();
                const lowerKey = key.toLowerCase();

                // 이름, 코드, ID, 주소 등은 숫자로 보일 수 있어도 콤마 찍지 않음
                const skipKeywords = ['이름', '고객명', '성함', '성명', '주소', 'address', 'id', '코드', 'code', '번호', 'no'];
                if (skipKeywords.some(k => lowerKey.includes(k))) continue;
                if (/^0/.test(val)) continue; // 0으로 시작하는 것은 (예: 우편번호) 제외

                if (val.match(/^(19|20)\d{2}[-.]?\d{2}[-.]?\d{2}$/)) continue; // 날짜 형식 제외

                // 이미 숫자이거나 콤마가 있는 숫자인 경우
                if (/^\d+(\.\d+)?$/.test(val.replace(/,/g, ''))) {
                    const num = parseFloat(val.replace(/,/g, ''));
                    if (!isNaN(num)) {
                        newRow[key] = num.toLocaleString('en-US');
                    }
                }
            }
            return newRow;
        });
    }

    // 8. 금액 정밀 정제 (Advanced Amount & Unit Cleaning)
    if (options.cleanAmount || filterBy(['금액', '가격', '단가', '돈', '단위', '만', '천', '백'])) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const val = String(newRow[key]).trim();
                const lowerKey = key.toLowerCase();
                const isMoneyCol = /금액|가격|비용|매출|입금|출금|잔액|price|amount|cost|balance|fee/.test(lowerKey);

                if (isMoneyCol || /[만천백]원$/.test(val)) {
                    // 한글 단위가 포함된 경우
                    if (/[만천백]/.test(val)) {
                        const parsedValue = parseKoreanAmount(val);
                        if (parsedValue > 0) {
                            newRow[key] = parsedValue.toLocaleString('en-US');
                            continue;
                        }
                    }

                    // 숫자만 추출
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
    if (options.cleanEmail || filterBy(['이메일', '메일', 'email'])) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const val = String(newRow[key]).trim();
                const lowerKey = key.toLowerCase();
                if (lowerKey.includes('이메일') || lowerKey.includes('email') || val.includes('@')) {
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

    // 프롬프트 해석 로직: "5자리 제거", "5자리 초과 삭제" 등
    const hasFive = filterBy(['5자리', '5자', '다섯자리', '5글자']) || normalizedZipPrompt.includes('5자리') || normalizedZipPrompt.includes('5자') || normalizedZipPrompt.includes('5');
    const hasOver = filterBy(['넘', '초과', '이상', '많']) || normalizedZipPrompt.includes('넘') || normalizedZipPrompt.includes('over');
    const hasClear = filterBy(['빈칸', '지워', '삭제', '제거', 'empty', 'clear']) || (filterBy(['변경', '바꿔', '처리']) && filterBy(['빈칸', '공백', 'empty']));

    const shouldClearLongZip = (hasFive && hasClear) || (hasFive && hasOver && hasClear);

    if (options.formatZip || hasZipKeyword || (hasZipKeyword && shouldClearLongZip)) {
        processed = processed.map(row => {
            const newRow = { ...row };
            for (const key in newRow) {
                if (lockedColumns.includes(key)) continue;
                const lowerKey = key.toLowerCase();
                const normalizedKey = lowerKey.replace(/\s+/g, '');
                if (normalizedKey.includes('우편번호') || normalizedKey.includes('우편') || lowerKey.includes('zip') || lowerKey.includes('postal')) {
                    const val = String(newRow[key]).trim();
                    let onlyDigits = val.replace(/\D/g, '');

                    // 특정 조건 시 제거
                    if (shouldClearLongZip && onlyDigits.length > 5) {
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

    // 11. 매핑 및 치환 (Mapping) - 프롬프트 기반
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

    // 12. 가비지 데이터 제거 (Garbage Cleaning)
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

    // 13. 이름 데이터 정제 (Clean Name)
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

    return processed;
}
