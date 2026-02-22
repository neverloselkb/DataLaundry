import { useRef, useEffect, useState } from 'react';
import { FileSpreadsheet, AlertCircle, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { estimatePerformance } from '@/lib/core/performance';

// 데이터세탁소 업로드 섹션 — Industrial 다크 + 빨래줄 일러스트
// 왜 이런 디자인: "세탁물 투입구"처럼, 데이터를 넣는 행위를 직관적으로 표현

interface UploadSectionProps {
    file: File | null;
    isDragging: boolean;
    error: string | null;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// 빨래줄 SVG — 데이터 시트가 빨래집게에 걸린 일러스트
function ClotheslineSVG() {
    return (
        <svg width="240" height="100" viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 opacity-60">
            {/* 빨래줄 */}
            <path d="M10 20 Q60 35, 120 22 Q180 10, 230 25" stroke="var(--laundry-subtle)" strokeWidth="1.5" strokeLinecap="round" fill="none" />

            {/* 빨래집게 1 + 데이터 시트 */}
            <g transform="translate(45, 22)">
                <rect x="-2" y="-4" width="4" height="8" rx="1" fill="var(--laundry-accent)" />
                <rect x="-14" y="6" width="28" height="36" rx="2" fill="var(--laundry-surface)" stroke="var(--laundry-border)" strokeWidth="1" />
                <line x1="-8" y1="14" x2="8" y2="14" stroke="var(--laundry-border-light)" strokeWidth="1" />
                <line x1="-8" y1="20" x2="8" y2="20" stroke="var(--laundry-border-light)" strokeWidth="1" />
                <line x1="-8" y1="26" x2="4" y2="26" stroke="var(--laundry-border-light)" strokeWidth="1" />
                <line x1="-8" y1="32" x2="6" y2="32" stroke="var(--laundry-border-light)" strokeWidth="1" />
                <text x="-8" y="12" fontSize="5" fill="var(--laundry-accent)" fontFamily="monospace">CSV</text>
            </g>

            {/* 빨래집게 2 + 데이터 시트 */}
            <g transform="translate(120, 18)">
                <rect x="-2" y="-4" width="4" height="8" rx="1" fill="var(--laundry-accent)" />
                <rect x="-14" y="6" width="28" height="40" rx="2" fill="var(--laundry-surface)" stroke="var(--laundry-border)" strokeWidth="1" />
                <line x1="-8" y1="14" x2="8" y2="14" stroke="var(--laundry-border-light)" strokeWidth="1" />
                <line x1="-8" y1="20" x2="8" y2="20" stroke="var(--laundry-border-light)" strokeWidth="1" />
                <line x1="-8" y1="26" x2="8" y2="26" stroke="var(--laundry-border-light)" strokeWidth="1" />
                <line x1="-8" y1="32" x2="4" y2="32" stroke="var(--laundry-border-light)" strokeWidth="1" />
                <line x1="-8" y1="38" x2="6" y2="38" stroke="var(--laundry-border-light)" strokeWidth="1" />
                <text x="-8" y="12" fontSize="5" fill="var(--laundry-success)" fontFamily="monospace">XLS</text>
            </g>

            {/* 빨래집게 3 + 데이터 시트 (기울어짐) */}
            <g transform="translate(190, 24) rotate(3)">
                <rect x="-2" y="-4" width="4" height="8" rx="1" fill="var(--laundry-accent)" />
                <rect x="-12" y="6" width="24" height="32" rx="2" fill="var(--laundry-surface)" stroke="var(--laundry-border)" strokeWidth="1" />
                <line x1="-6" y1="14" x2="6" y2="14" stroke="var(--laundry-border-light)" strokeWidth="1" />
                <line x1="-6" y1="20" x2="6" y2="20" stroke="var(--laundry-border-light)" strokeWidth="1" />
                <line x1="-6" y1="26" x2="2" y2="26" stroke="var(--laundry-border-light)" strokeWidth="1" />
                <text x="-6" y="12" fontSize="5" fill="var(--laundry-info)" fontFamily="monospace">DAT</text>
            </g>

            {/* 물방울 */}
            <circle cx="85" cy="75" r="2" fill="var(--laundry-info)" opacity="0.3" />
            <circle cx="155" cy="80" r="1.5" fill="var(--laundry-info)" opacity="0.2" />
        </svg>
    );
}

export function UploadSection({
    file,
    isDragging,
    error,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect
}: UploadSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [perf, setPerf] = useState<{ tier: string, recommendedRows: number, memoryGB?: number } | null>(null);

    useEffect(() => {
        const result = estimatePerformance();
        setPerf(result);
    }, []);

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="card-industrial p-0 overflow-hidden">
            {/* 섹션 헤더 — 공장 패널 라벨 */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--laundry-border)]">
                <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 bg-[var(--laundry-accent)] text-[var(--laundry-bg)] rounded flex items-center justify-center text-[10px] font-bold">1</span>
                    <span className="section-label">데이터 투입</span>
                </div>

                {/* PC 성능 뱃지 */}
                {perf && (
                    <div
                        className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-[var(--laundry-bg)] border border-[var(--laundry-border)] rounded text-[10px] font-mono cursor-help"
                        title={perf.memoryGB && perf.memoryGB >= 8
                            ? "💡 실제 8GB 이상의 램을 보유하고 있다면, 표시된 권장량보다 훨씬 더 많은 데이터도 충분히 처리 가능합니다."
                            : "현재 브라우저 환경에서 쾌적하게 처리할 수 있는 권장 데이터 규모입니다."}
                    >
                        <span className={cn(
                            "status-dot",
                            perf.tier === 'High' ? "status-dot-active" :
                                perf.tier === 'Low' ? "status-dot-warning" : "status-dot-active"
                        )} />
                        <span className="text-[var(--laundry-muted)]">
                            <Cpu size={10} className="inline mr-1" />
                            ~{(perf.recommendedRows / 10000).toFixed(0)}만행
                            {perf.memoryGB && <span className="text-[var(--laundry-subtle)]"> / {perf.memoryGB >= 8 ? "8G+" : `${perf.memoryGB}G`}</span>}
                        </span>
                    </div>
                )}
            </div>

            {/* 드래그 & 드롭 영역 */}
            <div className="p-5">
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={triggerFileInput}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
                        isDragging
                            ? "border-[var(--laundry-accent)] bg-[var(--laundry-accent-glow)]"
                            : "border-[var(--laundry-border)] hover:border-[var(--laundry-accent)] hover:bg-[var(--laundry-elevated)]",
                        file ? "bg-[var(--laundry-elevated)] border-[var(--laundry-success)]/30" : ""
                    )}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".csv, .xlsx, .xls"
                        onChange={onFileSelect}
                    />
                    {file ? (
                        <div className="flex flex-col items-center gap-2">
                            <FileSpreadsheet size={28} className="text-[var(--laundry-success)]" />
                            <div className="font-semibold text-sm text-[var(--laundry-text)]">{file.name}</div>
                            <div className="text-xs font-mono text-[var(--laundry-muted)]">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            {/* 빨래줄 일러스트 */}
                            <ClotheslineSVG />
                            <div className="font-semibold text-sm text-[var(--laundry-muted)]">
                                파일을 드래그하거나 <span className="text-[var(--laundry-accent)]">클릭</span>하세요
                            </div>
                            <div className="text-xs font-mono text-[var(--laundry-subtle)]">CSV, XLSX, XLS 지원</div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-[var(--laundry-danger)]/10 border border-[var(--laundry-danger)]/20 text-[var(--laundry-danger)] text-sm rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
