import { normalizeDate, normalizeDateTime, parseKoreanAmount, GARBAGE_REGEX } from './utils';
import { DataRow, ProcessingOptions, ColumnSpecificOptions } from '@/types';
import { applySingleColumnOption } from './options/column-processor';
import { analyzePrompt, isTargetColumn, checkNLPTargetAmbiguity } from './nlp/nlp-processor';

export { checkNLPTargetAmbiguity };

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
    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    // 1. Analyze NLP Prompt
    // console.log('[Processor] Analyzed Prompt Start');
    let nlp;
    try {
        if (typeof prompt !== 'string') {
            console.warn('[Processor] Prompt is not a string:', prompt);
            prompt = '';
        }
        nlp = analyzePrompt(prompt || '');
    } catch (err: any) {
        console.error('[Processor] NLP Analysis Failed:', err);
        // Fallback to safe empty NLP object (minimal subset to prevent crash)
        nlp = analyzePrompt('');
    }

    // Merge Checkbox Options with NLP flags where NLP naturally extends options
    // (Note: Some logic was strictly 'filterBy' in original code, handled inside 'analyzePrompt')
    const wantsBuildingExtract = options.extractBuilding || nlp.wantsBuildingExtract;

    // --- [통합 정제 루프] ---
    return data.map((row, rowIndex) => {
        const newRow = { ...row };
        for (const key in newRow) {


            // [Rule 1] 잠금 컬럼 절대 보호
            if (lockedColumns.includes(key)) {
                // console.log(`[Processor] Skipping locked column: ${key}`);
                continue;
            }

            const lowerKey = key.toLowerCase();
            const colOption = columnOptions[key];
            let val = String(newRow[key] || "");



            // [Rule 0] 컬럼 전체 일괄 치환 (Column-based Replacement)
            if (nlp.mappings[lowerKey] !== undefined) {
                val = nlp.mappings[lowerKey];
            }

            // 0.5단계: 조건부 로직 적용 (Numeric Condition)
            const numCond = nlp.numericConditions.find(c => lowerKey.includes(c.column) || c.column.includes(lowerKey));
            if (numCond) {
                const cleanNumStr = val.replace(/[^0-9.-]/g, '');
                const currentNum = parseFloat(cleanNumStr);

                if (!isNaN(currentNum) && cleanNumStr !== '') {
                    let match = false;
                    switch (numCond.operator) {
                        case 'ge': match = currentNum >= numCond.value; break;
                        case 'le': match = currentNum <= numCond.value; break;
                        case 'gt': match = currentNum > numCond.value; break;
                        case 'lt': match = currentNum < numCond.value; break;
                        case 'eq': match = currentNum === numCond.value; break;
                    }
                    if (match) {
                        val = numCond.targetValue;
                    }
                }
            }

            // 0.6단계: 결측치 채우기
            const nullFill = nlp.nullFillings.find(c => key.includes(c.column) || c.column.includes(key));
            if (nullFill) {
                const lowerVal = val.toLowerCase().trim();
                if (val === "" || lowerVal === "null" || lowerVal === "undefined" || newRow[key] === null || newRow[key] === undefined) {
                    val = nullFill.fillValue;
                }
            }

            // -----------------------------------------------------------------
            // 1단계: 전역 체크박스 옵션 (Checkbox Options) [Rule 3]
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

            if (options.removeWhitespace || ((nlp.hasAction && (prompt.includes('공백') || prompt.includes('스페이스') || prompt.includes('빈칸'))))) {
                val = val.replace(/\s+/g, ' ').trim();
            }

            const isDateCol = options.autoDetect && /날짜|일시|일자|date|time/.test(lowerKey);
            if (options.formatDate || options.formatDateTime || isDateCol) {
                // NLP 지정 포맷이 없는 경우에만 기본 포맷 적용
                if (nlp.nlpDateSeparator === null && !nlp.nlpUseEmptySeparator) {
                    if (options.formatDateTime) val = normalizeDateTime(val) || val;
                    else val = normalizeDate(val) || val;
                }
            }

            // Amount / Number
            if (options.formatNumber || options.cleanAmount || (options.autoDetect && isAmountColPattern(lowerKey))) {
                if (nlp.wantsCommaRemoval) val = val.replace(/,/g, '');
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

            // Email Cleaning
            const isEmailCol = options.autoDetect && /email|이메일/.test(lowerKey);
            if (options.cleanEmail && isEmailCol) {
                if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) val = '';
            } else if (isEmailCol && val.includes('@')) {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) val = '';
            }

            // Zip, BizNum, CorpNum
            if (options.formatZip || (options.autoDetect && (lowerKey.includes('zip') || lowerKey.includes('우편')))) {
                let digits = val.replace(/\D/g, '');
                if (digits.length > 5 && !val.includes('-')) digits = digits.substring(0, 5);
                if (digits.length > 0 && digits.length <= 6) val = digits.padStart(5, '0');
            }
            if (options.formatBizNum || (options.autoDetect && lowerKey.includes('사업자'))) {
                const digits = val.replace(/\D/g, '');
                if (digits.length === 10) val = digits.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
            }
            if (options.formatCorpNum || (options.autoDetect && lowerKey.includes('법인'))) {
                const digits = val.replace(/\D/g, '');
                if (digits.length === 13) val = digits.replace(/(\d{6})(\d{7})/, '$1-$2');
            }

            // URL
            if (options.formatUrl || (options.autoDetect && lowerKey.includes('url'))) {
                if (val && !val.startsWith('http') && val.includes('.')) val = 'https://' + val;
            }

            // Masking (Auto or Explicit)
            // Note: nlp.wantsUnmask prevents masking only if NLP explicitly said "unmask"
            if (!nlp.wantsUnmask) {
                // RRN (Resident Registration Number)
                const isRRNCol = /주민|rrn|jumin/.test(lowerKey);
                if (options.maskPersonalData || (options.autoDetect && isRRNCol)) {
                    if (/\d{6}[-.]?[1-4]\d{6}/.test(val)) val = val.replace(/(\d{6})[-.]?([1-4])\d{6}/, '$1-$2******');
                }

                // Name Masking
                const isNameCol = /이름|성함|name/.test(lowerKey);
                if ((options.maskName || (options.autoDetect && isNameCol)) || nlp.wantsNameMask) {
                    if (val.length === 2) val = val[0] + '*';
                    else if (val.length === 3) val = val[0] + '*' + val[2];
                    else if (val.length > 3) val = val[0] + '**' + val[val.length - 1];
                }

                // Email Masking
                const isEmailCol = /email|이메일/.test(lowerKey);
                if ((options.maskEmail || (options.autoDetect && isEmailCol)) || nlp.wantsEmailMask) {
                    if (val.includes('@')) {
                        const [id, domain] = val.split('@');
                        if (id.length <= 3) val = id[0] + '***@' + domain;
                        else val = id.substring(0, 3) + '****@' + domain;
                    }
                }
            }

            // Clean Garbage
            if (options.cleanGarbage || (prompt.includes('가비지') || prompt.includes('쓰레기'))) {
                if (GARBAGE_REGEX.test(val)) val = '';
            }

            // Global Checkbox Options: HTML, Emoji, Case
            if (options.removeHtml) {
                // Replace block tags with space to prevent word merging, then strip all tags
                val = val.replace(/<(br|p|div|tr|li|h\d)[^>]*>/gi, ' ').replace(/<[^>]+>/g, '');
            }
            if (options.removeEmoji) {
                // Remove Emoji and Pictographs using unicode property escapes (requires ES2018+)
                // Fallback ranges included in case property escapes are not fully supported in old worker envs
                val = val.replace(/(\p{Extended_Pictographic}|\p{Emoji_Presentation})/gu, '');
            }
            if (options.toUpperCase) val = val.toUpperCase();
            if (options.toLowerCase) val = val.toLowerCase();

            // [FIX] Missing Global Handlers Implementation
            // - cleanName
            if (options.cleanName) {
                const isNameCol = /이름|성함|성명|name|담당|customer|user|writer|author/.test(lowerKey);
                // If autoDetect is ON, or if the user explicitly asked for cleanName and it looks like a name column
                if (options.autoDetect || isNameCol) {
                    val = val.replace(/[0-9!@#$%^&*()_+={}\[\]|\\;:'",<>?/~`]/g, '').trim();
                }
            }

            // - formatTrackingNum
            if (options.formatTrackingNum) {
                const isTrackingCol = /운송장|송장|등기|tracking|waybill|delivery|inv/.test(lowerKey);
                if (options.autoDetect || isTrackingCol) {
                    if (val.includes('E+') || val.includes('e+')) {
                        const num = Number(val);
                        if (!isNaN(num)) val = num.toLocaleString('fullwide', { useGrouping: false });
                    }
                    val = val.replace(/\D/g, '');
                }
            }

            // - cleanOrderId
            if (options.cleanOrderId) {
                const isOrderCol = /주문|order|id|no/.test(lowerKey);
                if (options.autoDetect || isOrderCol) {
                    val = val.replace(/[^a-zA-Z0-9]/g, '');
                }
            }

            // - formatTaxDate (YYYYMMDD)
            if (options.formatTaxDate) {
                const isDateCol = /날짜|일시|date|세무|tax/.test(lowerKey);
                if (options.autoDetect || isDateCol) {
                    const digits = val.replace(/\D/g, '');
                    if (digits.length === 8) val = digits;
                    else if (digits.length > 8) val = digits.substring(0, 8);
                }
            }

            // - formatAccountingNum (△100 -> -100)
            if (options.formatAccountingNum) {
                if (options.autoDetect || /금액|잔액|amount|balance/.test(lowerKey)) {
                    if (val.includes('△')) val = val.replace('△', '-');
                    if (val.startsWith('(') && val.endsWith(')')) val = '-' + val.slice(1, -1);
                }
            }

            // - cleanAreaUnit / cleanSnsId / formatHashtag
            if (options.cleanAreaUnit) {
                if (options.autoDetect || /면적|평|area|size/.test(lowerKey)) val = val.replace(/[^0-9.]/g, '');
            }
            if (options.cleanSnsId) {
                if (options.autoDetect || /sns|instagram|insta|facebook|twitter|youtube/.test(lowerKey)) {
                    let id = val.split('?')[0];
                    if (id.includes('/')) {
                        const parts = id.split('/');
                        id = parts[parts.length - 1] || parts[parts.length - 2];
                    }
                    val = id.replace('@', '');
                }
            }
            if (options.formatHashtag) {
                if (options.autoDetect || /태그|해시|tag|key/.test(lowerKey)) {
                    val = val.split(/[,,\s]+/).filter(Boolean).map(t => '#' + t.replace(/#/g, '')).join(' ');
                }
            }



            // -----------------------------------------------------------------
            // 2단계: 자연어 처리 (NLP Smart) [Rule 4]
            // -----------------------------------------------------------------
            if (nlp.wantsNoSpecial) val = val.replace(/[^\w\s가-힣]/g, '');

            if (nlp.wantsNoBrackets && isTargetColumn(key, nlp.targetNoBrackets, nlp.allPotentialTargets)) {
                val = val.replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, '').trim();
            }

            if (nlp.wantsOnlyDigits) val = val.replace(/\D/g, '');
            else if (nlp.wantsOnlyKorean) val = val.replace(/[^가-힣\s]/g, '');
            else if (nlp.wantsOnlyEnglish) val = val.replace(/[^a-zA-Z\s]/g, '');

            if (nlp.wantsNoHtml && isTargetColumn(key, nlp.targetNoHtml, nlp.allPotentialTargets)) {
                val = val.replace(/<[^>]*>?/gm, '');
            }
            if (nlp.wantsNoEmoji && isTargetColumn(key, nlp.targetNoEmoji, nlp.allPotentialTargets)) {
                val = val.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
            }

            // Padding
            if (nlp.wantsPaddingLen > 0 && /^\d+$/.test(val)) {
                const isTarget = !nlp.wantsPaddingTarget || lowerKey.includes(nlp.wantsPaddingTarget) || nlp.wantsPaddingTarget.includes(lowerKey);
                if (isTarget) {
                    val = val.padStart(nlp.wantsPaddingLen, '0');
                }
            }

            // Prefix/Suffix
            if (nlp.wantsPrefixMatch) {
                const pValue = nlp.wantsPrefixMatch[2];
                if (!nlp.prefixTarget || lowerKey.includes(nlp.prefixTarget) || nlp.prefixTarget.includes(lowerKey)) {
                    val = pValue + val;
                }
            }
            if (nlp.wantsSuffixMatch) {
                const sValue = nlp.wantsSuffixMatch[2];
                if (!nlp.suffixTarget || lowerKey.includes(nlp.suffixTarget) || nlp.suffixTarget.includes(lowerKey)) {
                    val = val + sValue;
                }
            }

            // Upper/Lower (NLP Targeted)
            if (nlp.wantsLower) {
                if (!nlp.lowerTarget || lowerKey.includes(nlp.lowerTarget) || nlp.lowerTarget.includes(lowerKey)) {
                    val = val.toLowerCase();
                }
            }
            if (nlp.wantsUpper) {
                if (!nlp.upperTarget || lowerKey.includes(nlp.upperTarget) || nlp.upperTarget.includes(lowerKey)) {
                    val = val.toUpperCase();
                }
            }

            // Address Extractions
            if (/주소|지역|address/.test(lowerKey)) {
                if (nlp.wantsSido) {
                    const match = val.match(/^([가-힣]+[시도])/);
                    val = match ? match[1] : val.split(' ')[0];
                } else if (nlp.wantsGungu) {
                    const parts = val.split(' ');
                    if (parts.length >= 2) val = parts[1];
                } else if (options.extractDong || nlp.wantsDongExtraction) {
                    const match = val.match(/([가-힣0-9]+[동읍면])/);
                    val = match ? match[1] : val;
                } else if (wantsBuildingExtract) {
                    const bMatch = val.match(/([가-힣0-9A-Za-z]+(?:아파트|빌딩|타워|상가|오피스텔|빌라|하우스|팰리스|캐슬|맨션))/);
                    if (bMatch) val = bMatch[1];
                }
            }

            // Domain extraction
            if (/email|이메일/.test(lowerKey) || val.includes('@')) {
                if (nlp.wantsDomain) {
                    val = val.split('@')[1] || val;
                }
            }

            // Company Name Cleaning
            const isCompanyCol = lowerKey.includes('업체') || lowerKey.includes('회사') || lowerKey.includes('상호') || lowerKey.includes('name');
            const isTargetCompany = isCompanyCol || isTargetColumn(key, nlp.targetCompanyClean, nlp.allPotentialTargets);
            if ((options.cleanCompanyName || nlp.wantsCompanyClean) && isTargetCompany) {
                val = val.replace(/\((?:주|유|합|사|재|특|협|공|사단|재단|법인)\)|(?:주|유|합|사|재)식회사/g, '').trim();
            }

            // Position Removal
            const isPositionCol = lowerKey.includes('이름') || lowerKey.includes('성함') || lowerKey.includes('담당') || lowerKey.includes('name');
            const isTargetPosition = isPositionCol || isTargetColumn(key, nlp.targetPositionRemoval, nlp.allPotentialTargets);
            if ((options.removePosition || nlp.wantsPositionRemoval) && isTargetPosition) {
                val = val.replace(/\s?(?:대표이사|전무이사|상무이사|부사장|대리|과장|차장|부장|팀장|본부장|실장|사장|대표|이사|전무|상무|위원|교수|의사|간호사|연구원|매니저|책임|선임|수석|주임|사원)$/, '').trim();
            }

            // Account/Card Masking
            if (options.maskAccount || options.maskCard || nlp.wantsMasking) {
                const isAccountCol = lowerKey.includes('계좌') || lowerKey.includes('account');
                const isCardCol = lowerKey.includes('카드') || lowerKey.includes('card');
                const isAccount = options.maskAccount || (isAccountCol && (options.autoDetect || nlp.wantsMasking));
                const isCard = options.maskCard || (isCardCol && (options.autoDetect || nlp.wantsMasking));

                if (isAccount || isCard || /^[0-9-]{12,}$/.test(val.replace(/\s/g, ''))) {
                    const cleanVal = val.replace(/[-\s]/g, '');
                    if (cleanVal.length >= 10) {
                        if (prompt.includes('중간')) {
                            val = val.length > 8 ? val.substring(0, 4) + "****" + val.substring(8) : val;
                        } else {
                            val = val.substring(0, val.length - 4) + "****";
                        }
                    }
                }
            }

            // Specific NLP Options
            if (options.maskName || nlp.wantsNameMask) {
                if (/이름|성함|name/.test(lowerKey) || (val.length >= 2 && val.length <= 4 && /^[가-힣]+$/.test(val))) {
                    if (val.length === 2) val = val[0] + '*';
                    else if (val.length === 3) val = val[0] + '*' + val[2];
                    else if (val.length > 3) val = val[0] + '**' + val[val.length - 1];
                }
            }
            if (options.maskEmail || nlp.wantsEmailMask) {
                if (val.includes('@')) {
                    const [id, domain] = val.split('@');
                    if (id.length <= 3) val = id[0] + '***@' + domain;
                    else val = id.substring(0, 3) + '****@' + domain;
                }
            }
            if (options.maskAddress || nlp.wantsAddressMask) {
                if (/주소|address/.test(lowerKey)) {
                    val = val.replace(/\d+-\d+/g, '****').replace(/\d+동\s?\d+호/g, '****호').replace(/\d+번길\s?\d+/g, '$1 ****');
                }
            }
            if (options.maskPhoneMid) {
                if (val.includes('-')) {
                    const parts = val.split('-');
                    if (parts.length === 3) val = `${parts[0]}-****-${parts[2]}`;
                }
            }
            if (options.categoryAge || nlp.wantsAgeCategory) {
                if (/나이|연령|age/.test(lowerKey) || (/^\d{1,2}$/.test(val))) {
                    const ageNum = parseInt(val.replace(/\D/g, ''));
                    if (!isNaN(ageNum)) val = `${Math.floor(ageNum / 10) * 10}대`;
                }
            }
            if (options.truncateDate || nlp.wantsDateTruncate) {
                const dateDigits = val.replace(/\D/g, '');
                if (dateDigits.length >= 6) {
                    const sep = nlp.nlpDateSeparator || '.';
                    val = `${dateDigits.substring(0, 4)}${sep}${dateDigits.substring(4, 6)}`;
                }
            }
            if (options.restoreExponential || nlp.wantsExponentialRestore) {
                if (val.includes('E+') || val.includes('e+')) {
                    const num = Number(val);
                    if (!isNaN(num)) val = num.toLocaleString('fullwide', { useGrouping: false });
                }
            }
            if (options.normalizeSKU || nlp.wantsSkuNormalize) {
                if (/sku|모델|코드|model/.test(lowerKey)) {
                    val = val.toUpperCase().replace(/[-_\s]/g, '');
                }
            }
            if (options.unifyUnit || nlp.wantsUnitUnify) {
                if (/^[0-9.]+\s*(?:kg|g|t|m|cm|mm|평|m2|호|인분|개|p|set|세트)$/i.test(val)) {
                    val = val.replace(/[^0-9.]/g, '');
                }
            }
            if (options.standardizeCurrency || nlp.wantsCurrencyStandardize) {
                if (/[$\u00A3\u20AC\u00A5\u20A9]/.test(val)) {
                    val = val.replace(/[$\u00A3\u20AC\u00A5\u20A9,\s]/g, '');
                }
            }

            // Pattern Mappings (NLP) - Text Replacement
            const lowerVal = val.toString().toLowerCase();
            if (nlp.mappings[lowerVal] !== undefined) {
                val = nlp.mappings[lowerVal];
            }
            for (const pm of nlp.patternMappings) {
                val = val.toString().replace(pm.regex, pm.replacement);
            }

            // Date Format Overrides based on NLP
            const looksLikeDate = /날짜|일시|일자|date|time/.test(lowerKey);
            if ((nlp.nlpDateSeparator !== null || nlp.nlpUseEmptySeparator) && looksLikeDate) {
                const sep = nlp.nlpUseEmptySeparator ? "" : nlp.nlpDateSeparator!;
                let formatted = false;
                let standardDate = normalizeDate(val);
                if (!standardDate && /^\d{2}[-./]\d{2}[-./]\d{2}/.test(val)) {
                    standardDate = normalizeDate("20" + val);
                }

                if (standardDate) {
                    val = standardDate.replace(/-/g, sep);
                    formatted = true;
                } else {
                    const digits = val.replace(/\D/g, '');
                    if (digits.length === 8) {
                        val = `${digits.substring(0, 4)}${sep}${digits.substring(4, 6)}${sep}${digits.substring(6, 8)}`;
                        formatted = true;
                    }
                }

                if (nlp.wantsEmptyOnError && !formatted && looksLikeDate) {
                    val = "";
                }
            }

            // -----------------------------------------------------------------
            // 3단계: 개별 컬럼 지정 옵션 (Column Option) [Rule 2]
            // -----------------------------------------------------------------
            if (colOption) {
                const sep = (nlp.nlpDateSeparator !== null || nlp.nlpUseEmptySeparator) ? (nlp.nlpUseEmptySeparator ? "" : nlp.nlpDateSeparator!) : null;
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
export function isAmountColPattern(key: string): boolean {
    return /금액|가격|비용|매출|입금|출금|잔액|price|amount|cost|balance|fee/.test(key);
}

// Deprecated or Dummy exports for compatibility
export function applyColumnOptions(data: DataRow[], _opts: any) { return data; }
export function restoreLockedColumns(processedData: DataRow[], _orig: any, _locked: any) { return processedData; }
