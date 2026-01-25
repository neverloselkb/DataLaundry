import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DataIssue, ProcessingOptions } from '@/types';

interface AnalysisReportProps {
    issues: DataIssue[];
    showAllIssues: boolean;
    setShowAllIssues: (show: boolean) => void;
    filterIssue: DataIssue | null;
    setFilterIssue: (issue: DataIssue | null) => void;
    onApplySuggestion: (issue: DataIssue) => void;
    onOpenFixModal: (issue: DataIssue) => void;
}

/**
 * 데이터 분석 리포트 컴포넌트
 * 발견된 데이터 이슈 목록을 보여주고, 필터링하거나 해결 제안을 적용할 수 있는 기능을 제공합니다.
 * 
 * @param issues 발견된 이슈 배열
 * @param showAllIssues 모든 이슈 보기 여부 (토글)
 * @param setShowAllIssues 모든 이슈 보기 상태 변경 함수
 * @param filterIssue 현재 필터링 중인 이슈
 * @param setFilterIssue 필터링 이슈 설정 함수
 * @param onApplySuggestion 이슈의 제안(Suggestion) 적용 핸들러
 * @param onOpenFixModal 일괄 수정 모달 열기 핸들러
 */
export function AnalysisReport({
    issues,
    showAllIssues,
    setShowAllIssues,
    filterIssue,
    setFilterIssue,
    onApplySuggestion,
    onOpenFixModal
}: AnalysisReportProps) {
    if (issues.length === 0) return null;

    return (
        <Card className="border-amber-200 bg-amber-50 shadow-sm animate-in fade-in slide-in-from-bottom-5">
            <CardHeader className="pb-3">
                <CardTitle className="text-base text-amber-800 flex items-center gap-2">
                    <AlertCircle size={18} />
                    데이터 분석 리포트
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {(showAllIssues ? issues : issues.slice(0, 3)).map((issue, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-3 rounded-md border border-amber-100 shadow-sm text-sm gap-3">
                        <div className="text-amber-900 flex-1">
                            <span className="font-bold text-amber-700 block mb-1">⚠️ {issue.column}</span>
                            {issue.message}
                        </div>
                        <div className="flex items-center gap-1 w-full sm:w-auto shrink-0 justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-50">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 h-8 px-2 whitespace-nowrap text-xs font-bold"
                                onClick={() => {
                                    if (issue.fixType === 'maxLength') {
                                        onOpenFixModal(issue);
                                    } else {
                                        onApplySuggestion(issue);
                                    }
                                }}
                            >
                                {issue.fixType === 'maxLength' ? '수정하기' : (issue.promptSuggestion ? '정제 제안' : '옵션 적용')}
                            </Button>

                            {issue.affectedRows && issue.affectedRows.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-8 px-2 whitespace-nowrap text-xs",
                                        filterIssue === issue
                                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                            : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                    )}
                                    onClick={() => setFilterIssue(filterIssue === issue ? null : issue)}
                                    title={filterIssue === issue ? "전체 보기" : "이 문제만 보기"}
                                >
                                    {filterIssue === issue ? <EyeOff size={16} /> : <Eye size={16} />}
                                    <span className="ml-1 sm:hidden">보기</span>
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
                {issues.length > 3 && (
                    <div
                        className="text-center text-xs text-amber-600 font-medium cursor-pointer hover:underline py-1"
                        onClick={() => setShowAllIssues(!showAllIssues)}
                    >
                        {showAllIssues ? "간단히 보기" : `+ ${issues.length - 3}개의 이슈가 더 발견되었습니다.`}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
