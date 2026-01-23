import { Loader2 } from 'lucide-react';

interface ProcessingStatusProps {
    progress: number;
    message: string;
}

/**
 * 데이터 정제 진행 상황을 표시하는 컴포넌트
 * 프로그레스 바와 현재 작업 상태 메시지를 렌더링합니다.
 * 
 * @param progress 현재 진행률 (0-100)
 * @param message 현재 진행 중인 작업에 대한 설명 메시지
 */
export function ProcessingStatus({ progress, message }: ProcessingStatusProps) {
    return (
        <div className="w-full space-y-3 p-4 bg-blue-50/50 rounded-lg animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between text-sm text-blue-700 font-medium mb-1">
                <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>{message || '처리 준비 중...'}</span>
                </div>
                <span className="font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-blue-200 rounded-full overflow-hidden w-full">
                <div
                    className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                    style={{ width: `${Math.max(5, progress)}%` }}
                />
            </div>
            <div className="text-xs text-blue-400 text-center pt-1">
                Tip: 작업 중에도 다른 탭을 보거나 업무를 보실 수 있습니다.
            </div>
        </div>
    );
}
