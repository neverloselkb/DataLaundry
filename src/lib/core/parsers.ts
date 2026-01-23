import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DataRow } from '@/types';

/**
 * 파일을 파싱하여 JSON 데이터 배열로 변환하는 함수
 * CSV 및 Excel (.xlsx, .xls) 형식을 지원합니다.
 * 
 * @param file 사용자가 업로드한 파일 객체
 * @returns 파싱된 데이터 행(DataRow)들의 배열을 반환하는 Promise
 */
export async function parseFile(file: File): Promise<DataRow[]> {
    return new Promise((resolve, reject) => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        // 1. CSV 파일 처리
        if (fileExtension === 'csv') {
            Papa.parse(file, {
                header: true,          // 첫 줄을 헤더로 인식
                skipEmptyLines: true,  // 빈 줄 건너뛰기
                complete: (results) => {
                    resolve(results.data as DataRow[]);
                },
                error: (error) => {
                    reject(error);
                },
            });
        }
        // 2. Excel 파일 처리 (xlsx, xls)
        else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0]; // 첫 번째 시트만 사용
                    const sheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(sheet);
                    resolve(json as DataRow[]);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        }
        // 3. 지원하지 않는 형식
        else {
            reject(new Error('Unsupported file type'));
        }
    });
}
