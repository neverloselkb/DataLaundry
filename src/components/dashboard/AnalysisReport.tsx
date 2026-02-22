import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DataIssue } from '@/types';

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
 * 데이터 분석 리포트 — Industrial 다크 테마
 * 왜 이런 디자인: 공장 경보 패널처럼 이슈를 시각적으로 강조
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
        <div className="card-industrial border-l-4 border-l-[var(--laundry-accent)] animate-in fade-in slide-in-from-bottom-5">
            {/* 헤더 */}
            <div className="px-5 py-3 border-b border-[var(--laundry-border)]">
                <div className="text-sm font-bold flex items-center gap-2 text-[var(--laundry-accent)]">
                    <AlertCircle size={16} />
                    데이터 분석 리포트
                    <span className="text-[10px] bg-[var(--laundry-accent-glow)] text-[var(--laundry-accent)] px-1.5 py-0.5 rounded font-mono">
                        {issues.length}건
                    </span>
                </div>
            </div>

            {/* 이슈 목록 */}
            <div className="p-5 space-y-3">
                {(showAllIssues ? issues : issues.slice(0, 3)).map((issue, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[var(--laundry-bg)] p-3 rounded border border-[var(--laundry-border)] text-sm gap-3">
                        <div className="text-[var(--laundry-muted)] flex-1">
                            <span className="font-bold text-[var(--laundry-accent)] block mb-1">⚠️ {issue.column}</span>
                            {issue.message}
                        </div>
                        <div className="flex items-center gap-1 w-full sm:w-auto shrink-0 justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--laundry-border)]">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[var(--laundry-accent)] hover:text-[var(--laundry-accent-hover)] hover:bg-[var(--laundry-accent-glow)] h-8 px-2 whitespace-nowrap text-xs font-bold"
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
                                            ? "bg-[var(--laundry-accent-glow)] text-[var(--laundry-accent)]"
                                            : "text-[var(--laundry-subtle)] hover:text-[var(--laundry-accent)] hover:bg-[var(--laundry-accent-glow)]"
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
                        className="text-center text-xs text-[var(--laundry-accent)] font-medium cursor-pointer hover:underline py-1"
                        onClick={() => setShowAllIssues(!showAllIssues)}
                    >
                        {showAllIssues ? "간단히 보기" : `+ ${issues.length - 3}개의 이슈가 더 발견되었습니다.`}
                    </div>
                )}
            </div>
        </div>
    );
}
