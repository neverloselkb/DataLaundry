import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DownloadSectionProps {
    handleDownload: () => void;
    rowCount: number;
}

/**
 * 정제 결과 다운로드 섹션 — Industrial 다크 테마
 * 왜 이런 디자인: "작업 완료" 상태를 공장 계기판의 완료 신호처럼 표시
 */
export function DownloadSection({ handleDownload, rowCount }: DownloadSectionProps) {
    if (rowCount === 0) return null;

    return (
        <div className="card-industrial border-l-4 border-l-[var(--laundry-success)] animate-in fade-in slide-in-from-bottom-5">
            <div className="p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="font-semibold text-[var(--laundry-success)]">✅ 세탁 완료!</div>
                    <div className="text-xs text-[var(--laundry-muted)] bg-[var(--laundry-bg)] px-2 py-1 rounded border border-[var(--laundry-border)] font-mono">
                        {rowCount} rows
                    </div>
                </div>
                <Button
                    onClick={handleDownload}
                    className="w-full bg-[var(--laundry-accent)] hover:bg-[var(--laundry-accent-hover)] text-[var(--laundry-bg)] font-bold h-10 glow-amber transition-colors"
                >
                    <Download size={16} className="mr-2" />
                    결과 파일 다운로드
                </Button>
            </div>
        </div>
    );
}
