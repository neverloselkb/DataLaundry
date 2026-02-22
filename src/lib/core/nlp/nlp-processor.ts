import { ProcessingOptions, ColumnSpecificOptions } from '@/types';

// ==========================================
// Types & Interfaces
// ==========================================

export interface NumericCondition {
    column: string;
    value: number;
    operator: 'ge' | 'le' | 'gt' | 'lt' | 'eq';
    targetValue: string;
}

export interface NullFilling {
    column: string;
    fillValue: string;
}

export interface NlpAnalysisResult {
    // Actions - Removal
    wantsHyphenRemoval: boolean;
    wantsCommaRemoval: boolean;
    wantsUnmask: boolean;
    wantsNoSpecial: boolean;
    wantsNoBrackets: boolean;
    targetNoBrackets: string | null;
    wantsNoHtml: boolean;
    targetNoHtml: string | null;
    wantsNoEmoji: boolean;
    targetNoEmoji: string | null;

    // Actions - Extraction
    wantsSido: boolean;
    wantsGungu: boolean;
    wantsDongExtraction: boolean;
    wantsDomain: boolean;
    wantsBuildingExtract: boolean;

    // Actions - Transformations (Case, Padding, Prefix/Suffix)
    wantsLower: boolean;
    lowerTarget: string | null;
    wantsUpper: boolean;
    upperTarget: string | null;
    wantsPaddingLen: number;
    wantsPaddingTarget: string | null;
    wantsPrefixMatch: RegExpMatchArray | null;
    prefixTarget: string | null;
    wantsSuffixMatch: RegExpMatchArray | null;
    suffixTarget: string | null;

    // Actions - Filtering
    wantsOnlyDigits: boolean;
    wantsOnlyKorean: boolean;
    wantsOnlyEnglish: boolean;

    // Actions - Business Logic
    wantsCompanyClean: boolean;
    targetCompanyClean: string | null;
    wantsPositionRemoval: boolean;
    targetPositionRemoval: string | null;
    wantsMasking: boolean;
    wantsNameMask: boolean;
    wantsEmailMask: boolean;
    wantsAddressMask: boolean;
    wantsAgeCategory: boolean;
    wantsDateTruncate: boolean;
    wantsExponentialRestore: boolean;
    wantsSkuNormalize: boolean;
    wantsUnitUnify: boolean;
    wantsCurrencyStandardize: boolean;

    // Date Format Overrides
    nlpDateSeparator: string | null;
    nlpUseEmptySeparator: boolean;
    wantsEmptyOnError: boolean;

    // Conditional Logic
    numericConditions: NumericCondition[];
    nullFillings: NullFilling[];

    // Mappings and Patterns
    mappings: Record<string, string>;
    patternMappings: { regex: RegExp; replacement: string }[];

    // Context Helpers
    allPotentialTargets: string[];
    hasAction: boolean;
}

// ==========================================
// Helper Functions
// ==========================================

function extractConjunctiveTarget(lowerPrompt: string, keywords: string[]): string | null {
    const keywordPattern = keywords.join('|');
    const intervener = `(?:(?:[^\\s]+)(?:이랑|하고|와|과|,|\\s+)+\\s*)?`;
    const finalRegex = new RegExp(`([가-힣a-zA-Z0-9_\\(\\)]+)(?:에서|의|쪽|부분)?(?:에)?\\s*(?:있는|들어있는)?\\s*${intervener}(?:${keywordPattern})`, 'i');

    const m = lowerPrompt.match(finalRegex);
    return m ? m[1] : null;
}

export function isTargetColumn(key: string, specificTarget: string | null, allPotentialTargets: string[]): boolean {
    const lowerKey = key.toLowerCase();
    if (specificTarget && (lowerKey.includes(specificTarget) || specificTarget.includes(lowerKey))) return true;
    if (allPotentialTargets.some(t => lowerKey.includes(t))) return true;
    if (!specificTarget && allPotentialTargets.length === 0) return true;
    return false;
}

export function checkNLPTargetAmbiguity(prompt: string, headers: string[] = []): { isAmbiguous: boolean; hasAction: boolean } {
    if (!prompt.trim()) return { isAmbiguous: false, hasAction: false };

    const lowerPrompt = prompt.toLowerCase();

    const actionKeywords = [
        '제거', '삭제', '빼', '지워', '없애', '지우', '정리',
        '변경', '변환', '교체', '바꿔', '수정', '치환',
        '대문자', '소문자', 'uppercase', 'lowercase',
        '패딩', '채워', 'prefix', 'suffix', '붙여', '앞에', '뒤에'
    ];
    const hasAction = actionKeywords.some(k => lowerPrompt.includes(k));
    if (!hasAction) return { isAmbiguous: false, hasAction: false };

    // 타겟 지칭 조사 확인
    const targetMatches = Array.from(lowerPrompt.matchAll(/([가-힣a-zA-Z0-9_\(\)%_]+)(?:\s*(?:은|는|이|가|을|를|의|에서|컬럼|필드))/g));
    const noiseWords = /^(패턴|문구|단어|텍스트|값|데이터|내용|항목|정보|필드|컬럼)$/;

    let hasValidTarget = targetMatches.some(m => {
        const target = m[1].toLowerCase();
        if (noiseWords.test(target)) return false;
        return headers.some(h => h.toLowerCase().includes(target) || target.includes(h.toLowerCase()));
    });

    if (!hasValidTarget && headers.length > 0) {
        const tokens = lowerPrompt.split(/\s+/);
        hasValidTarget = tokens.some(token => {
            const cleanToken = token.replace(/(은|는|이|가|을|를|의|에서)$/, '').trim();
            if (!cleanToken || noiseWords.test(cleanToken)) return false;
            return headers.some(h => {
                const lowerH = h.toLowerCase();
                return lowerH === cleanToken || (cleanToken.length >= 2 && lowerH.includes(cleanToken));
            });
        });
    }

    const hasGlobalQuantifier = /(전부|싹|모두|다|전체|all|싹다|모든|모든\s*컬럼|전체\s*데이터)/.test(lowerPrompt);
    const isAmbiguous = !hasValidTarget && !hasGlobalQuantifier;

    return { isAmbiguous, hasAction };
}

// ==========================================
// Main NLP Analysis Function
// ==========================================

export function analyzePrompt(prompt: string): NlpAnalysisResult {
    const lowerPrompt = prompt.toLowerCase();
    const filterBy = (keywords: string[]) => keywords.some(k => lowerPrompt.includes(k));
    const hasAction = filterBy(['지워', '제거', '삭제', '없애', '정리', '닦아', '통일', '표준', '바꿔', '변경', '추출', '분리', '남겨', '따로', '빼', '치환', '수정', '교체', '변환']);

    // --- Action Parsing ---
    const wantsHyphenRemoval = filterBy(['하이픈', '대시', '-']) && filterBy(['제거', '삭제', '빼', '지워', '없애']);
    const wantsCommaRemoval = filterBy(['콤마', '쉼표', ',']) && filterBy(['제거', '삭제', '빼', '지워', '없애']);
    const wantsUnmask = filterBy(['마스킹', '가림', '별표']) && filterBy(['제거', '삭제', '해제', '풀어', '보이게', '표시']);
    const wantsSido = filterBy(['시/도', '시도', '광역']) && filterBy(['추출', '분리', '남겨', '따로', '앞에']);
    const wantsGungu = filterBy(['구/군', '구군', '시/군/구']) && filterBy(['추출', '분리', '남겨', '따로']);
    const wantsOnlyDigits = filterBy(['숫자만', '숫자 추출', '숫자남겨']);
    const wantsOnlyKorean = filterBy(['한글만', '한글 추출', '한글남겨']);
    const wantsOnlyEnglish = filterBy(['영어만', '영문만', 'english only']);
    const wantsNoSpecial = filterBy(['특수문자', '기호']) && filterBy(['제거', '삭제', '빼', '지워', '정리', '정규화']);

    // Brackets
    const wantsNoBrackets = filterBy(['괄호', 'bracket']) && filterBy(['제거', '삭제', '내용삭제', '지워', '빼', '없애', '지우', '정리', '정규화']);
    const targetNoBrackets = wantsNoBrackets ? extractConjunctiveTarget(lowerPrompt, ['괄호', 'bracket']) : null;

    // Company Name
    const wantsCompanyClean = filterBy(['업체명', '회사명', '상호', '주식회사', '(주)']) && filterBy(['정리', '정규화', '제거', '삭제', '빼', '지워', '없애', '지우']);
    const targetCompanyClean = wantsCompanyClean ? extractConjunctiveTarget(lowerPrompt, ['업체명', '회사명', '상호', '주식회사', '\\(주\\)']) : null;

    // Position
    const wantsPositionRemoval = filterBy(['직함', '직위', '직책', '네임']) && filterBy(['제거', '삭제', '빼', '지워', '없애', '지우', '정리', '정규화']);
    const targetPositionRemoval = wantsPositionRemoval ? extractConjunctiveTarget(lowerPrompt, ['직함', '직위', '직책', '네임']) : null;

    // Address & Dong
    const wantsDongExtraction = filterBy(['동/읍/면', '동읍면', '상세주소']) && filterBy(['추출', '분리', '남겨', '따로']);
    const wantsBuildingExtract = filterBy(['건물명', '아파트명', '빌딩명']);
    // Wait, analyzePrompt shouldn't depend on 'options' argument directly unless passed. 
    // For now, let's stick to parsing the PROMPT only. Caller will merge logic.
    // Correction: analyzePrompt should return flags solely based on PROMPT. The caller merges with Checkbox Options.

    const wantsMasking = filterBy(['마스킹', '가림', '별표', '숨김']) && (filterBy(['계좌', '카드', '번호']) || filterBy(['뒷자리', '중간']));

    // Case & Format
    const wantsLower = filterBy(['소문자', 'lowercase', '소문자변경']);
    const wantsUpper = filterBy(['대문자', 'uppercase', '대문자변경']);

    const wantsNoHtml = filterBy(['html', '태그', 'tag']) && filterBy(['제거', '삭제', '빼', '지워', '없애', '지우', '정리', '정규화']);
    const targetNoHtml = wantsNoHtml ? extractConjunctiveTarget(lowerPrompt, ['html', '태그', 'tag']) : null;

    const wantsNoEmoji = filterBy(['이모지', '이모티콘', 'emoji']) && filterBy(['제거', '삭제', '빼', '지워', '없애', '지우', '정리', '정규화']);
    const targetNoEmoji = wantsNoEmoji ? extractConjunctiveTarget(lowerPrompt, ['이모지', '이모티콘', 'emoji']) : null;

    const wantsDomain = filterBy(['도메인', 'domain']) && filterBy(['추출', '분리', '남겨']);

    // Regex Matches for Prefix/Suffix/Padding
    const wantsPrefixMatch = prompt.match(/(?:([가-힣a-zA-Z0-9_\(\)]+)(?:은|는|이|가|을|를|의|에서|컬럼|필드)?\s*)?(?:앞에|앞에다가|prefix)\s*['"]?([^'"]+)['"]?\s*(?:붙여|붙이|추가|넣어|넣으|끼워|끼우|삽입)/i);
    const wantsSuffixMatch = prompt.match(/(?:([가-힣a-zA-Z0-9_\(\)]+)(?:은|는|이|가|을|를|의|에서|컬럼|필드)?\s*)?(?:뒤에|뒤에다가|suffix)\s*['"]?([^'"]+)['"]?\s*(?:붙여|붙이|추가|넣어|넣으|끼워|끼우|삽입|붙이고|넣고)/i);

    const wantsPaddingMatch = lowerPrompt.match(/(?:([가-힣a-zA-Z0-9_\(\)]+)(?:은|는|이|가|을|를|의|에서|컬럼|필드)?\s*)?(\d+)\s*(?:자리|글자)(?:\s*로)?(?:\s*(?:0|영|공|제로|공백))?(?:\s*(?:으로))?\s*(?:맞춰|맞추|패딩|padding|채워|채우|만들어|만들|늘려|늘리)/);
    const wantsPaddingLen = wantsPaddingMatch && wantsPaddingMatch[2] ? parseInt(wantsPaddingMatch[2]) : 0;
    const wantsPaddingTarget = wantsPaddingMatch && wantsPaddingMatch[1] ? wantsPaddingMatch[1] : null;

    // --- Target Extraction ---
    const allPotentialTargets = Array.from(
        lowerPrompt.matchAll(/([가-힣a-zA-Z0-9_\(\)]+)(?:\s*(?:은|는|이|가|을|를|의|에서|컬럼|필드|앞에|뒤에|쪽|부분|랑|와|과|하고|및|and|or|,))/g)
    ).map(m => m[1]);
    const quantifiers = /^(전부|싹|모두|다|전체|all|싹다|값|데이터|내용|모든)$/;
    const primaryTarget = allPotentialTargets.find(t => !quantifiers.test(t)) || null;

    // Upper/Lower Target Resolution
    let upperTarget = null;
    if (wantsUpper) {
        const m = lowerPrompt.match(/(?:([가-힣a-zA-Z0-9_\(\)]+)(?:은|는|이|가|을|를|의|에서|컬럼|필드|앞에|뒤에)?\s*)?(?:대문자|uppercase)/);
        upperTarget = m && m[1] ? m[1] : null;
        if (upperTarget && quantifiers.test(upperTarget)) upperTarget = primaryTarget || null;
        else if (!upperTarget) upperTarget = primaryTarget;
    }

    let lowerTarget = null;
    if (wantsLower) {
        const m = lowerPrompt.match(/(?:([가-힣a-zA-Z0-9_\(\)]+)(?:은|는|이|가|을|를|의|에서|컬럼|필드|앞에|뒤에)?\s*)?(?:소문자|lowercase)/);
        lowerTarget = m && m[1] ? m[1] : null;
        if (lowerTarget && quantifiers.test(lowerTarget)) lowerTarget = primaryTarget || null;
        else if (!lowerTarget) lowerTarget = primaryTarget;
    }

    // Prefix/Suffix Target Resolution
    const invalidTargets = /^(채우고|하고|한뒤|해서|넣고|바꾸고|지우고|없애고|변경하고|삭제하고|된다면|있으면|없으면|아니면|그리고|그런다음|이어서)$/;

    let prefixTarget = wantsPrefixMatch && wantsPrefixMatch[1] ? wantsPrefixMatch[1] : null;
    if (prefixTarget && (quantifiers.test(prefixTarget) || invalidTargets.test(prefixTarget))) {
        prefixTarget = primaryTarget || null;
    } else if (!prefixTarget && wantsPrefixMatch) {
        prefixTarget = primaryTarget;
    }

    let suffixTarget = wantsSuffixMatch && wantsSuffixMatch[1] ? wantsSuffixMatch[1] : null;
    if (suffixTarget && (quantifiers.test(suffixTarget) || invalidTargets.test(suffixTarget))) {
        suffixTarget = primaryTarget || null;
    } else if (!suffixTarget && wantsSuffixMatch) {
        suffixTarget = primaryTarget;
    }

    // --- Mappings & Patterns ---
    const mappings: Record<string, string> = {};
    const patternMappings: { regex: RegExp; replacement: string }[] = [];

    // Pattern Removal Logic
    if (filterBy(['제거', '삭제', '빼', '지워', '없애', '지우', '안보이게'])) {
        const qMatches = Array.from(lowerPrompt.matchAll(/['"\[\]]([^'"\[\]]+)['"\[\]]\s*(?:패턴|문구|단어|텍스트|값)?(?:은|는|이|가|을|를)?\s*(?:제거|삭제|지워|없애)/g));
        qMatches.forEach(m => {
            let p = m[1];
            if (p.includes('%d')) p = p.replace(/%d/g, '\\d+');
            try { patternMappings.push({ regex: new RegExp(p, 'g'), replacement: '' }); } catch (e) { }
        });

        const uMatches = Array.from(lowerPrompt.matchAll(/([^\s가-힣0-9]{1,3}[^\s가-힣]*)\s*(?:패턴|문구|단어|텍스트|값)?(?:은|는|이|가|을|를)?\s*(?:제거|삭제|지워|없애)/g));
        uMatches.forEach(m => {
            let p = m[1];
            if (p.includes('%d')) p = p.replace(/%d/g, '\\d+');
            if (p.length > 0 && !/^(을|를|이|가|은|는)$/.test(p)) {
                try { patternMappings.push({ regex: new RegExp(p, 'g'), replacement: '' }); } catch (e) { }
            }
        });
    }

    // Transformation Mappings
    if (filterBy(['변경', '변환', '교체', '바꿔', '수정', '치환', '통일', '->', ':', '=>'])) {
        const mappingRegex = /([\[\]%A-Za-z0-9가-힣_\-@./()+]+)(?:\s*(?:컬럼|필드|데이터|값|문구|텍스트|형식|패턴|의))*\s*(?:는|은|->|:|를|을|=>)\s*([\[\]%A-Za-z0-9가-힣_\-\s/.@()+!?'""]+)/gi;
        const matches = Array.from(prompt.matchAll(mappingRegex));
        matches.forEach(m => {
            let from = m[1].trim().toLowerCase();
            let to = m[2].trim();

            to = to.replace(/무조건|전부|싹다|모두|절대/g, '').trim();
            const suffixRegex = /(?:으로|로|라고|하게|으로\s+변경|로\s+변경|로\s+수정|변경\s*해\s*줘|변경해줘|해\s*줘|해줘|형식으로|형식|포맷으로|포맷|으로\s*바꿔|바꿔줘|바꿔|하고|해주고|니다|입니다|요)$/;
            let prevTo = "";
            while (to !== prevTo) {
                prevTo = to;
                to = to.replace(suffixRegex, '').trim();
            }
            to = to.replace(/^['"]|['"]$/g, '').replace(/[,;.]$/, '').trim();

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

    // --- Date Format NLP ---
    let nlpDateSeparator: string | null = null;
    let nlpUseEmptySeparator = false;
    if (filterBy(['날짜', 'date', '일시'])) {
        if (filterBy(['yyyy/mm/dd', '/'])) nlpDateSeparator = '/';
        else if (filterBy(['yyyy.mm.dd', '.', '점'])) nlpDateSeparator = '.';
        else if (filterBy(['yyyy-mm-dd', '하이픈', '-', '대시'])) nlpDateSeparator = '-';
        else if (filterBy(['yyyymmdd', '붙여서'])) nlpUseEmptySeparator = true;
    }
    const wantsEmptyOnError = filterBy(['오류', '에러', '잘못', 'fail', 'error']) && filterBy(['빈칸', '공백', '삭제', '지워', 'empty', 'blank']);

    // --- Conditionals (Numeric & Null) ---
    const numericConditions: NumericCondition[] = [];
    const nullFillings: NullFilling[] = [];

    const triggerNumericOps = filterBy(['이상', '이하', '초과', '미만', '크면', '작으면', '같으면']);
    const triggerActions = filterBy(['바꿔', '변경', '치환', '수정']);
    const hasTrigger = triggerNumericOps || triggerActions || filterBy(['비어', '없으', '공백', '빈값', 'null']);

    if (hasTrigger) {
        const tokens = lowerPrompt.split(/\s+/);
        const nullKeywords = ['비어', '없으', '공백', '빈값', 'null'];
        const actionPattern = /바꿔|바꾸|변경|치환|수정|설정|채워|넣어/;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // Numeric Conditions
            if (/^[\d,]+$/.test(token)) {
                const valNum = parseFloat(token.replace(/,/g, ''));
                if (!isNaN(valNum)) {
                    let operator: any = null;
                    for (let j = 1; j <= 2 && i + j < tokens.length; j++) {
                        const next = tokens[i + j];
                        if (next.includes('이상') || next.includes('크거나')) operator = 'ge';
                        else if (next.includes('이하') || next.includes('작거나')) operator = 'le';
                        else if (next.includes('초과') || next.includes('크면')) operator = 'gt';
                        else if (next.includes('미만') || next.includes('작으면')) operator = 'lt';
                        else if (next.includes('같으면') || next.includes('동일')) operator = 'eq';
                        if (operator) break;
                    }

                    if (operator) {
                        let col = "";
                        if (i > 0) {
                            let prev = tokens[i - 1];
                            prev = prev.replace(/(이|가|은|는)$/, '');
                            col = prev.trim();
                        }

                        let target = "";
                        let actionIdx = -1;
                        for (let k = i + 1; k < tokens.length; k++) {
                            if (actionPattern.test(tokens[k])) {
                                actionIdx = k;
                                break;
                            }
                        }

                        if (actionIdx !== -1 && actionIdx > i) {
                            let targetIdx = actionIdx - 1;
                            if (targetIdx > i && /^(으로|로)$/.test(tokens[targetIdx])) targetIdx--;
                            let possible = tokens[targetIdx];
                            const quoteMatch = possible.match(/['"]([^'"]+)['"]/);
                            if (quoteMatch) { target = quoteMatch[1]; }
                            else { target = possible.replace(/(으)?로$/, ''); }
                        }

                        if (col && target && valNum !== undefined) {
                            numericConditions.push({ column: col, value: valNum, operator: operator, targetValue: target });
                        }
                    }
                }
            }

            // Null Filling
            let isNullTrigger = false;
            for (const nk of nullKeywords) { if (token.includes(nk)) { isNullTrigger = true; break; } }

            if (isNullTrigger) {
                let col = "";
                if (i > 0) {
                    let prev = tokens[i - 1];
                    prev = prev.replace(/(이|가|은|는)$/, '');
                    col = prev.trim();
                }

                let fillVal = "";
                let actionIdx = -1;
                for (let k = i + 1; k < tokens.length; k++) {
                    if (actionPattern.test(tokens[k])) {
                        actionIdx = k;
                        break;
                    }
                }

                if (actionIdx !== -1 && actionIdx > i) {
                    let targetIdx = actionIdx - 1;
                    if (targetIdx > i && /^(으로|로)$/.test(tokens[targetIdx])) targetIdx--;
                    let possible = tokens[targetIdx];
                    const quoteMatch = possible.match(/['"]([^'"]+)['"]/);
                    if (quoteMatch) { fillVal = quoteMatch[1]; }
                    else { fillVal = possible.replace(/(으)?로$/, ''); }
                }

                if (col && fillVal) {
                    nullFillings.push({ column: col, fillValue: fillVal });
                }
            }
        }
    }

    return {
        wantsHyphenRemoval, wantsCommaRemoval, wantsUnmask, wantsNoSpecial,
        wantsNoBrackets, targetNoBrackets, wantsNoHtml, targetNoHtml,
        wantsNoEmoji, targetNoEmoji, wantsSido, wantsGungu,
        wantsDongExtraction, wantsDomain, wantsBuildingExtract: filterBy(['건물명', '아파트명', '빌딩명']),
        wantsLower, lowerTarget, wantsUpper, upperTarget,
        wantsPaddingLen, wantsPaddingTarget,
        wantsPrefixMatch, prefixTarget, wantsSuffixMatch, suffixTarget,
        wantsOnlyDigits, wantsOnlyKorean, wantsOnlyEnglish,
        wantsCompanyClean, targetCompanyClean, wantsPositionRemoval, targetPositionRemoval,
        wantsMasking,
        wantsNameMask: filterBy(['성함', '이름']) && filterBy(['마스킹', '별표']),
        wantsEmailMask: filterBy(['이메일', 'email']) && filterBy(['마스킹', '별표']),
        wantsAddressMask: filterBy(['주소']) && filterBy(['상세', '뒷부분']) && filterBy(['마스킹', '가림']),
        wantsAgeCategory: filterBy(['나이', 'age']) && filterBy(['범주', '연령대']),
        wantsDateTruncate: filterBy(['날짜', 'date']) && filterBy(['절삭', '연월', '일 제거']),
        wantsExponentialRestore: filterBy(['지수', 'exponential', 'E+']),
        wantsSkuNormalize: filterBy(['sku', '모델명', '상품코드']),
        wantsUnitUnify: filterBy(['단위 제거', '수치화', '숫자만']),
        wantsCurrencyStandardize: filterBy(['통화', '화폐', '부호 제거']),
        nlpDateSeparator, nlpUseEmptySeparator, wantsEmptyOnError,
        numericConditions, nullFillings, mappings, patternMappings,
        allPotentialTargets, hasAction
    };
}
