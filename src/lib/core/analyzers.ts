import { DataRow, DataIssue, ProcessingOptions, ProcessingStats, ColumnLimits, ColumnOptionType } from '@/types';
import { GARBAGE_REGEX } from './utils';

/**
 * 컬럼 데이터 패턴을 분석하여 적절한 헤더 이름을 추천하는 함수
 * @param data 데이터 배열
 * @param column 분석할 컬럼명
 * @returns 추천 헤더 이름 배열 (최대 5개)
 */
export function getHeaderRecommendations(data: DataRow[], column: string): string[] {
    // 상위 20개 행만 샘플링하여 분석
    const values = data.slice(0, 20).map(r => String(r[column] || ''));
    const combined = values.join(' ');

    const recs: string[] = [];
    // 전화번호 패턴
    if (/01[016789]|-?\d{3,4}-?\d{4}/.test(combined)) recs.push('연락처', '휴대폰', 'Phone', 'Mobile');
    // 이메일 패턴
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(combined)) recs.push('이메일', 'Email');
    // 금액/가격 패턴
    if (/원|금액|매출|가격|price|amount|\d{1,3}(,\d{3})+/i.test(combined + column)) recs.push('금액', '가격', 'Amount', 'Price');
    // 날짜 패턴
    if (/\d{4}[.-/]\d{1,2}[.-/]\d{1,2}|오늘|어제|일시|일자/.test(combined + column)) recs.push('날짜', '등록일시', 'Date');
    // 우편번호 패턴
    if (/\b\d{5}\b/.test(combined) && (column.includes('우편') || /zip|postal/i.test(column))) recs.push('우편번호', 'Zip Code', 'Postcode');
    // 이름/성명 패턴
    if (/name|이름|성함|성명/i.test(column)) recs.push('고객명', '성함', 'Name', 'Customer');
    // 주소 패턴
    if (['서울', '경기', '부산', '대구', '인천', '광주', '대전', '울산', '세종'].some(city => combined.includes(city))) recs.push('주소', '거주지', 'Address');

    // Biz Number
    if (/\d{3}-\d{2}-\d{5}/.test(combined) || (/\d{10}/.test(combined) && column.includes('사업'))) recs.push('사업자등록번호', '사업자번호', 'BizNo');
    // Corp Number
    if (/\d{6}-\d{7}/.test(combined) || (/\d{13}/.test(combined) && column.includes('법인'))) recs.push('법인등록번호', '법인번호', 'CorpNo');
    // URL
    if (/www\.|https?:\/\/|\.com|\.co\.kr/.test(combined)) recs.push('홈페이지', '웹사이트', 'URL', 'Website');
    // RRN (Resident Registration Number)
    if (/\d{6}-[1-4]\d{6}/.test(combined)) recs.push('주민등록번호', '주민번호', 'RRN');

    if (recs.length === 0) recs.push('데이터', '기타', 'Data', 'Etc');
    return Array.from(new Set(recs)).filter(r => r !== column).slice(0, 5);
}

/**
 * 데이터의 각 컬럼별 최대 길이를 계산하는 함수
 * @param data 데이터 배열
 * @returns 컬럼명을 키로, 최대 길이를 값으로 가지는 객체
 */
export function calculateColumnLengths(data: DataRow[]): ColumnLimits {
    const columnLengths: ColumnLimits = {};
    if (data.length === 0) return columnLengths;

    const headers = Object.keys(data[0]);
    for (const header of headers) {
        let maxLength = 0;
        for (const row of data) {
            const value = String(row[header] || '');
            if (value.length > maxLength) {
                maxLength = value.length;
            }
        }
        columnLengths[header] = maxLength;
    }
    return columnLengths;
}

/**
 * 데이터 내의 잠재적 이슈를 감지하는 함수
 * 정규식과 패턴 매칭을 사용하여 다양한 데이터 품질 문제를 식별합니다.
 * 
 * @param data 검사할 데이터 배열
 * @param maxLengthConstraints 컬럼별 길이 제약 조건
 * @param options 현재 선택된 정제 옵션 (옵션에 따라 검사 기준이 달라질 수 있음)
 * @returns 발견된 DataIssue 배열
 */
export function detectDataIssues(data: DataRow[], maxLengthConstraints: ColumnLimits = {}, options?: Partial<ProcessingOptions>): DataIssue[] {
    const issues: DataIssue[] = [];
    if (data.length === 0) return issues;
    const headers = Object.keys(data[0]);

    for (const key of headers) {
        if (key === 'id') continue;

        const relevantRows = data.map((row, i) => ({ val: String(row[key] || ''), idx: i }))
            .filter(item => item.val.trim() !== '');

        if (relevantRows.length === 0) continue;

        // 0. 최대 길이 검사 (Max Length Check)
        if (maxLengthConstraints[key] && maxLengthConstraints[key] > 0) {
            const limit = maxLengthConstraints[key];
            const lengthExceededRows = relevantRows.filter(r => {
                let valToMeasure = r.val;
                if (options?.formatNumber) {
                    valToMeasure = valToMeasure.replace(/,/g, '');
                }
                return valToMeasure.length > limit;
            });

            if (lengthExceededRows.length > 0) {
                issues.push({
                    column: key,
                    type: 'error',
                    message: `'${key}' 컬럼의 데이터가 설정된 최대 길이(${limit}자)를 초과했습니다.${options?.formatNumber ? ' (천단위 콤마 실시간 보정 적용됨)' : ''}`,
                    fixType: 'maxLength',
                    affectedRows: lengthExceededRows.map(r => r.idx)
                });
            }
        }

        // 1. 공백 검사 (Whitespace)
        const whitespaceRows = relevantRows.filter(r => r.val.trim() !== r.val);
        if (whitespaceRows.length > 0) {
            const sample = whitespaceRows[0].val;
            issues.push({
                column: key,
                type: 'warning',
                message: `'${key}' 컬럼에 불필요한 공백이 포함된 데이터가 있습니다. (예: "${sample}")`,
                suggestion: { removeWhitespace: true },
                affectedRows: whitespaceRows.map(r => r.idx)
            });
        }

        // 2. 전화번호 검사 (Phone)
        const isPhoneCol = key.includes('연락처') || key.includes('전화번호') || key.toLowerCase().includes('phone');
        if (isPhoneCol) {
            const rowsWithLetters = relevantRows.filter(r => /[A-Za-z가-힣]/.test(r.val));
            const rowsWithNonDigitsOrBadIntl = relevantRows.filter(r => /[^\d-]/.test(r.val) || r.val.replace(/\D/g, '').startsWith('82'));

            if (rowsWithLetters.length > 0) {
                issues.push({
                    column: key,
                    type: 'warning',
                    message: `'${key}' 컬럼에 비정상적인 문자(가짜 번호 가능성)가 포함되어 있습니다.`,
                    suggestion: { formatMobile: true, formatGeneralPhone: true },
                    affectedRows: rowsWithLetters.map(r => r.idx)
                });
            } else if (rowsWithNonDigitsOrBadIntl.length > 0) {
                issues.push({
                    column: key,
                    type: 'warning',
                    message: `'${key}' 컬럼에 텍스트가 섞여 있거나 국가번호(82)가 포함되어 있습니다.`,
                    suggestion: { formatMobile: true, formatGeneralPhone: true },
                    affectedRows: rowsWithNonDigitsOrBadIntl.map(r => r.idx)
                });
            } else {
                const hasDash = relevantRows.some(r => r.val.includes('-'));
                const hasNoDash = relevantRows.some(r => !r.val.includes('-') && r.val.replace(/\D/g, '').length >= 9);
                if (hasDash && hasNoDash) {
                    issues.push({
                        column: key,
                        type: 'warning',
                        message: `'${key}' 컬럼에 전화번호 형식이 일관되지 않습니다.`,
                        suggestion: { formatMobile: true, formatGeneralPhone: true },
                        affectedRows: relevantRows.map(r => r.idx)
                    });
                }
            }
        }

        // 3. 날짜/일시 검사 (Date)
        const isEmailCol = key.toLowerCase().includes('email') || key.includes('이메일');
        const dateLikeRows = isEmailCol ? [] : relevantRows.filter(r =>
            /^((19|20)\d{2}[-.\/년\s]|(19|20)\d{6}$)/.test(r.val) ||
            /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.]((?:19|20)\d{2})$/.test(r.val) ||
            /^(\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/.test(r.val) ||
            /년|월|일/.test(r.val) ||
            /오늘|어제|그저께/.test(r.val)
        );
        if (dateLikeRows.length > 0) {
            const relativeDateRows = dateLikeRows.filter(r => /오늘|어제|그저께/.test(r.val));
            const mixedDateRows = dateLikeRows.filter(r => /[가-힣a-zA-Z]/.test(r.val) && /((?:19|20)\d{2})/.test(r.val));
            const hasDot = dateLikeRows.some(r => r.val.includes('.'));
            const hasDash = dateLikeRows.some(r => r.val.includes('-'));
            const hasSlash = dateLikeRows.some(r => r.val.includes('/'));
            const isInconsistent = [hasDot, hasDash, hasSlash].filter(Boolean).length > 1;

            const hasTime = dateLikeRows.some(r => /[:오전오후ampm]/i.test(r.val));
            const sugg = hasTime ? { formatDateTime: true } : { formatDate: true };
            const msgSuffix = hasTime ? '일시 형식으로 표준화할 수 있습니다.' : '날짜 형식으로 통일할 수 있습니다.';

            if (relativeDateRows.length > 0) {
                issues.push({
                    column: key,
                    type: 'info',
                    message: `'${key}' 컬럼에 '어제', '오늘' 등 상대적 날짜가 있습니다. ${msgSuffix}`,
                    suggestion: sugg,
                    affectedRows: relativeDateRows.map(r => r.idx)
                });
            } else if (mixedDateRows.length > 0 || isInconsistent) {
                issues.push({
                    column: key,
                    type: 'warning',
                    message: `'${key}' 컬럼에 일관되지 않은 날짜/일시 형식이 있습니다.`,
                    suggestion: sugg,
                    affectedRows: mixedDateRows.length > 0 ? mixedDateRows.map(r => r.idx) : dateLikeRows.map(r => r.idx)
                });
            }
        }

        // 4. 이메일 검사 (Email)
        const emailLikeRows = relevantRows.filter(r => r.val.includes('@'));
        if (emailLikeRows.length > 0) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const invalidEmailRows = emailLikeRows.filter(r => !emailRegex.test(r.val));
            if (invalidEmailRows.length > 0) {
                issues.push({
                    column: key,
                    type: 'warning',
                    message: `'${key}' 컬럼에 유효하지 않은 이메일 형식이 있습니다.`,
                    suggestion: { cleanEmail: true },
                    affectedRows: invalidEmailRows.map(r => r.idx)
                });
            }
        }

        // 5. Zip Code
        const isZipCol = key.includes('우편번호') || key.toLowerCase().includes('zip') || key.toLowerCase().includes('postal');
        if (isZipCol) {
            // 숫자와 하이픈을 제외한 문자가 포함된 행 찾기 (완전한 텍스트 오기입 등)
            const textZipRows = relevantRows.filter(r => /[^\d\s-]/.test(r.val));

            if (textZipRows.length > 0) {
                issues.push({
                    column: key,
                    type: 'warning',
                    message: `'${key}' 컬럼에 숫자가 아닌 문자열 데이터가 섞여 있습니다. 자동 정제가 불가능하니 직접 수정해 주세요.`,
                    affectedRows: textZipRows.map(r => r.idx)
                });
            } else {
                // 숫자로만 구성되었으나 5자리가 아니거나 공백이 있는 경우 (Auto Fix 가능)
                const badFormatRows = relevantRows.filter(r => r.val.replace(/\D/g, '').length !== 5 || r.val.trim() !== r.val);
                if (badFormatRows.length > 0) {
                    issues.push({
                        column: key,
                        type: 'warning',
                        message: `'${key}' 컬럼의 우편번호 형식이 표준(5자리)과 다릅니다.`,
                        suggestion: { formatZip: true },
                        affectedRows: badFormatRows.map(r => r.idx)
                    });
                }
            }
        }

        // 6. 가비지 데이터 검사 (Garbage)
        const garbageRows = relevantRows.filter(r => GARBAGE_REGEX.test(r.val));
        if (garbageRows.length > 0) {
            issues.push({
                column: key,
                type: 'warning',
                message: `'${key}' 컬럼에 깨진 문자열이나 무의미한 데이터가 있습니다.`,
                suggestion: { cleanGarbage: true },
                affectedRows: garbageRows.map(r => r.idx)
            });
        }

        // 7. 데이터 타입 불일치 (Amount)
        if (/금액|가격|비용|price|amount/i.test(key)) {
            const nonNumericRows = relevantRows.filter(r => {
                const cleaned = r.val.replace(/[^0-9]/g, '');
                return cleaned === '' || (/[가-힣a-zA-Z]/.test(r.val) && !r.val.includes('원') && !r.val.includes(','));
            });
            if (nonNumericRows.length > 0) {
                issues.push({
                    column: key,
                    type: 'warning',
                    message: `'${key}' 컬럼에 텍스트가 섞여 있어 합계 계산이 불가능할 수 있습니다.`,
                    suggestion: { cleanAmount: true },
                    affectedRows: nonNumericRows.map(r => r.idx)
                });
            }
        }

        // 8. 이름 내 노이즈 (Name Noise)
        const isNameCol = ['이름', '고객명', '성함', '성명'].some(k => key.includes(k));
        if (isNameCol) {
            const noiseRows = relevantRows.filter(r => /[0-9!@#$%^&*()_+={}\[\]|\\;:'",<>?/~`]/.test(r.val));
            if (noiseRows.length > 0) {
                issues.push({
                    column: key,
                    type: 'warning',
                    message: `'${key}' 컬럼의 이름에 숫자나 특수문자가 섞여 있습니다.`,
                    suggestion: { cleanName: true },
                    affectedRows: noiseRows.map(r => r.idx)
                });
            }
        }

        // 9. Address
        if (key.toLowerCase().includes('주소') || key.toLowerCase().includes('address')) {
            const addressIndicators = ['시 ', '군 ', '구 ', '동 ', '로 ', '길 '];
            // 데이터 길이 분석 (너무 짧으면 정제 불가 판단)
            const totalLen = relevantRows.reduce((acc, curr) => acc + curr.val.length, 0);
            const avgLen = relevantRows.length > 0 ? totalLen / relevantRows.length : 0;

            if (avgLen > 0 && avgLen < 6) {
                issues.push({
                    column: key,
                    type: 'warning',
                    message: `'${key}' 컬럼의 데이터 길이가 너무 짧아 자동 정제가 어렵습니다. (평균 ${Math.round(avgLen)}자) 원본 데이터를 확인 후 직접 수정해 주세요.`,
                    affectedRows: relevantRows.map(r => r.idx)
                });
            } else {
                const validAddressCount = relevantRows.filter(r => addressIndicators.some(ind => r.val.includes(ind))).length;

                if (validAddressCount < relevantRows.length * 0.5) {
                    issues.push({
                        column: key,
                        type: 'warning',
                        message: `'${key}' 컬럼의 주소 형식이 불완전해 보입니다. AI 정제를 제안합니다.`,
                        promptSuggestion: `'${key}' 컬럼의 주소를 도로명 주소 형식으로 정제하고 시/도, 시/군/구로 분리해줘`,
                        affectedRows: relevantRows.map(r => r.idx).filter(idx => !addressIndicators.some(ind => String(data[idx][key] || '').includes(ind)))
                    });
                }
            }
        }


        // 10. 사업자등록번호 (Business Number)
        if (/\d{3}-\d{2}-\d{5}|\d{10}/.test(String(data[0]?.[key] || ''))) {
            // Heuristic: Check few rows
            const bizNumRows = relevantRows.filter(r => r.val.replace(/[^0-9]/g, '').length === 10);
            if (bizNumRows.length > relevantRows.length * 0.5) {
                const invalidBizNum = bizNumRows.filter(r => !/^\d{3}-\d{2}-\d{5}$/.test(r.val));
                if (invalidBizNum.length > 0) {
                    issues.push({
                        column: key,
                        type: 'warning',
                        message: `'${key}' 컬럼에 사업자등록번호 형식이 아닌 데이터가 있습니다.`,
                        suggestion: { formatBizNum: true },
                        affectedRows: invalidBizNum.map(r => r.idx)
                    });
                }
            }
        }

        // 11. 개인정보 (Personal Data) - 주민번호, 외국인번호 마스킹 권장
        // 13자리 숫자 (6-7 format)
        const rrnRows = relevantRows.filter(r => {
            const v = r.val.replace(/[^0-9]/g, '');
            return v.length === 13 && /[0-9]{6}[1-4][0-9]{6}/.test(v);
        });

        if (rrnRows.length > 0) {
            // 마스킹 되지 않은 데이터 확인 (하이픈 뒤가 *이 아닌 경우)
            const unmasked = rrnRows.filter(r => !r.val.includes('*'));
            if (unmasked.length > 0) {
                issues.push({
                    column: key,
                    type: 'error', // High severity for privacy
                    message: `'${key}' 컬럼에 마스킹되지 않은 주민등록번호가 감지되었습니다. 개인정보 보호를 위해 마스킹을 권장합니다.`,
                    suggestion: { maskPersonalData: true },
                    affectedRows: unmasked.map(r => r.idx)
                });
            }
        }

        // 12. URL / Web
        if (key.toLowerCase().includes('url') || key.toLowerCase().includes('web') || key.includes('사이트') || key.includes('주소') /* web content implied */) {
            const urlRows = relevantRows.filter(r => r.val.includes('.') && !r.val.includes('@') && !key.includes('이메일') && !key.includes('email')); // Simple heuristic to avoid email
            const noProtocolRows = urlRows.filter(r => !r.val.startsWith('http'));

            if (noProtocolRows.length > 0 && noProtocolRows.length > urlRows.length * 0.5) {
                issues.push({
                    column: key,
                    type: 'info',
                    message: `'${key}' 컬럼의 웹 사이트 주소에 프로토콜(http/https)이 누락되어 있습니다.`,
                    suggestion: { formatUrl: true },
                    affectedRows: noProtocolRows.map(r => r.idx)
                });
            }
        }
    }

    return issues;
}

/**
 * 정제 전후의 데이터 변화량을 통계로 계산하는 함수
 * @param original 원본 데이터
 * @param processed 정제된 데이터
 * @param initialIssuesCount 정제 전 발견된 이슈 수
 * @param finalIssuesCount 정제 후 남은 이슈 수
 * @returns ProcessingStats 객체
 */
export function calculateDiffStats(original: DataRow[], processed: DataRow[], initialIssuesCount: number, finalIssuesCount: number): ProcessingStats {
    const stats: ProcessingStats = {
        totalRows: 0,
        changedCells: 0,
        resolvedIssues: Math.max(0, initialIssuesCount - finalIssuesCount)
    };

    if (processed.length === 0) return stats;

    stats.totalRows = processed.length;
    const headers = Object.keys(processed[0]);

    processed.forEach((row, i) => {
        const origRow = original[i];
        if (!origRow) return;

        headers.forEach(h => {
            // 값이 달라진 셀 카운트
            if (String(row[h]) !== String(origRow[h])) {
                stats.changedCells++;
            }
        });
    });

    return stats;
}

/**
 * 컬럼 데이터 패턴을 분석하여 적절한 정제 포맷(ColumnOptionType)을 추천하는 함수
 * @param data 데이터 배열
 * @param column 분석할 컬럼명
 * @returns 추천하는 ColumnOptionType
 */
export function recommendColumnFormat(data: DataRow[], column: string): ColumnOptionType {
    if (data.length === 0) return null;

    // 상위 50개 행 샘플링
    const values = data.slice(0, 50).map(r => String(r[column] || '').trim()).filter(Boolean);
    if (values.length === 0) return null;

    const combined = values.join(' ');
    const lowerCol = column.toLowerCase();

    // 1. 휴대폰 (mobile)
    if (/01[016789]/.test(combined) && (lowerCol.includes('휴대폰') || lowerCol.includes('mobile') || lowerCol.includes('연락처'))) return 'mobile';

    // 2. 이메일 (email)
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(combined)) return 'email';

    // 3. 일시 (datetime)
    if (/\d+:\d+/.test(combined) && (lowerCol.includes('일시') || lowerCol.includes('time') || lowerCol.includes('date'))) return 'datetime';

    // 4. 날짜 (date)
    if (/\d{4}[.-/]\d{1,2}[.-/]\d{1,2}/.test(combined) || lowerCol.includes('날짜') || lowerCol.includes('date')) return 'date';

    // 5. 주민번호 (rrn)
    if (/\d{6}-[1-4]\d{6}/.test(combined) || lowerCol.includes('주민')) return 'rrn';

    // 6. 사업자번호 (bizNum)
    if (/\d{3}-\d{2}-\d{5}/.test(combined) || (/\d{10}/.test(combined) && lowerCol.includes('사업'))) return 'bizNum';

    // 7. 법인번호 (corpNum)
    if (/\d{6}-\d{7}/.test(combined) || (/\d{13}/.test(combined) && lowerCol.includes('법인'))) return 'corpNum';

    // 8. 우편번호 (zip)
    if (/\b\d{5}\b/.test(combined) && (lowerCol.includes('우편') || /zip|postal/i.test(lowerCol))) return 'zip';

    // 9. 금액 (amount) - 콤마나 '원' 포함
    if (/\d{1,3}(,\d{3})+/.test(combined) || /원$/.test(combined) || /금액|가격|매출|price|amount/i.test(lowerCol)) {
        if (/[만천백]원/.test(combined)) return 'amountKrn';
        return 'amount';
    }

    // 10. URL (url)
    if (/www\.|https?:\/\/|\.com|\.co\.kr/.test(combined)) return 'url';

    // 11. 해시태그 (hashtag)
    if (/#/.test(combined) || lowerCol.includes('태그') || lowerCol.includes('tag')) return 'hashtag';

    // 12. SNS ID (snsId)
    if (lowerCol.includes('sns') || lowerCol.includes('인스타') || lowerCol.includes('instagram')) return 'snsId';

    // 13. 면적 (area)
    if (lowerCol.includes('면적') || lowerCol.includes('평수') || lowerCol.includes('area')) return 'area';

    // 14. 운송장번호 (trackingNum)
    if (lowerCol.includes('운송장') || lowerCol.includes('송장') || lowerCol.includes('tracking')) return 'trackingNum';

    // 15. 주문번호 (orderId)
    if (lowerCol.includes('주문') || lowerCol.includes('order')) return 'orderId';

    return null;
}

/**
 * 데이터에서 날짜 또는 일시 형식이 포함된 컬럼의 개수를 감지합니다.
 * 상위 50행을 분석하여 판단합니다.
 */
export function detectDateCandidateColumns(data: DataRow[], headers: string[]): number {
    if (!data || data.length === 0) return 0;

    const sampleSize = Math.min(data.length, 50);
    const sample = data.slice(0, sampleSize);
    let dateColCount = 0;

    for (const header of headers) {
        let matchCount = 0;

        // Check first 50 rows
        for (const row of sample) {
            const val = String(row[header] || '').trim();
            if (!val) continue;

            // Simple checks for common date patterns: 
            // YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD, YYYYMMDD
            // Date w/ Time: YYYY-MM-DD HH:mm, etc.
            // We'll use a relatively loose regex to catch candidates
            if (/^\d{4}[-./]\d{1,2}[-./]\d{1,2}/.test(val) || // 2023-01-01
                /^\d{8}$/.test(val)) { // 20230101
                matchCount++;
            }
        }

        // If more than 30% of non-empty rows look like dates, count it
        const nonEmptyRows = sample.filter(r => r[header]).length;
        if (nonEmptyRows > 0 && (matchCount / nonEmptyRows) > 0.3) {
            dateColCount++;
        }
    }

    return dateColCount;
}
