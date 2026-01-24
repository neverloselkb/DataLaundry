/**
 * 한글 금액 문자열을 숫자로 변환하는 함수
 * 예: "1,500만 3천원" -> 15003000
 * @param text 변환할 한글 금액 문자열
 * @returns 변환된 숫자값
 */
export function parseKoreanAmount(text: string): number {
    let total = 0;
    const clean = text.replace(/[원\s,]/g, '');
    const units: Record<string, number> = { '만': 10000, '천': 1000, '백': 100 };
    let currentNumStr = '';

    for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        if (/[0-9.]/.test(char)) {
            currentNumStr += char;
        } else if (units[char]) {
            const num = currentNumStr === '' ? 1 : parseFloat(currentNumStr);
            total += num * units[char];
            currentNumStr = '';
        }
    }

    if (currentNumStr !== '') {
        total += parseFloat(currentNumStr);
    }

    return Math.round(total);
}

/**
 * 다양한 날짜 형식 문자열을 표준 포맷(yyyy-MM-dd)으로 변환하는 함수
 * @param val 날짜 문자열
 * @returns 변환된 표준 날짜 문자열 또는 null
 */
export function normalizeDate(val: string): string | null {
    val = val.trim();
    if (!val) return null;

    const krMatch = val.match(/((?:19|20)\d{2})[-.년/\s]{1,3}(\d{1,2})[-.월/\s]{1,3}(\d{1,2})[일\s)]?/);
    if (krMatch) {
        return `${krMatch[1]}-${krMatch[2].padStart(2, '0')}-${krMatch[3].padStart(2, '0')}`;
    }

    const ymdMatch = val.match(/((?:19|20)\d{2})[-./](\d{1,2})[-./](\d{1,2})/);
    if (ymdMatch) {
        return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
    }

    const mdyMatch = val.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.]((?:19|20)\d{2})/);
    if (mdyMatch) {
        let p1 = parseInt(mdyMatch[1]);
        let p2 = parseInt(mdyMatch[2]);
        const y = mdyMatch[3];
        let m, d;
        if (p1 > 12) {
            m = p2; d = p1;
        } else if (p2 > 12) {
            m = p1; d = p2;
        } else {
            m = p1; d = p2;
        }
        if (m > 12 || d > 31) return null;
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    const eightMatch = val.match(/((?:19|20)\d{2})(\d{2})(\d{2})/);
    if (eightMatch) {
        return `${eightMatch[1]}-${eightMatch[2]}-${eightMatch[3]}`;
    }

    const sixMatch = val.match(/^(\d{2})(\d{2})(\d{2})/);
    if (sixMatch) {
        const y = parseInt(sixMatch[1]);
        const fullYear = (y > 50 ? 1900 : 2000) + y;
        return `${fullYear}-${sixMatch[2]}-${sixMatch[3]}`;
    }

    const yyMatch = val.match(/^(\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
    if (yyMatch) {
        let y = parseInt(yyMatch[1]);
        let m = parseInt(yyMatch[2]);
        let d = parseInt(yyMatch[3]);
        const fullYear = (y > 50 ? 1900 : 2000) + y;
        if (m <= 12 && d <= 31) {
            return `${fullYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
    }

    return null;
}

/**
 * 일시 형식 문자열을 표준 포맷(yyyy-MM-dd HH:mm:ss)으로 변환하는 함수
 * @param val 일시 문자열
 * @returns 변환된 표준 일시 문자열 또는 null
 */
export function normalizeDateTime(val: string): string | null {
    val = val.trim();
    if (!val) return null;

    const timeMarkerMatch = val.match(/(오전|오후|am|pm|[\d]{1,2}:[\d]{1,2}(?::[\d]{1,2})?)/i);
    if (!timeMarkerMatch) return null;

    const datePart = normalizeDate(val);
    if (!datePart) return null;

    const timeMatch = val.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (!timeMatch) return null;

    let hh = parseInt(timeMatch[1]);
    const mm = timeMatch[2].padStart(2, '0');
    const ss = (timeMatch[3] || '0').padStart(2, '0');

    const isAfternoon = /오후|pm/i.test(val);
    const isMorning = /오전|am/i.test(val);

    if (isAfternoon && hh < 12) {
        hh += 12;
    } else if (isMorning && hh === 12) {
        hh = 0;
    }

    const finalTime = `${String(hh).padStart(2, '0')}:${mm}:${ss}`;
    return `${datePart} ${finalTime}`;
}

/**
 * 가비지(깨진 문자, 무의미한 데이터) 탐지를 위한 정규식
 */
export const GARBAGE_REGEX = /Ã|ï¿½|&nbsp;|unknown|N\/A|NaN|undefined|null|[ëìí][\u0080-\u00BF]|ðŸ|[\u1F60-\u1F64][\u0080-\u00BF]|^None$|^X$|^---$|^[!@#$%^&*(),.?":{}|<>+=-]+$/i;
