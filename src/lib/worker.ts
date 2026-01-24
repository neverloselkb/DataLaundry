import { DataRow, ProcessingOptions, ColumnSpecificOptions } from '@/types';
import { processDataLocal, applyColumnOptions, restoreLockedColumns } from './core/processors';
import { detectDataIssues, calculateDiffStats } from './core/analyzers';

// Worker 메시지 타입 정의
export type WorkerMessage =
    | { type: 'PROCESS', data: DataRow[], prompt: string, options: ProcessingOptions, lockedColumns: string[], columnLimits: Record<string, number>, columnOptions: ColumnSpecificOptions };

// Worker 응답 타입 정의
export type WorkerResponse =
    | { type: 'PROGRESS', progress: number, message: string }
    | { type: 'COMPLETE', processedData: DataRow[], issues: any[], stats: any }
    | { type: 'ERROR', error: string };

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { type, data, prompt, options, lockedColumns, columnLimits, columnOptions } = e.data;

    if (type === 'PROCESS') {
        try {
            // 원본 데이터 백업 (잠금 복구용 - worker에 전달된 시점의 상태)
            const originalDataBackup = data;
            // =================================================================================
            // [Local Engine] Unified Priority Engine
            // Order: Lock > Column Option > NLP > Checkbox
            // =================================================================================
            self.postMessage({ type: 'PROGRESS', progress: 50, message: '⚡ 로컬 엔진으로 5대 원칙 기반 정제 중...' });

            // 모든 위계 질서가 내부에서 처리됨 (Rule 1~5)
            const currentData = processDataLocal(data, prompt, options, lockedColumns, columnOptions);

            // Step 3: Issue Detection (Completed)
            self.postMessage({ type: 'PROGRESS', progress: 95, message: '최종 리포트 생성 중...' });
            const currentIssues = detectDataIssues(currentData, columnLimits, options);
            const originalIssues = detectDataIssues(data, columnLimits, options);
            const stats = calculateDiffStats(data, currentData, originalIssues.length, currentIssues.length);

            // Step 5: Complete
            self.postMessage({
                type: 'COMPLETE',
                processedData: currentData,
                issues: currentIssues,
                stats: stats
            });

        } catch (err: any) {
            self.postMessage({ type: 'ERROR', error: err.message || String(err) });
        }
    }
};
