import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { DataRow } from '@/types';
import { GARBAGE_REGEX } from './utils';

/**
 * 정제된 데이터를 파일로 다운로드하는 함수
 * CSV 및 Excel(xlsx) 형식을 지원하며, 옵션에 따라 변경 사항을 하이라이트할 수 있습니다.
 * 
 * @param processedData 정제된 데이터 배열
 * @param fileName 저장할 파일명 (확장포함)
 * @param originalData (선택) 원본 데이터, 변경 사항 비교 시 필요
 * @param highlight (선택) 변경된 셀 하이라이트 여부 (Excel 전용)
 */
export function downloadData(processedData: DataRow[], fileName: string, originalData?: DataRow[], highlight: boolean = false) {
    const isCsv = fileName.toLowerCase().endsWith('.csv');

    // 1. CSV 다운로드
    if (isCsv) {
        const csv = Papa.unparse(processedData);
        // UTF-8 BOM 추가하여 한글 깨짐 방지
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
    }
    // 2. Excel 다운로드
    else {
        // 하이라이트 옵션이 켜져있고 원본 데이터가 있는 경우 ExcelJS 사용 (스타일링 가능)
        if (highlight && originalData) {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Cleaned Data');
            const headers = Object.keys(processedData[0] || {});

            // 헤더 설정
            worksheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));

            // 데이터 추가 및 스타일링
            processedData.forEach((row, index) => {
                const worksheetRow = worksheet.addRow(row);
                const originalRow = originalData[index];

                if (originalRow) {
                    headers.forEach((h, colIndex) => {
                        const currentVal = String(row[h] || '');
                        const originalVal = String(originalRow[h] || '');

                        // 값이 변경된 경우 스타일 적용
                        if (currentVal !== originalVal) {
                            const cell = worksheetRow.getCell(colIndex + 1);

                            // 가비지였던 데이터가 지워진 경우 빨간색 계열, 그 외 수정은 노란색 계열
                            const wasGarbage = GARBAGE_REGEX.test(originalVal);
                            const isRed = wasGarbage && (currentVal === '' || currentVal === '0');

                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: isRed ? 'FFFFCDD2' : 'FFFFF9C4' } // 붉은색(제거됨) vs 노란색(수정됨)
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

            // 파일 쓰기
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
        }
        // 단순 Excel 다운로드 (SheetJS 사용)
        else {
            const worksheet = XLSX.utils.json_to_sheet(processedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
            XLSX.writeFile(workbook, fileName);
        }
    }
}
