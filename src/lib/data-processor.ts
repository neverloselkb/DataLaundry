import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

export type DataRow = Record<string, string | number | boolean | null>;

export async function parseFile(file: File): Promise<DataRow[]> {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as DataRow[]);
        },
        error: (error) => {
          reject(error);
        },
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        resolve(json as DataRow[]);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Unsupported file type'));
    }
  });
}

export type ProcessingOptions = {
  removeWhitespace: boolean;
  formatMobile: boolean;
  formatGeneralPhone: boolean;
  formatDate: boolean;
  formatDateTime: boolean;
  formatNumber: boolean;
  cleanEmail: boolean;
  formatZip: boolean;
  highlightChanges: boolean;
  cleanGarbage: boolean;
  cleanAmount: boolean;
  cleanName: boolean;
};

export function processDataLocal(data: DataRow[], prompt: string, options: ProcessingOptions = {
  removeWhitespace: false,
  formatMobile: false,
  formatGeneralPhone: false,
  formatDate: false,
  formatDateTime: false,
  formatNumber: false,
  cleanEmail: false,
  formatZip: false,
  highlightChanges: false,
  cleanGarbage: false,
  cleanAmount: false,
  cleanName: false
}, lockedColumns: string[] = []): DataRow[] {
  const lowerPrompt = prompt.toLowerCase();
  let processed = data.map(row => ({ ...row }));

  const filterBy = (keywords: string[]) => keywords.some(k => lowerPrompt.includes(k));
  const hasAction = filterBy(['지워', '제거', '삭제', '없애', '정리', '닦아', '통일', '표준', '바꿔', '변경', '추출', '분리', '남겨']);

  // 1. Phone & Mobile
  if (options.formatMobile || options.formatGeneralPhone || filterBy(['휴대폰', '전화번호', '폰번호', '연락처'])) {
    processed = processed.map(row => {
      const newRow = { ...row };
      for (const key in newRow) {
        if (lockedColumns.includes(key)) continue;
        const lowerKey = key.toLowerCase();
        const isPhoneCol = lowerKey.includes('연락처') || lowerKey.includes('전화번호') || lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('tel');

        if (isPhoneCol) {
          let val = String(newRow[key]);
          // Check if it's already a formatted phone number pattern like xxxx-xxxx within the string
          const shortPatternMatch = val.match(/(\d{3,4})[-. ]?(\d{4})/);
          let onlyDigits = val.replace(/\D/g, '');

          if (onlyDigits.startsWith('82')) {
            onlyDigits = '0' + onlyDigits.substring(2);
          }

          // Format Mobile Phone (01X-XXXX-XXXX)
          if (onlyDigits.startsWith('01') && (options.formatMobile || filterBy(['휴대폰', '모바일', '010', '01']))) {
            if (onlyDigits.length >= 10 && onlyDigits.length <= 11) {
              newRow[key] = onlyDigits.replace(/^(01[016789])(\d{3,4})(\d{4})$/, "$1-$2-$3");
              continue;
            }
          }

          // Format General Phone (Area Code + Number)
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

          // Local / No Prefix (XXXX-XXXX)
          if (onlyDigits.length >= 7 && onlyDigits.length <= 8) {
            newRow[key] = onlyDigits.replace(/(\d{3,4})(\d{4})/, "$1-$2");
          } else if (shortPatternMatch && onlyDigits.length < 11) {
            // If there's a strong pattern like xxxx-xxxx inside a string with text
            newRow[key] = shortPatternMatch[1] + '-' + shortPatternMatch[2];
          } else if (onlyDigits.length >= 7 && onlyDigits.length <= 11) {
            // Fallback for long numbers that don't match standard patterns exactly
            newRow[key] = onlyDigits.replace(/(\d{2,3})(\d{3,4})(\d{4})/, "$1-$2-$3");
          } else if (/[A-Za-z가-힣]/.test(val) && onlyDigits.length < 7) {
            // Only clear if it's definitely a phone column but the data is non-numeric garbage
            newRow[key] = '';
          }
        }
      }
      return newRow;
    });
  }

  // 2. Whitespace
  if (options.removeWhitespace || ((filterBy(['공백', '스페이스', '빈칸'])) && hasAction)) {
    const targetName = filterBy(['이름', '성함', '성명']);
    processed = processed.map(row => {
      const newRow = { ...row };
      for (const key in newRow) {
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

  // 3. Date / DateTime
  if (options.formatDate || options.formatDateTime || filterBy(['날짜', '일시', '일자', 'date'])) {
    processed = processed.map(row => {
      const newRow = { ...row };
      for (const key in newRow) {
        if (lockedColumns.includes(key)) continue;
        const lowerKey = key.toLowerCase();
        const isDateCol = lowerKey.includes('날짜') || lowerKey.includes('일시') || lowerKey.includes('일자') || lowerKey.includes('date') || lowerKey.includes('time');

        if (isDateCol) {
          const val = String(newRow[key]).trim();

          if (options.formatDateTime) {
            const normalizedDT = normalizeDateTime(val);
            if (normalizedDT) {
              newRow[key] = normalizedDT;
              continue;
            }
          }

          if (options.formatDate || filterBy(['날짜', '일시', '일자', 'date'])) {
            const normalized = normalizeDate(val);
            if (normalized) {
              newRow[key] = normalized;
            } else if (/오늘|어제|그저께|그제/.test(val)) {
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

  // 4. City/Province
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

  // 5. Duplicates
  if (filterBy(['중복']) && filterBy(['제거', '삭제', '없애', '지워'])) {
    const seen = new Set();
    processed = processed.filter(row => {
      const str = JSON.stringify(row);
      if (seen.has(str)) return false;
      seen.add(str);
      return true;
    });
  }

  // 6. Generic removal
  if (filterBy(['삭제', '제외']) && filterBy(['행', '데이터', '줄'])) {
    processed = processed.slice(0, Math.max(1, processed.length - 1));
  }

  // 7. Simple Number Formatting (Comma)
  if (options.formatNumber || filterBy(['숫자', '콤마', '포맷'])) {
    processed = processed.map(row => {
      const newRow = { ...row };
      for (const key in newRow) {
        if (lockedColumns.includes(key)) continue;
        const val = String(newRow[key]).trim();
        const lowerKey = key.toLowerCase();

        // Skip names, codes, ids, addresses
        const skipKeywords = ['이름', '고객명', '성함', '성명', '주소', 'address', 'id', '코드', 'code', '번호', 'no'];
        if (skipKeywords.some(k => lowerKey.includes(k))) continue;
        if (/^0/.test(val)) continue; // Skip things like zip codes starting with 0

        // Skip if it looks like a date (YYYYMMDD or YYYY.MM.DD)
        if (val.match(/^(19|20)\d{2}[-.]?\d{2}[-.]?\d{2}$/)) continue;

        // Only format if it's already a clean number or has commas
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

  // 12. Advanced Amount & Unit Cleaning
  if (options.cleanAmount || filterBy(['금액', '가격', '단가', '돈', '단위', '만', '천', '백'])) {
    processed = processed.map(row => {
      const newRow = { ...row };
      for (const key in newRow) {
        if (lockedColumns.includes(key)) continue;
        const val = String(newRow[key]).trim();
        const lowerKey = key.toLowerCase();
        const isMoneyCol = /금액|가격|비용|매출|입금|출금|잔액|price|amount|cost|balance|fee/.test(lowerKey);

        if (isMoneyCol || /[만천백]원$/.test(val)) {
          if (/[만천백]/.test(val)) {
            const parsedValue = parseKoreanAmount(val);
            if (parsedValue > 0) {
              newRow[key] = parsedValue.toLocaleString('en-US');
              continue;
            }
          }

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

  // 8. Email
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
            newRow[key] = '';
          }
        }
      }
      return newRow;
    });
  }

  // 9. Zip Code
  const normalizedZipPrompt = lowerPrompt.replace(/\s+/g, '');
  const hasZipKeyword = filterBy(['우편번호', 'zip', 'postal', '우편']);

  // Logic: If prompt mentions "5" (digits) AND words like "remove", "clear", "empty" -> assume cleaning intent for non-standard length.
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
        // Normalize key to handle "우편 번호" vs "우편번호"
        const normalizedKey = lowerKey.replace(/\s+/g, '');
        if (normalizedKey.includes('우편번호') || normalizedKey.includes('우편') || lowerKey.includes('zip') || lowerKey.includes('postal')) {
          const val = String(newRow[key]).trim();

          // Extract only digits. If it's a mix like "Zip: 06234", extract "06234"
          let onlyDigits = val.replace(/\D/g, '');

          // SPECIAL RULE: Clear if instruction says "clear if > 5 digits"
          if (shouldClearLongZip && onlyDigits.length > 5) {
            newRow[key] = '';
            continue;
          }

          // Take only first 5 digits if it's too long (maybe a phone number or address part)
          if (onlyDigits.length > 5 && !val.includes('-')) {
            onlyDigits = onlyDigits.substring(0, 5);
          }

          if (onlyDigits.length > 0 && onlyDigits.length <= 6) { // 6 for old Korean zip codes
            newRow[key] = onlyDigits.padStart(5, '0');
          }
        }
      }
      return newRow;
    });
  }

  // 10. Mapping (Search and Replace)
  if (filterBy(['변경', '변환', '교체', '바꿔', '수정', '치환'])) {
    // Group 1 correctly catches bracketed values like [xxx원] or [%3d]원
    // Greedy match to catch the whole value before optional words like "데이터"
    const mappingRegex = /([\[\]%A-Za-z0-9가-힣_\-]+)\s*(?:데이터|값|문구|텍스트|형식|패턴)?(?:\s*의)?\s*(?:데이터|값|문구|텍스트)?\s*(?:는|은|->|:|를|을)\s*([\[\]%A-Za-z0-9가-힣_\-\s]+)/g;
    const matches = Array.from(lowerPrompt.matchAll(mappingRegex));
    const mappings: Record<string, string> = {};

    matches.forEach(m => {
      let from = m[1].trim().toLowerCase();
      let to = m[2].trim();

      // Multi-step cleanup for verb endings
      to = to.replace(/(?:으로|로|라고|하게|으로\s+변경|로\s+변경|로\s+수정|변경\s*해\s*줘|변경해줘|해\s*줘|해줘)$/, '').trim();
      to = to.replace(/(으로|로|라고|하게)$/, '').trim();

      // Recognition of "blank", "empty"
      if (['빈칸', '공백', 'empty', 'blank', '없음', '제거'].includes(to)) {
        to = '';
      }

      if (from && (to !== undefined)) {
        mappings[from] = to;
      }
    });

    if (Object.keys(mappings).length > 0) {
      let targetCol: string | undefined;
      // Handle "ColName" 컬럼의 ...
      const colHintMatch = lowerPrompt.match(/['"]?([A-Za-z0-9가-힣]+)['"]?\s*컬럼/);
      if (colHintMatch) {
        const hint = colHintMatch[1].toLowerCase();
        targetCol = Object.keys(processed[0] || {}).find(k => k.toLowerCase().includes(hint));
      }

      // Convert certain mappings to regex patterns if they contain placeholders
      const patternMappings: { regex: RegExp; replacement: string }[] = [];
      for (const mapFrom in mappings) {
        if (mapFrom.includes('%')) {
          let regexStr = mapFrom
            .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // Escape regex special chars
            .replace(/(?:\\\[)?%d(?:\\\])?/g, '\\d+')           // [%d] or %d -> \d+
            .replace(/(?:\\\[)?%s(?:\\\])?/g, '.+')             // [%s] or %s -> .+
            .replace(/(?:\\\[)?%(\d+)d(?:\\\])?/g, '\\d{$1}')   // [%3d] or %3d -> \d{3}
            .replace(/(?:\\\[)?%(\d+)s(?:\\\])?/g, '.{$1}');    // [%5s] or %5s -> .{5}

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
            // Check dynamic patterns
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

  // 11. Garbage Cleaning
  if (options.cleanGarbage || filterBy(['가비지', '쓰레기', '의미없는', '깨진', 'garbage', 'noise'])) {
    // Note: ^...$ anchors used for ambiguous characters to prevent partial matches in valid data
    const garbageRegex = /Ã|ï¿½|&nbsp;|unknown|N\/A|NaN|undefined|null|[ëìí][\u0080-\u00BF]|ðŸ|[\u1F60-\u1F64][\u0080-\u00BF]|^None$|^X$|^---$|^[!@#$%^&*(),.?":{}|<>+=-]+$/i;
    processed = processed.map(row => {
      const newRow = { ...row };
      for (const key in newRow) {
        if (lockedColumns.includes(key)) continue;

        const val = String(newRow[key]).trim();
        if (garbageRegex.test(val)) {
          newRow[key] = '';
        }
      }
      return newRow;
    });
  }

  // 14. Clean Name (Remove Digits/Symbols)
  if (options.cleanName || (filterBy(['이름', '성함', '성명', '고객명']) && hasAction)) {
    processed = processed.map(row => {
      const newRow = { ...row };
      for (const key in newRow) {
        if (lockedColumns.includes(key)) continue;
        const lowerKey = key.toLowerCase();
        const isNameCol = ['이름', '고객명', '성함', '성명', 'name'].some(k => lowerKey.includes(k));

        if (isNameCol) {
          let val = String(newRow[key]);
          // Remove digits and symbols but keep spaces and characters. Dots are now noise.
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

function parseKoreanAmount(text: string): number {
  let total = 0;

  // Normalize: remove '원' and spaces
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

  // Add remaining digits (e.g., "1만 500" -> 10000 + 500)
  if (currentNumStr !== '') {
    total += parseFloat(currentNumStr);
  }

  // Round to nearest integer to avoid float precision issues (e.g., 94.2503 * 10000 might be 942502.999...)
  return Math.round(total);
}

export function downloadData(processedData: DataRow[], fileName: string, originalData?: DataRow[], highlight: boolean = false) {
  const isCsv = fileName.toLowerCase().endsWith('.csv');
  if (isCsv) {
    const csv = Papa.unparse(processedData);
    const blob = new Blob(["\ufeff", csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } else {
    if (highlight && originalData) {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Cleaned Data');
      const headers = Object.keys(processedData[0] || {});
      worksheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));
      processedData.forEach((row, index) => {
        const worksheetRow = worksheet.addRow(row);
        const originalRow = originalData[index];
        const garbageRegex = /Ã|ï¿½|&nbsp;|---|unknown|N\/A|NaN|undefined|null|[ëìí][\u0080-\u00BF]|ðŸ|[\u1F60-\u1F64][\u0080-\u00BF]|^None$|^X$|^[!@#$%^&*(),.?":{}|<>+=-]+$/i;

        if (originalRow) {
          headers.forEach((h, colIndex) => {
            const currentVal = String(row[h] || '');
            const originalVal = String(originalRow[h] || '');

            if (currentVal !== originalVal) {
              const cell = worksheetRow.getCell(colIndex + 1);

              // Decide color: Red for garbage removal (if original was garbage and now it's empty/cleaned)
              const wasGarbage = garbageRegex.test(originalVal);
              const isRed = wasGarbage && (currentVal === '' || currentVal === '0');

              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: isRed ? 'FFFFCDD2' : 'FFFFF9C4' } // Light Red vs Light Yellow
              };
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
            }
          });
        }
      });
      workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      });
    } else {
      const worksheet = XLSX.utils.json_to_sheet(processedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      XLSX.writeFile(workbook, fileName);
    }
  }
}

export function calculateColumnLengths(data: DataRow[]): Record<string, number> {
  const columnLengths: Record<string, number> = {};
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

export type DataIssue = {
  column: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  suggestion?: Partial<ProcessingOptions>;
  promptSuggestion?: string;
  fixType?: 'maxLength';
  affectedRows?: number[];
};

export function detectDataIssues(data: DataRow[], maxLengthConstraints: Record<string, number> = {}, options?: Partial<ProcessingOptions>): DataIssue[] {
  const issues: DataIssue[] = [];
  if (data.length === 0) return issues;
  const headers = Object.keys(data[0]);

  for (const key of headers) {
    if (key === 'id') continue;

    // Map to value and original index, filter out empty strings
    // We keep 'idx' to report back which rows are affected
    const relevantRows = data.map((row, i) => ({ val: String(row[key] || ''), idx: i }))
      .filter(item => item.val.trim() !== '');

    if (relevantRows.length === 0) continue;

    // 0. Max Length Check
    if (maxLengthConstraints[key] && maxLengthConstraints[key] > 0) {
      const limit = maxLengthConstraints[key];
      const lengthExceededRows = relevantRows.filter(r => {
        let valToMeasure = r.val;
        // If number formatting is on, ignore commas for length calculation
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

    // 1. Whitespace
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

    // 2. Phone
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
          // If inconsistent, show all relevant phone rows as they are part of the inconsistency
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

    // 3. Date
    const isEmailCol = key.toLowerCase().includes('email') || key.includes('이메일');
    const dateLikeRows = isEmailCol ? [] : relevantRows.filter(r =>
      /^((19|20)\d{2}[-.\/년\s]|(19|20)\d{6}$)/.test(r.val) ||
      /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.]((?:19|20)\d{2})$/.test(r.val) || // M/D/YYYY or D/M/YYYY
      /^(\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/.test(r.val) ||       // YY/MM/DD
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

    // 4. Email
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

    // 5. Zip
    const isZipCol = key.includes('우편번호') || key.toLowerCase().includes('zip') || key.toLowerCase().includes('postal');
    if (isZipCol) {
      const badZipRows = relevantRows.filter(r => r.val.replace(/\D/g, '').length !== 5 || r.val.trim() !== r.val);
      if (badZipRows.length > 0) {
        issues.push({
          column: key,
          type: 'warning',
          message: `'${key}' 컬럼에 우편번호 형식이 맞지 않습니다.`,
          suggestion: { formatZip: true },
          affectedRows: badZipRows.map(r => r.idx)
        });
      }
    }

    // 6. Garbage
    const garbageRegex = /Ã|ï¿½|&nbsp;|unknown|N\/A|NaN|undefined|null|[ëìí][\u0080-\u00BF]|ðŸ|[\u1F60-\u1F64][\u0080-\u00BF]|^None$|^X$|^---$|^[!@#$%^&*(),.?":{}|<>+=-]+$/i;
    const garbageRows = relevantRows.filter(r => garbageRegex.test(r.val));
    if (garbageRows.length > 0) {
      issues.push({
        column: key,
        type: 'warning',
        message: `'${key}' 컬럼에 깨진 문자열이나 무의미한 데이터가 있습니다.`,
        suggestion: { cleanGarbage: true },
        affectedRows: garbageRows.map(r => r.idx)
      });
    }

    // 7. Type Mismatch (Amount Columns)
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

    // 8. Name Noise
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

    // 9. Address pattern (If column contains address terms but values are messy)
    if (key.toLowerCase().includes('주소') || key.toLowerCase().includes('address')) {
      const addressIndicators = ['시 ', '군 ', '구 ', '동 ', '로 '];
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
  return issues;
}

export type ProcessingStats = {
  totalCells: number;
  changedCells: number;
  columnStats: Record<string, number>;
  resolvedIssues: number;
};

export function calculateDiffStats(original: DataRow[], processed: DataRow[], initialIssuesCount: number, finalIssuesCount: number): ProcessingStats {
  const stats: ProcessingStats = {
    totalCells: 0,
    changedCells: 0,
    columnStats: {},
    resolvedIssues: Math.max(0, initialIssuesCount - finalIssuesCount)
  };

  if (processed.length === 0) return stats;
  const headers = Object.keys(processed[0]);
  stats.totalCells = processed.length * headers.length;

  processed.forEach((row, i) => {
    const origRow = original[i];
    if (!origRow) return;

    headers.forEach(h => {
      if (String(row[h]) !== String(origRow[h])) {
        stats.changedCells++;
        stats.columnStats[h] = (stats.columnStats[h] || 0) + 1;
      }
    });
  });

  return stats;
}

export function normalizeDate(val: string): string | null {
  val = val.trim();
  if (!val) return null;

  // 1. Handle Korean full/standard format: 2024년 01월 22일 or 2024.01.22
  const krMatch = val.match(/((?:19|20)\d{2})[-.년/\s]{1,3}(\d{1,2})[-.월/\s]{1,3}(\d{1,2})[일\s)]?/);
  if (krMatch) {
    return `${krMatch[1]}.${krMatch[2].padStart(2, '0')}.${krMatch[3].padStart(2, '0')}`;
  }

  // 2. Handle ISO or YYYY-MM-DD
  const ymdMatch = val.match(/((?:19|20)\d{2})[-./](\d{1,2})[-./](\d{1,2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}.${ymdMatch[2].padStart(2, '0')}.${ymdMatch[3].padStart(2, '0')}`;
  }

  // 3. Handle M/D/YYYY or D/M/YYYY (Global/US formats) with slashes, dots, dashes
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
    return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
  }

  // 4. Handle 8 digits: 20240122
  const eightMatch = val.match(/((?:19|20)\d{2})(\d{2})(\d{2})/);
  if (eightMatch) {
    return `${eightMatch[1]}.${eightMatch[2]}.${eightMatch[3]}`;
  }

  // 5. Handle 6 digits: 240122
  const sixMatch = val.match(/^(\d{2})(\d{2})(\d{2})/);
  if (sixMatch) {
    const y = parseInt(sixMatch[1]);
    const fullYear = (y > 50 ? 1900 : 2000) + y;
    return `${fullYear}.${sixMatch[2]}.${sixMatch[3]}`;
  }

  // 6. Handle YY/MM/DD
  const yyMatch = val.match(/^(\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (yyMatch) {
    let y = parseInt(yyMatch[1]);
    let m = parseInt(yyMatch[2]);
    let d = parseInt(yyMatch[3]);
    const fullYear = (y > 50 ? 1900 : 2000) + y;
    if (m <= 12 && d <= 31) {
      return `${fullYear}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
    }
  }

  return null;
}

export function normalizeDateTime(val: string): string | null {
  val = val.trim();
  if (!val) return null;

  // 1. Separate Date and Time parts
  // Look for time markers: 오전, 오후, AM, PM, or : separators
  const timeMarkerMatch = val.match(/(오전|오후|am|pm|[\d]{1,2}:[\d]{1,2}(?::[\d]{1,2})?)/i);
  if (!timeMarkerMatch) return null;

  // Try to find the date part using our existing normalizeDate logic
  const datePart = normalizeDate(val);
  if (!datePart) return null;

  // 2. Extract Time components
  // Match HH:mm:ss or HH:mm
  const timeMatch = val.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (!timeMatch) return null;

  let hh = parseInt(timeMatch[1]);
  const mm = timeMatch[2].padStart(2, '0');
  const ss = (timeMatch[3] || '0').padStart(2, '0');

  // 3. Handle AM/PM (12-hour to 24-hour conversion)
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
