import { FileBarChart, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DataIssue, ProcessingStats } from '@/types';
import { detectDataIssues } from '@/lib/core/analyzers';
import { DataRow } from '@/types';

interface ResultSummaryProps {
    stats: ProcessingStats;
    initialStats: ProcessingStats | null;
    issues: DataIssue[];
    processedData: DataRow[];
    setIssues: (issues: DataIssue[]) => void;
}

/**
 * 데이터 정제 결과 요약 리포트 컴포넌트
 * Industrial 다크 테마: 계기판 스타일의 건강도 게이지와 진행 바
 */
export function ResultSummary({ stats, initialStats, issues, processedData, setIssues }: ResultSummaryProps) {
    const handleRefresh = () => {
        setIssues(detectDataIssues(processedData));
    };

    // 건강도 점수에 따른 색상 — 다크 배경에서도 잘 보이는 밝은 색
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-400 stroke-emerald-400';
        if (score >= 70) return 'text-[var(--laundry-info)] stroke-[var(--laundry-info)]';
        if (score >= 40) return 'text-[var(--laundry-accent)] stroke-[var(--laundry-accent)]';
        return 'text-[var(--laundry-danger)] stroke-[var(--laundry-danger)]';
    };

    const currentScore = stats.qualityScore || 0;
    const prevScore = initialStats?.qualityScore || 0;
    const scoreDiff = currentScore - prevScore;

    return (
        <div className="card-industrial border-l-4 border-l-[var(--laundry-accent)] overflow-hidden animation-fade-in">
            {/* 헤더 — 패널 라벨 */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--laundry-border)]">
                <div className="text-sm font-bold flex items-center gap-2 text-[var(--laundry-accent)]">
                    <FileBarChart size={16} />
                    데이터 품질 대시보드
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-[var(--laundry-subtle)] hover:text-[var(--laundry-accent)] hover:bg-[var(--laundry-accent-glow)]"
                    onClick={handleRefresh}
                    title="리포트 새로고침"
                >
                    <RefreshCw size={12} />
                </Button>
            </div>

            <div className="p-5 space-y-6">
                {/* 1. 메인 건강도 게이지 — 계기판 스타일 */}
                <div className="flex flex-col items-center justify-center py-2">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64" cy="64" r="58"
                                stroke="currentColor" strokeWidth="8"
                                fill="transparent"
                                className="text-[var(--laundry-border)]"
                            />
                            <circle
                                cx="64" cy="64" r="58"
                                stroke="currentColor" strokeWidth="8"
                                strokeDasharray={364.4}
                                strokeDashoffset={364.4 - (364.4 * currentScore) / 100}
                                strokeLinecap="round"
                                fill="transparent"
                                className={cn("transition-all duration-1000 ease-out", getScoreColor(currentScore).split(' ')[1])}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={cn("text-3xl font-black tracking-tighter", getScoreColor(currentScore).split(' ')[0])}>
                                {currentScore}<span className="text-sm font-normal">%</span>
                            </span>
                            <span className="text-[10px] text-[var(--laundry-subtle)] font-bold uppercase tracking-widest font-mono">Health</span>
                        </div>
                    </div>
                    {initialStats && scoreDiff > 0 && (
                        <div className="mt-2 text-[11px] font-bold text-[var(--laundry-success)] bg-[var(--laundry-success)]/10 px-2 py-0.5 rounded border border-[var(--laundry-success)]/20 animate-bounce">
                            세탁 후 점수 {scoreDiff}pt 상승! ✨
                        </div>
                    )}
                </div>

                {/* 2. 상세 지표 프로그레스 */}
                <div className="space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-[var(--laundry-muted)]">완결성 (Completeness)</span>
                            <span className="text-[var(--laundry-text)] font-mono">{stats.completeness}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--laundry-border)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--laundry-info)] transition-all duration-1000"
                                style={{ width: `${stats.completeness}%` }}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-[var(--laundry-muted)]">유효성 (Validity)</span>
                            <span className="text-[var(--laundry-text)] font-mono">{stats.validity}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--laundry-border)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--laundry-success)] transition-all duration-1000"
                                style={{ width: `${stats.validity}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. 정제 통계 그리드 */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[var(--laundry-bg)] p-2 rounded border border-[var(--laundry-border)] text-center">
                        <div className="text-[9px] text-[var(--laundry-subtle)] uppercase font-black mb-0.5 font-mono">정제된 셀</div>
                        <div className="text-base font-bold text-[var(--laundry-text)] font-mono">{stats.changedCells}</div>
                    </div>
                    <div className="bg-[var(--laundry-bg)] p-2 rounded border border-[var(--laundry-border)] text-center">
                        <div className="text-[9px] text-[var(--laundry-subtle)] uppercase font-black mb-0.5 font-mono">해결된 이슈</div>
                        <div className="text-base font-bold text-[var(--laundry-success)] font-mono">{stats.resolvedIssues}</div>
                    </div>
                </div>

                {/* 4. 상태 메시지 */}
                {issues.length > 0 ? (
                    <div className="p-3 bg-[var(--laundry-accent-glow)] rounded border border-[var(--laundry-accent)]/20 flex gap-2">
                        <AlertCircle size={16} className="text-[var(--laundry-accent)] shrink-0 mt-0.5" />
                        <div className="text-[11px] text-[var(--laundry-accent)] leading-relaxed font-medium">
                            아직 <strong>{issues.length}개</strong>의 오염 데이터가 발견되었습니다. 추가 정제를 진행해 보세요.
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-[var(--laundry-success)]/10 rounded border border-[var(--laundry-success)]/20 flex gap-2">
                        <Sparkles size={16} className="text-[var(--laundry-success)] shrink-0 mt-0.5" />
                        <div className="text-[11px] text-[var(--laundry-success)] leading-relaxed font-medium">
                            완벽하게 세탁되었습니다! 모든 데이터가 표준 형식을 갖추고 있습니다.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
