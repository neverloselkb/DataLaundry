import { useState, useRef, useEffect, useCallback } from 'react';
import { DataRow, DataIssue, ProcessingOptions, ProcessingStats, ColumnLimits } from '@/types';
import { parseFile } from '@/lib/core/parsers';
import { detectDataIssues } from '@/lib/core/analyzers';
import { WorkerMessage, WorkerResponse } from '@/lib/worker';

/**
 * 데이터 흐름 및 상태 관리를 위한 핵심 커스텀 훅
 * 파일 로드, 데이터 저장, Web Worker 통신, 통계 및 이슈 관리를 담당합니다.
 */
export function useDataFlow() {
    // 1. Core Data State
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<DataRow[]>([]); // 원본 (파싱 직후 상태)
    const [processedData, setProcessedData] = useState<DataRow[]>([]); // 정제된 데이터 (화면 표시용)
    const [headers, setHeaders] = useState<string[]>([]);

    // 2. Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState("");
    const [error, setError] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);

    // 3. Analysis State
    const [issues, setIssues] = useState<DataIssue[]>([]);
    const [stats, setStats] = useState<ProcessingStats>({ totalRows: 0, changedCells: 0, resolvedIssues: 0 });

    // 4. Configuration State
    const [lockedColumns, setLockedColumns] = useState<string[]>([]);
    const [columnLimits, setColumnLimits] = useState<ColumnLimits>({});

    // Worker 초기화
    useEffect(() => {
        workerRef.current = new Worker(new URL('../lib/worker.ts', import.meta.url));

        workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const { type } = e.data;

            if (type === 'PROGRESS') {
                // @ts-ignore
                const { progress, message } = e.data;
                setProgress(progress);
                setProgressMessage(message);
            }
            else if (type === 'COMPLETE') {
                // @ts-ignore
                const { processedData: resultData, issues: resultIssues, stats: resultStats } = e.data;
                setProcessedData(resultData);
                setIssues(resultIssues);
                setStats(resultStats);
                setIsProcessing(false);
                setProgress(100);
                setProgressMessage("완료되었습니다.");
            }
            else if (type === 'ERROR') {
                // @ts-ignore
                setError(e.data.error);
                setIsProcessing(false);
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    // 파일 선택 및 파싱 핸들러
    const handleFileSelect = useCallback(async (selectedFile: File) => {
        setFile(selectedFile);
        setIsProcessing(true);
        setError(null);
        setProgress(10);
        setProgressMessage("파일 읽는 중...");

        try {
            const parsedData = await parseFile(selectedFile);
            if (parsedData.length === 0) throw new Error("데이터가 비어있습니다.");

            const initialHeaders = Object.keys(parsedData[0]);
            setData(parsedData);
            setHeaders(initialHeaders);
            setProcessedData(parsedData); // 초기엔 원본 = 정제본

            // 초기 이슈 감지
            const initialIssues = detectDataIssues(parsedData);
            setIssues(initialIssues);
            setStats({ totalRows: parsedData.length, changedCells: 0, resolvedIssues: 0 });

        } catch (err) {
            setError(String(err));
            setFile(null);
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    }, []);

    // 정제 프로세스 시작 (Worker 호출)
    const startProcessing = useCallback((prompt: string, options: ProcessingOptions) => {
        if (!workerRef.current || data.length === 0) return;

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        const message: WorkerMessage = {
            type: 'PROCESS',
            data: data, // 항상 원본 기준으로 재처리 (누적 처리를 원하면 processedData 사용 고려) -> 보통 리셋 후 재처리가 안전
            prompt,
            options,
            lockedColumns,
            columnLimits
        };

        workerRef.current.postMessage(message);
    }, [data, lockedColumns, columnLimits]); // data가 바뀌면 의존성 변경

    // 데이터 직접 수정 핸들러 (Cell Edit)
    const updateCell = useCallback((rowIdx: number, col: string, newVal: string) => {
        setProcessedData(prev => {
            const newData = [...prev];
            if (newData[rowIdx]) {
                newData[rowIdx] = { ...newData[rowIdx], [col]: newVal };
            }
            return newData;
        });
        // TODO: 수정 후 이슈 재검사 또는 통계 업데이트 로직이 필요할 수 있음 (선택적)
    }, []);

    // 헤더 이름 수정 핸들러
    const updateHeader = useCallback((oldName: string, newName: string) => {
        if (oldName === newName) return;

        // 1. 헤더 목록 업데이트
        setHeaders(prev => prev.map(h => h === oldName ? newName : h));

        // 2. 데이터 내 키 변경
        const renameKey = (rows: DataRow[]) => rows.map(row => {
            const newRow: DataRow = {};
            Object.keys(row).forEach(key => {
                newRow[key === oldName ? newName : key] = row[key];
            });
            return newRow;
        });

        setData(prev => renameKey(prev));
        setProcessedData(prev => renameKey(prev));

        // 3. 관련 상태 업데이트 (Lock, Limits)
        setLockedColumns(prev => prev.map(c => c === oldName ? newName : c));
        setColumnLimits(prev => {
            const newLimits = { ...prev };
            if (newLimits[oldName]) {
                newLimits[newName] = newLimits[oldName];
                delete newLimits[oldName];
            }
            return newLimits;
        });
    }, []);

    // 컬럼 잠금 토글
    const toggleLock = useCallback((col: string) => {
        setLockedColumns(prev =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    }, []);

    // 컬럼 길이 제한 설정
    const updateColumnLimit = useCallback((col: string, limit: number) => {
        setColumnLimits(prev => ({ ...prev, [col]: limit }));
        // 길이 제한 변경 시 즉시 이슈 재검사 필요?
        // 보통 UI에서 onBlur 시점에 detectDataIssues를 호출하여 이슈를 업데이트함.
        // 여기서는 상태만 업데이트하고 호출측에서 이슈 갱신을 트리거하도록 하거나,
        // useEffect로 감지할 수 있음. (이슈 감지는 동기 함수이므로 여기서 바로 실행 가능)

        // 비동기 상태 업데이트 이슈를 피하기 위해 함수형 업데이트 내에서 처리가 어려움.
        // 훅 사용자(Component)가 setIssues를 호출하도록 유도하거나, 여기서 effect를 사용.
    }, []);

    return {
        file,
        data,              // Original
        processedData,     // Current View
        headers,
        isProcessing,
        progress,
        progressMessage,
        error,
        issues,
        stats,
        lockedColumns,
        columnLimits,
        setIssues,         // 외부에서 이슈 업데이트 필요 시
        setColumnLimits,
        handleFileSelect,
        startProcessing,
        updateCell,
        updateHeader,
        toggleLock,
        updateColumnLimit,
        setError
    };
}
