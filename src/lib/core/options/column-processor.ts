import { normalizeDate, normalizeDateTime, parseKoreanAmount, GARBAGE_REGEX } from '../utils';

/**
 * 단일 값에 대해 컬럼 옵션을 적용하는 함수입니다.
 * @param val - 셀 값
 * @param option - 적용할 옵션 타입 (e.g., 'date', 'mobile', 'rrn' 등)
 * @param nlpSep - NLP에서 감지된 날짜 구분자 (있을 경우 우선 적용)
 */
export function applySingleColumnOption(val: string, option: string, nlpSep: string | null): string {
    if (!val) return val;
    val = val.trim();

    switch (option) {
        // --- 기본 및 날짜 ---
        case 'date':
            if (nlpSep !== null) {
                const digits = val.replace(/\D/g, '');
                if (digits.length === 8) return `${digits.substring(0, 4)}${nlpSep}${digits.substring(4, 6)}${nlpSep}${digits.substring(6, 8)}`;
                if (/^\d{4}[-./]\d{2}[-./]\d{2}/.test(val)) return val.substring(0, 10).replace(/[-./]/g, nlpSep);
            }
            return normalizeDate(val) || val;
        case 'datetime':
            return normalizeDateTime(val) || val;
        case 'dateTruncate':
            const dateDigits = val.replace(/\D/g, '');
            if (dateDigits.length >= 6) return `${dateDigits.substring(0, 4)}${nlpSep || '.'}${dateDigits.substring(4, 6)}`;
            return val;

        // --- 개인정보 및 보안 ---
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
        case 'phoneMidMask':
            if (val.includes('-')) {
                const parts = val.split('-');
                if (parts.length === 3) return `${parts[0]}-****-${parts[2]}`;
            }
            return val;
        case 'rrn':
            if (/\d{6}[-.]?[1-4]\d{6}/.test(val)) return val.replace(/(\d{6})[-.]?([1-4])\d{6}/, '$1-$2******');
            return val;
        case 'emailMask':
            if (val.includes('@')) {
                const [id, domain] = val.split('@');
                const maskedId = id.length <= 3 ? id[0] + '***' : id.substring(0, 3) + '****';
                return maskedId + '@' + domain;
            }
            return val;
        case 'nameMask':
            // 한글 이름 2~4글자 마스킹
            if (val.length === 2) return val[0] + '*';
            if (val.length === 3) return val[0] + '*' + val[2];
            if (val.length > 3) return val[0] + '**' + val[val.length - 1];
            return val;
        case 'addressMask':
            // 주소 상세 마스킹
            return val.replace(/\d+-\d+/g, '****').replace(/\d+동\s?\d+호/g, '****호').replace(/\d+번길\s?\d+/g, '$1 ****');
        case 'accountMask':
            const accVal = val.replace(/[-\s]/g, '');
            if (accVal.length >= 10) return val.substring(0, val.length - 4) + "****";
            return val;
        case 'cardMask':
            if (val.includes('*') && /\d{3,4}$/.test(val)) return val;
            const caVal = val.replace(/[-\s]/g, '');
            if (caVal.length >= 10 && caVal.length <= 19) {
                return val.substring(0, val.length - 4) + "****";
            }
            return val;

        // --- 비즈니스 및 금융 ---
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
        case 'companyClean':
            // (주), 주식회사 등 제거
            return val.replace(/\((?:주|유|합|사|재|특|협|공|사단|재단|법인)\)|(?:주|유|합|사|재)식회사/g, '').trim();
        case 'positionRemove':
            // 직함 제거
            return val.replace(/\s?(?:대리|과장|차장|부장|팀장|본부장|실장|사장|대표|이사|전무|상무|위원|교수|의사|간호사|연구원)$/, '').trim();
        case 'currencyStandardize':
            return val.replace(/[$\u00A3\u20AC\u00A5\u20A9,\s]/g, '');

        // --- 업종 특화 및 기타 ---
        case 'zip':
            let zDigits = val.replace(/\D/g, '');
            if (zDigits.length > 5 && !val.includes('-')) zDigits = zDigits.substring(0, 5);
            return zDigits.length > 0 && zDigits.length <= 6 ? zDigits.padStart(5, '0') : val;
        case 'url':
            return (!val.startsWith('http') && val.includes('.')) ? 'https://' + val : val;
        case 'area': // 단위 수치화 (평/m2 등 제거하고 숫자만)
        case 'unitUnify':
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
            // 엑셀 지수 표기 복원 후 처리
            if (val.includes('E+') || val.includes('e+')) {
                const num = Number(val);
                if (!isNaN(num)) val = num.toLocaleString('fullwide', { useGrouping: false });
            }
            const tDigits = val.replace(/\D/g, '');
            return tDigits.length > 5 ? tDigits : val;
        case 'orderId':
            return val.replace(/[^a-zA-Z0-9]/g, '');
        case 'exponentialRestore':
            if (val.includes('E+') || val.includes('e+')) {
                const num = Number(val);
                return !isNaN(num) ? num.toLocaleString('fullwide', { useGrouping: false }) : val;
            }
            return val;
        case 'buildingExtract':
            const bMatch = val.match(/([가-힣0-9A-Za-z]+(?:아파트|빌딩|타워|상가|오피스텔|빌라|하우스|팰리스|캐슬|맨션))/);
            return bMatch ? bMatch[1] : val;
        case 'dongExtract':
            const dMatch = val.match(/([가-힣0-9]+[동읍면])/);
            return dMatch ? dMatch[1] : val;
        case 'skuNormalize':
            return val.toUpperCase().replace(/[-_\s]/g, '');
        case 'ageCategory':
            const ageNum = parseInt(val.replace(/\D/g, ''));
            return !isNaN(ageNum) ? `${Math.floor(ageNum / 10) * 10}대` : val;

        // --- 일반 텍스트 정제 ---
        case 'trim':
            return val.replace(/\s+/g, ' ').trim();
        case 'garbage':
            return GARBAGE_REGEX.test(val) ? '' : val;
        case 'nameClean':
            // 특수문자 제거 후 트림
            return val.replace(/[0-9!@#$%^&*()_+={}\[\]|\\;:'",<>?/~`]/g, '').trim();
        case 'emailClean':
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? val : '';
        case 'htmlRemove':
            return val.replace(/<[^>]*>?/gm, '');
        case 'emojiRemove':
            return val.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
        case 'upperCase':
            return val.toUpperCase();
        case 'lowerCase':
            return val.toLowerCase();

        default:
            return val;
    }
}
