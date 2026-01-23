import { DataRow, ProcessingOptions, ColumnSpecificOptions } from '@/types';
import { processDataLocal } from './core/processors';
import { detectDataIssues, calculateDiffStats } from './core/analyzers';

// Worker 메시지 타입 정의
export type WorkerMessage =
    | { type: 'PROCESS', data: DataRow[], prompt: string, options: ProcessingOptions, lockedColumns: string[], columnLimits: Record<string, number>, columnOptions: ColumnSpecificOptions };

// Worker 응답 타입 정의
export type WorkerResponse =
    | { type: 'PROGRESS', progress: number, message: string }
    | { type: 'COMPLETE', processedData: DataRow[], issues: any[], stats: any }
    | { type: 'ERROR', error: string };

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { type, data, prompt, options, lockedColumns, columnLimits, columnOptions } = e.data;

    if (type === 'PROCESS') {
        try {
            // Step 1: Start Processing
            self.postMessage({ type: 'PROGRESS', progress: 10, message: '데이터 분석 중...' });

            // Step 2: Main Processing Logic (30%)
            self.postMessage({ type: 'PROGRESS', progress: 30, message: '데이터 정제 엔진 가동 중...' });
            const processedData = processDataLocal(data, prompt, options, lockedColumns, columnOptions);

            // Step 3: Issue Detection (70%)
            self.postMessage({ type: 'PROGRESS', progress: 70, message: '데이터 무결성 검사 및 이슈 진단 중...' });
            const currentIssues = detectDataIssues(processedData, columnLimits, options);

            // Step 4: Stats Calculation (90%)
            self.postMessage({ type: 'PROGRESS', progress: 90, message: '최종 리포트 생성 중...' });
            const originalIssues = detectDataIssues(data, columnLimits, options);
            const stats = calculateDiffStats(data, processedData, originalIssues.length, currentIssues.length);

            // Step 5: Complete
            self.postMessage({
                type: 'COMPLETE',
                processedData,
                issues: currentIssues,
                stats
            });

        } catch (err) {
            self.postMessage({ type: 'ERROR', error: String(err) });
        }
    }
};
