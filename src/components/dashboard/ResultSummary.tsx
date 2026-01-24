import { FileBarChart, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DataIssue, ProcessingStats } from '@/types';
import { detectDataIssues } from '@/lib/core/analyzers';
import { DataRow } from '@/types';

interface ResultSummaryProps {
    stats: ProcessingStats;
    initialStats: ProcessingStats | null; // [NEW]
    issues: DataIssue[];
    processedData: DataRow[];
    setIssues: (issues: DataIssue[]) => void;
}

/**
 * 데이터 정제 결과 요약 리포트 컴포넌트
 * 데이터 건강 점수, 완결성 등을 시각적 게이지와 차트로 보여줍니다.
 */
export function ResultSummary({ stats, initialStats, issues, processedData, setIssues }: ResultSummaryProps) {
    const handleRefresh = () => {
        setIssues(detectDataIssues(processedData));
    };

    // 건강도 점수에 따른 테마 색상 결정
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-500 stroke-emerald-500';
        if (score >= 70) return 'text-blue-500 stroke-blue-500';
        if (score >= 40) return 'text-amber-500 stroke-amber-500';
        return 'text-rose-500 stroke-rose-500';
    };

    const currentScore = stats.qualityScore || 0;
    const prevScore = initialStats?.qualityScore || 0;
    const scoreDiff = currentScore - prevScore;

    return (
        <Card className="border-slate-200 shadow-sm border-l-4 border-l-blue-500 overflow-hidden animation-fade-in">
            <CardHeader className="pb-2 bg-blue-50/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-800">
                        <FileBarChart size={16} />
                        데이터 품질 대시보드
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-blue-400 hover:text-blue-600 hover:bg-blue-100"
                        onClick={handleRefresh}
                        title="리포트 새로고침"
                    >
                        <RefreshCw size={12} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {/* 1. 메인 건강도 게이지 */}
                <div className="flex flex-col items-center justify-center py-2">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-slate-100"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
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
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Health</span>
                        </div>
                    </div>
                    {initialStats && scoreDiff > 0 && (
                        <div className="mt-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 animate-bounce">
                            세탁 후 점수 {scoreDiff}pt 상승! ✨
                        </div>
                    )}
                </div>

                {/* 2. 상세 지표 프로그레스 */}
                <div className="space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-500">완결성 (Completeness)</span>
                            <span className="text-slate-700">{stats.completeness}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-1000"
                                style={{ width: `${stats.completeness}%` }}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-500">유효성 (Validity)</span>
                            <span className="text-slate-700">{stats.validity}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-1000"
                                style={{ width: `${stats.validity}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. 정제 통계 그리드 */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                        <div className="text-[9px] text-slate-400 uppercase font-black mb-0.5">정제된 셀</div>
                        <div className="text-base font-bold text-slate-700">{stats.changedCells}</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                        <div className="text-[9px] text-slate-400 uppercase font-black mb-0.5">해결된 이슈</div>
                        <div className="text-base font-bold text-green-600">{stats.resolvedIssues}</div>
                    </div>
                </div>

                {issues.length > 0 ? (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
                        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-amber-800 leading-relaxed font-medium">
                            아직 <strong>{issues.length}개</strong>의 오염 데이터가 발견되었습니다. 추가 정제를 진행해 보세요.
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex gap-2">
                        <Sparkles size={16} className="text-green-500 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-green-800 leading-relaxed font-medium">
                            완벽하게 세탁되었습니다! 모든 데이터가 표준 형식을 갖추고 있습니다.
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
