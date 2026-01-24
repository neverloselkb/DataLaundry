import { DataRow, ProcessingOptions, ColumnSpecificOptions } from '@/types';
import { normalizeDate, normalizeDateTime, parseKoreanAmount, GARBAGE_REGEX } from './utils';

/**
 * 로컬 브라우저 환경에서 데이터를 정제하는 핵심 함수입니다.
 * 사용자가 정의한 5대 우선순위 원칙을 준수하여 작동합니다.
 * 1. 잠금 컬럼 보호
 * 2. 개별 컬럼 옵션 우선 (단, NLP 지정 포맷 존중)
 * 3. 체크박스 수행 후 자연어 최종 적용
 * 4. 자연어는 기본 포맷을 무시하고 요청대로 처리
 */
export function processDataLocal(
    data: DataRow[],
    prompt: string,
    options: ProcessingOptions,
    lockedColumns: string[] = [],
    columnOptions: ColumnSpecificOptions = {}
): DataRow[] {
    const lowerPrompt = prompt.toLowerCase();
    const filterBy = (keywords: string[]) => keywords.some(k => lowerPrompt.includes(k));
    const hasAction = filterBy(['지워', '제거', '삭제', '없애', '정리', '닦아', '통일', '표준', '바꿔', '변경', '추출', '분리', '남겨', '빼']);

    // --- [NLP 분석] ---
    const wantsHyphenRemoval = filterBy(['하이픈', '대시', '-']) && filterBy(['제거', '삭제', '빼', '지워', '없애']);
    const wantsCommaRemoval = filterBy(['콤마', '쉼표', ',']) && filterBy(['제거', '삭제', '빼', '지워', '없애']);
    const wantsUnmask = filterBy(['마스킹', '가림', '별표']) && filterBy(['제거', '삭제', '해제', '풀어', '보이게', '표시']);
    const wantsSido = filterBy(['시/도', '시도', '광역']) && filterBy(['추출', '분리', '남겨', '따로', '앞에']);
    const wantsGungu = filterBy(['구/군', '구군', '시/군/구']) && filterBy(['추출', '분리', '남겨', '따로']);
    const wantsOnlyDigits = filterBy(['숫자만', '숫자 추출']);
    const wantsOnlyKorean = filterBy(['한글만', '한글 추출']);
    const wantsOnlyEnglish = filterBy(['영어만', '영문만', 'english only']);
    const wantsNoSpecial = filterBy(['특수문자', '기호']) && filterBy(['제거', '삭제', '빼', '지워']);
    const wantsNoBrackets = filterBy(['괄호', 'bracket']) && filterBy(['제거', '삭제', '내용삭제']);
    const wantsCompanyClean = filterBy(['업체명', '회사명', '상호', '주식회사', '(주)']) && filterBy(['정리', '정규화', '제거', '삭제', '빼']);
    const wantsPositionRemoval = filterBy(['직함', '직위', '직책', '네임']) && filterBy(['제거', '삭제', '빼', '지워']);
    const wantsDongExtraction = filterBy(['동/읍/면', '동읍면', '상세주소']) && filterBy(['추출', '분리', '남겨', '따로']);
    const wantsMasking = filterBy(['마스킹', '가림', '별표', '숨김']) && (filterBy(['계좌', '카드', '번호']) || filterBy(['뒷자리', '중간']));

    // Mappings & Pattern Mappings [Rule 4, 5]
    const mappings: Record<string, string> = {};
    const patternMappings: { regex: RegExp; replacement: string }[] = [];
    if (filterBy(['변경', '변환', '교체', '바꿔', '수정', '치환', '통일'])) {
        const mappingRegex = /([\[\]%A-Za-z0-9가-힣_\-]+)\s*(?:데이터|값|문구|텍스트|형식|패턴)?(?:\s*의)?\s*(?:데이터|값|문구|텍스트)?\s*(?:는|은|->|:|를|을)\s*([\[\]%A-Za-z0-9가-힣_\-\s/.]+)/g;
        const matches = Array.from(lowerPrompt.matchAll(mappingRegex));
        matches.forEach(m => {
            let from = m[1].trim().toLowerCase();
            let to = m[2].trim();
            to = to.replace(/(?:으로|로|라고|하게|으로\s+변경|로\s+변경|로\s+수정|변경\s*해\s*줘|변경해줘|해\s*줘|해줘|형식으로|형식|포맷으로|포맷)$/g, '').trim();
            if (['빈칸', '공백', 'empty', 'blank', '없음', '제거'].includes(to)) to = '';
            if (from && (to !== undefined)) {
                if (from.includes('%')) {
                    let regexStr = from
                        .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
                        .replace(/(?:\\\[)?%d(?:\\\])?/g, '\\d+')
                        .replace(/(?:\\\[)?%s(?:\\\])?/g, '.+')
                        .replace(/(?:\\\[)?%(\d+)d(?:\\\])?/g, '\\d{$1}')
                        .replace(/(?:\\\[)?%(\d+)s(?:\\\])?/g, '.{$1}');
                    try {
                        patternMappings.push({ regex: new RegExp(`^${regexStr}$`, 'i'), replacement: to });
                    } catch (e) { }
                } else {
                    mappings[from] = to;
                }
            }
        });
    }

    // 날짜 포맷 NLP (프로그램 기본 포맷을 잠시 덮어씀) [Rule 5]
    let nlpDateSeparator: string | null = null;
    let nlpUseEmptySeparator = false;
    if (filterBy(['날짜', 'date'])) {
        if (filterBy(['yyyy/mm/dd', '/'])) nlpDateSeparator = '/';
        else if (filterBy(['yyyy.mm.dd', '.'])) nlpDateSeparator = '.';
        else if (filterBy(['yyyy-mm-dd', '하이픈', '-'])) nlpDateSeparator = '-';
        else if (filterBy(['yyyymmdd'])) nlpUseEmptySeparator = true;
    }

    // --- [통합 정제 루프] ---
    return data.map(row => {
        const newRow = { ...row };
        for (const key in newRow) {
            // [Rule 1] 잠금 컬럼 절대 보호
            if (lockedColumns.includes(key)) continue;

            const lowerKey = key.toLowerCase();
            const colOption = columnOptions[key];
            let val = String(newRow[key] || "").trim();

            // -----------------------------------------------------------------
            // 1단계: 전역 체크박스 옵션 (Checkbox Options) [Rule 3]
            // -----------------------------------------------------------------
            const isPhoneCol = /연락처|전화|phone|mobile|tel/.test(lowerKey);
            if (options.formatMobile || options.formatGeneralPhone || isPhoneCol) {
                if (wantsHyphenRemoval) {
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

            if (options.removeWhitespace || ((filterBy(['공백', '스페이스', '빈칸'])) && hasAction)) {
                val = val.replace(/\s+/g, ' ').trim();
            }

            const isDateCol = /날짜|일시|일자|date|time/.test(lowerKey);
            if (options.formatDate || options.formatDateTime || isDateCol) {
                // nlp 지정 포맷이 없는 경우에만 기본 포맷 적용 (Rule 5)
                if (nlpDateSeparator === null && !nlpUseEmptySeparator) {
                    if (options.formatDateTime) val = normalizeDateTime(val) || val;
                    else val = normalizeDate(val) || val;
                }
            }

            if (options.formatNumber || options.cleanAmount || isAmountColPattern(lowerKey)) {
                if (wantsCommaRemoval) val = val.replace(/,/g, '');
                else if (/[만천백]/.test(val)) {
                    const parsed = parseKoreanAmount(val);
                    if (parsed > 0) val = parsed.toLocaleString('en-US');
                } else {
                    const cleanVal = val.replace(/,/g, '');
                    if (/^[0-9.-]+$/.test(cleanVal)) {
                        const num = parseFloat(cleanVal);
                        if (!isNaN(num)) val = num.toLocaleString('en-US');
                    }
                }
            }

            const isEmailCol = /email|이메일/.test(lowerKey);
            if (options.cleanEmail && isEmailCol) {
                if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) val = '';
            } else if (isEmailCol && val.includes('@')) {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) val = '';
            }

            if (options.formatZip || lowerKey.includes('zip') || lowerKey.includes('우편')) {
                let digits = val.replace(/\D/g, '');
                if (digits.length > 5 && !val.includes('-')) digits = digits.substring(0, 5);
                if (digits.length > 0 && digits.length <= 6) val = digits.padStart(5, '0');
            }

            if (options.formatBizNum || lowerKey.includes('사업자')) {
                const digits = val.replace(/\D/g, '');
                if (digits.length === 10) val = digits.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
            }

            if (options.formatCorpNum || lowerKey.includes('법인')) {
                const digits = val.replace(/\D/g, '');
                if (digits.length === 13) val = digits.replace(/(\d{6})(\d{7})/, '$1-$2');
            }

            if (options.formatUrl || lowerKey.includes('url')) {
                if (val && !val.startsWith('http') && val.includes('.')) val = 'https://' + val;
            }

            if (!wantsUnmask && (options.maskPersonalData || lowerKey.includes('주민번호'))) {
                if (/\d{6}[-.]?[1-4]\d{6}/.test(val)) val = val.replace(/(\d{6})[-.]?([1-4])\d{6}/, '$1-$2******');
            }

            if (options.cleanGarbage || filterBy(['가비지', '쓰레기'])) {
                if (GARBAGE_REGEX.test(val)) val = '';
            }

            // -----------------------------------------------------------------
            // 2단계: 자연어 처리 (NLP Smart) [Rule 4]
            // -----------------------------------------------------------------
            if (wantsNoSpecial) val = val.replace(/[^\w\s가-힣]/g, '');
            if (wantsNoBrackets) val = val.replace(/\(.*\)|\[.*\]|\{.*\}/g, '').trim();
            if (wantsOnlyDigits) val = val.replace(/\D/g, '');
            else if (wantsOnlyKorean) val = val.replace(/[^가-힣\s]/g, '');
            else if (wantsOnlyEnglish) val = val.replace(/[^a-zA-Z\s]/g, '');

            if (/주소|지역|address/.test(lowerKey)) {
                if (wantsSido) {
                    const match = val.match(/^([가-힣]+[시도])/);
                    val = match ? match[1] : val.split(' ')[0];
                } else if (wantsGungu) {
                    const parts = val.split(' ');
                    if (parts.length >= 2) val = parts[1];
                } else if (options.extractDong || wantsDongExtraction) {
                    const match = val.match(/([가-힣0-9]+[동읍면])/);
                    val = match ? match[1] : val;
                }
            }

            // 업체명 정리 [Rule 5]
            if ((options.cleanCompanyName || wantsCompanyClean) && (lowerKey.includes('업체') || lowerKey.includes('회사') || lowerKey.includes('상호') || lowerKey.includes('name'))) {
                val = val.replace(/\((?:주|유|합|사|재|특|협|공|사단|재단|법인)\)|(?:주|유|합|사|재)식회사/g, '').trim();
            }

            // 직함 제거
            if ((options.removePosition || wantsPositionRemoval) && (lowerKey.includes('이름') || lowerKey.includes('성함') || lowerKey.includes('담당') || lowerKey.includes('name'))) {
                val = val.replace(/\s?(?:대리|과장|차장|부장|팀장|본부장|실장|사장|대표|이사|전무|상무|위원|교수|의사|간호사|연구원)$/, '').trim();
            }

            // 계좌/카드 마스킹
            if (options.maskAccount || options.maskCard || wantsMasking) {
                const isAccount = lowerKey.includes('계좌') || lowerKey.includes('account') || options.maskAccount;
                const isCard = lowerKey.includes('카드') || lowerKey.includes('card') || options.maskCard;

                if (isAccount || isCard || /^[0-9-]{12,}$/.test(val.replace(/\s/g, ''))) {
                    const cleanVal = val.replace(/[-\s]/g, '');
                    if (cleanVal.length >= 10) {
                        if (filterBy(['중간'])) {
                            val = val.length > 8 ? val.substring(0, 4) + "****" + val.substring(8) : val;
                        } else {
                            val = val.substring(0, val.length - 4) + "****";
                        }
                    }
                }
            }

            // [NEW] 성함 마스킹
            if (options.maskName || (filterBy(['성함', '이름']) && filterBy(['마스킹', '별표']))) {
                if (/이름|성함|name/.test(lowerKey) || (val.length >= 2 && val.length <= 4 && /^[가-힣]+$/.test(val))) {
                    if (val.length === 2) val = val[0] + '*';
                    else if (val.length === 3) val = val[0] + '*' + val[2];
                    else if (val.length > 3) val = val[0] + '**' + val[val.length - 1];
                }
            }

            // [NEW] 이메일 마스킹
            if (options.maskEmail || (filterBy(['이메일', 'email']) && filterBy(['마스킹', '별표']))) {
                if (val.includes('@')) {
                    const [id, domain] = val.split('@');
                    if (id.length <= 3) val = id[0] + '***@' + domain;
                    else val = id.substring(0, 3) + '****@' + domain;
                }
            }

            // [NEW] 상세 주소 마스킹
            if (options.maskAddress || (filterBy(['주소']) && filterBy(['상세', '뒷부분']) && filterBy(['마스킹', '가림']))) {
                if (/주소|address/.test(lowerKey)) {
                    // 번지수, 동호수 패턴 대략적 마스킹 (숫자+하이픈 조합 가림)
                    val = val.replace(/\d+-\d+/g, '****').replace(/\d+동\s?\d+호/g, '****호').replace(/\d+번길\s?\d+/g, '$1 ****');
                }
            }

            // [NEW] 연락처 중간자리 마스킹
            if (options.maskPhoneMid) {
                if (val.includes('-')) {
                    const parts = val.split('-');
                    if (parts.length === 3) val = `${parts[0]}-****-${parts[2]}`;
                }
            }

            // [NEW] 나이 범주화
            if (options.categoryAge || (filterBy(['나이', 'age']) && filterBy(['범주', '연령대']))) {
                if (/나이|연령|age/.test(lowerKey) || (/^\d{1,2}$/.test(val))) {
                    const ageNum = parseInt(val.replace(/\D/g, ''));
                    if (!isNaN(ageNum)) val = `${Math.floor(ageNum / 10) * 10}대`;
                }
            }

            // [NEW] 날짜 절삭 (연/월)
            if (options.truncateDate || (filterBy(['날짜', 'date']) && filterBy(['절삭', '연월', '일 제거']))) {
                const dateDigits = val.replace(/\D/g, '');
                if (dateDigits.length >= 6) {
                    const sep = nlpDateSeparator || '.';
                    val = `${dateDigits.substring(0, 4)}${sep}${dateDigits.substring(4, 6)}`;
                }
            }

            // [NEW] 엑셀 지수 표기 복원
            if (options.restoreExponential || filterBy(['지수', 'exponential', 'E+'])) {
                if (val.includes('E+') || val.includes('e+')) {
                    const num = Number(val);
                    if (!isNaN(num)) val = num.toLocaleString('fullwide', { useGrouping: false });
                }
            }

            // [NEW] 주소 내 건물명 추출
            if (options.extractBuilding || filterBy(['건물명', '아파트명', '빌딩명'])) {
                if (/주소|address/.test(lowerKey)) {
                    const bMatch = val.match(/([가-힣0-9A-Za-z]+(?:아파트|빌딩|타워|상가|오피스텔|빌라|하우스|팰리스|캐슬|맨션))/);
                    if (bMatch) val = bMatch[1];
                }
            }

            // [NEW] SKU/모델명 표준화
            if (options.normalizeSKU || filterBy(['sku', '모델명', '상품코드'])) {
                if (/sku|모델|코드|model/.test(lowerKey)) {
                    val = val.toUpperCase().replace(/[-_\s]/g, '');
                }
            }

            // [NEW] 단위 수치화
            if (options.unifyUnit || filterBy(['단위 제거', '수치화', '숫자만'])) {
                if (/^[0-9.]+\s*(?:kg|g|t|m|cm|mm|평|m2|호|인분|개|p|set|세트)$/i.test(val)) {
                    val = val.replace(/[^0-9.]/g, '');
                }
            }

            // [NEW] 통화 표준화
            if (options.standardizeCurrency || filterBy(['통화', '화폐', '부호 제거'])) {
                if (/[$\u00A3\u20AC\u00A5\u20A9]/.test(val)) {
                    val = val.replace(/[$\u00A3\u20AC\u00A5\u20A9,\s]/g, '');
                }
            }

            // A->B 치환 및 패턴 매핑
            const lowerVal = val.toLowerCase();
            if (mappings[lowerVal] !== undefined) {
                val = mappings[lowerVal];
            } else {
                for (const pm of patternMappings) {
                    if (pm.regex.test(val)) {
                        val = pm.replacement;
                        break;
                    }
                }
            }

            // 자연어 날짜 포맷 강제 적용 (Rule 5)
            if (nlpDateSeparator !== null || nlpUseEmptySeparator) {
                const sep = nlpUseEmptySeparator ? "" : nlpDateSeparator!;
                const digits = val.replace(/\D/g, '');
                if (digits.length === 8 && /^\d{8}$/.test(digits)) {
                    val = `${digits.substring(0, 4)}${sep}${digits.substring(4, 6)}${sep}${digits.substring(6, 8)}`;
                } else if (/^\d{4}[-./]\d{2}[-./]\d{2}/.test(val)) {
                    val = val.substring(0, 10).replace(/[-./]/g, sep);
                }
            }

            // -----------------------------------------------------------------
            // 3단계: 개별 컬럼 지정 옵션 (Column Option) [Rule 2]
            // 가장 마지막에 수행되어 전역/자연어 결과를 최종 확고히 함.
            // 단, 자연어에서 정한 날짜 구분자가 있다면 이를 존중함 (Rule 5)
            // -----------------------------------------------------------------
            if (colOption) {
                const sep = (nlpDateSeparator !== null || nlpUseEmptySeparator) ? (nlpUseEmptySeparator ? "" : nlpDateSeparator!) : null;
                val = applySingleColumnOption(val, colOption, sep);
            }

            newRow[key] = val;
        }
        return newRow;
    });
}

/**
 * 헬퍼: 금액 컬럼 패턴 확인
 */
function isAmountColPattern(key: string): boolean {
    return /금액|가격|비용|매출|입금|출금|잔액|price|amount|cost|balance|fee/.test(key);
}

/**
 * 단일 값에 대해 컬럼 옵션을 적용하는 내부 함수
 */
function applySingleColumnOption(val: string, option: string, nlpSep: string | null): string {
    if (!val) return val;
    val = val.trim();

    switch (option) {
        case 'date':
            if (nlpSep !== null) {
                const digits = val.replace(/\D/g, '');
                if (digits.length === 8) return `${digits.substring(0, 4)}${nlpSep}${digits.substring(4, 6)}${nlpSep}${digits.substring(6, 8)}`;
                if (/^\d{4}[-./]\d{2}[-./]\d{2}/.test(val)) return val.substring(0, 10).replace(/[-./]/g, nlpSep);
            }
            return normalizeDate(val) || val;
        case 'datetime':
            return normalizeDateTime(val) || val;
        case 'mobile':
            const mDigits = val.replace(/\D/g, '');
            if (mDigits.length >= 10 && mDigits.length <= 11 && mDigits.startsWith('01')) {
                return mDigits.replace(/^(01[016789])(\d{3,4})(\d{4})$/, "$1-$2-$3");
            }
            return val;
        case 'phone':
            const pDigits = val.replace(/\D/g, '');
            if (pDigits.startsWith('0') && pDigits.length >= 9 && pDigits.length <= 11) {
                const areaCode = pDigits.startsWith('02') ? 2 : 3;
                const regex = new RegExp(`^(\\d{${areaCode}})(\\d{3,4})(\\d{4})$`);
                if (regex.test(pDigits)) return pDigits.replace(regex, "$1-$2-$3");
            }
            return val;
        case 'rrn':
            if (/\d{6}[-.]?[1-4]\d{6}/.test(val)) return val.replace(/(\d{6})[-.]?([1-4])\d{6}/, '$1-$2******');
            return val;
        case 'amount':
            const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
            return isNaN(num) ? val : num.toLocaleString('en-US');
        case 'amountKrn':
            const pAmount = parseKoreanAmount(val);
            return pAmount > 0 ? pAmount.toLocaleString('en-US') : val;
        case 'bizNum':
            const bDigits = val.replace(/\D/g, '');
            return bDigits.length === 10 ? bDigits.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3') : val;
        case 'corpNum':
            const cDigits = val.replace(/\D/g, '');
            return cDigits.length === 13 ? cDigits.replace(/(\d{6})(\d{7})/, '$1-$2') : val;
        case 'zip':
            let zDigits = val.replace(/\D/g, '');
            if (zDigits.length > 5 && !val.includes('-')) zDigits = zDigits.substring(0, 5);
            return zDigits.length > 0 && zDigits.length <= 6 ? zDigits.padStart(5, '0') : val;
        case 'url':
            return (!val.startsWith('http') && val.includes('.')) ? 'https://' + val : val;
        case 'area':
            return val.replace(/[^0-9.]/g, '');
        case 'snsId':
            let id = val.split('?')[0];
            if (id.includes('/')) {
                const parts = id.split('/');
                id = parts[parts.length - 1] || parts[parts.length - 2];
            }
            return id.replace('@', '');
        case 'hashtag':
            return val.split(/[,,\s]+/).filter(Boolean).map(t => '#' + t.replace(/#/g, '')).join(' ');
        case 'trackingNum':
            const tDigits = val.replace(/\D/g, '');
            return tDigits.length > 5 ? tDigits : val;
        case 'orderId':
            return val.replace(/[^a-zA-Z0-9]/g, '');
        case 'companyClean':
            return val.replace(/\((?:주|유|합|사|재|특|협|공|사단|재단|법인)\)|(?:주|유|합|사|재)식회사/g, '').trim();
        case 'positionRemove':
            return val.replace(/\s?(?:대리|과장|차장|부장|팀장|본부장|실장|사장|대표|이사|전무|상무|위원|교수|의사|간호사|연구원)$/, '').trim();
        case 'dongExtract':
            const dMatch = val.match(/([가-힣0-9]+[동읍면])/);
            return dMatch ? dMatch[1] : val;
        case 'accountMask':
        case 'cardMask':
            const cVal = val.replace(/[-\s]/g, '');
            if (cVal.length >= 10) return val.substring(0, val.length - 4) + "****";
            return val;
        case 'nameMask':
            if (val.length === 2) return val[0] + '*';
            if (val.length === 3) return val[0] + '*' + val[2];
            if (val.length > 3) return val[0] + '**' + val[val.length - 1];
            return val;
        case 'emailMask':
            if (val.includes('@')) {
                const [id, domain] = val.split('@');
                const maskedId = id.length <= 3 ? id[0] + '***' : id.substring(0, 3) + '****';
                return maskedId + '@' + domain;
            }
            return val;
        case 'addressMask':
            return val.replace(/\d+-\d+/g, '****').replace(/\d+동\s?\d+호/g, '****호').replace(/\d+번길\s?\d+/g, '$1 ****');
        case 'phoneMidMask':
            if (val.includes('-')) {
                const parts = val.split('-');
                if (parts.length === 3) return `${parts[0]}-****-${parts[2]}`;
            }
            return val;
        case 'ageCategory':
            const ageNum = parseInt(val.replace(/\D/g, ''));
            return !isNaN(ageNum) ? `${Math.floor(ageNum / 10) * 10}대` : val;
        case 'dateTruncate':
            const dateDigits = val.replace(/\D/g, '');
            if (dateDigits.length >= 6) return `${dateDigits.substring(0, 4)}${nlpSep || '.'}${dateDigits.substring(4, 6)}`;
            return val;
        case 'exponentialRestore':
            if (val.includes('E+') || val.includes('e+')) {
                const num = Number(val);
                return !isNaN(num) ? num.toLocaleString('fullwide', { useGrouping: false }) : val;
            }
            return val;
        case 'buildingExtract':
            const bMatch = val.match(/([가-힣0-9A-Za-z]+(?:아파트|빌딩|타워|상가|오피스텔|빌라|하우스|팰리스|캐슬|맨션))/);
            return bMatch ? bMatch[1] : val;
        case 'skuNormalize':
            return val.toUpperCase().replace(/[-_\s]/g, '');
        case 'unitUnify':
            return val.replace(/[^0-9.]/g, '');
        case 'currencyStandardize':
            return val.replace(/[$\u00A3\u20AC\u00A5\u20A9,\s]/g, '');
        case 'trim':
            return val.replace(/\s+/g, ' ').trim();
        case 'garbage':
            return GARBAGE_REGEX.test(val) ? '' : val;
        case 'nameClean':
            return val.replace(/[0-9!@#$%^&*()_+={}\[\]|\\;:'",<>?/~`]/g, '').trim();
        case 'emailClean':
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? val : '';
        default:
            return val;
    }
}

// 이전 사후 처리 함수는 더 이상 사용하지 않으므로 호환성을 위해 빈 함수로 유지하거나 제거
export function applyColumnOptions(data: DataRow[], _opts: any) { return data; }
export function restoreLockedColumns(processedData: DataRow[], _orig: any, _locked: any) { return processedData; }
