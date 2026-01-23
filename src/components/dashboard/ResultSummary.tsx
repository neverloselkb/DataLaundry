import { Bot, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DataIssue, ProcessingStats } from '@/types';
import { detectDataIssues } from '@/lib/core/analyzers';
import { DataRow } from '@/types';

interface ResultSummaryProps {
    stats: ProcessingStats;
    issues: DataIssue[];
    processedData: DataRow[];
    setIssues: (issues: DataIssue[]) => void;
}

/**
 * 데이터 정제 결과 요약 리포트 컴포넌트
 * 데이터 건강 점수, 정제된 셀 수, 해결된 이슈 수 등을 카드 형태로 보여줍니다.
 * 
 * @param stats 정제 통계 정보
 * @param issues 현재 남아있는 데이터 이슈 목록
 * @param processedData 정제된 데이터 배열 (이슈 재진단용)
 * @param setIssues 이슈 목록 업데이트 함수
 */
export function ResultSummary({ stats, issues, processedData, setIssues }: ResultSummaryProps) {
    const handleRefresh = () => {
        // 현재 데이터에 대해 이슈를 다시 감지
        setIssues(detectDataIssues(processedData));
    };

    return (
        <Card className="border-slate-200 shadow-sm border-l-4 border-l-blue-500 overflow-hidden">
            <CardHeader className="pb-2 bg-blue-50/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-800">
                        <Bot size={16} />
                        데이터 정제 리포트
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
            <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">데이터 건강 점수</div>
                    <div className="text-xl font-bold text-blue-600">
                        {issues.length === 0 ? '100%' : `${Math.max(0, 100 - issues.length * 10)}%`}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">정제된 셀</div>
                        <div className="text-lg font-bold text-slate-700">{stats.changedCells}건</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">해결된 이슈</div>
                        <div className="text-lg font-bold text-green-600">{stats.resolvedIssues}건</div>
                    </div>
                </div>

                {issues.length > 0 ? (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
                        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800 leading-relaxed">
                            아직 <strong>{issues.length}개</strong>의 잠재적 이슈가 남아있습니다. 추가 정제가 필요할 수 있습니다.
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex gap-2">
                        <Sparkles size={16} className="text-green-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-green-800 leading-relaxed">
                            모든 데이터 이슈가 해결되었습니다! 원본 데이터가 완벽하게 정제되었습니다.
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
