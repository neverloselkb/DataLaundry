import { useState, useMemo } from 'react';
import { Lock, Unlock, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DataRow, DataIssue } from '@/types';
import { getHeaderRecommendations } from '@/lib/core/analyzers';

interface DataPreviewTableProps {
    processedData: DataRow[];
    originalData: DataRow[];
    headers: string[];
    lockedColumns: string[];
    toggleLock: (header: string) => void;
    columnLimits: Record<string, number>;
    onLimitChange: (header: string, limit: number) => void;
    onHeaderRename: (oldName: string, newName: string) => void;
    onCellUpdate: (rowIdx: number, col: string, value: string) => void;
    filterIssue: DataIssue | null;
}

/**
 * 데이터 미리보기 및 수정 테이블 컴포넌트
 * 페이지네이션, 셀 직접 수정, 헤더 수정, 삭제 잠금, 컬럼 길이 설정 등의 기능을 제공합니다.
 * 
 * @param processedData 정제된 데이터 배열
 * @param originalData 원본 데이터 배열 (변경 사항 비교용)
 * @param headers 현재 헤더 목록
 * @param lockedColumns 잠금 처리된 컬럼 목록
 * @param toggleLock 잠금 토글 핸들러
 * @param columnLimits 컬럼별 길이 제한 설정값
 * @param onLimitChange 길이 제한 변경 핸들러
 * @param onHeaderRename 헤더 이름 변경 핸들러
 * @param onCellUpdate 셀 데이터 수정 핸들러
 * @param filterIssue 필터링 중인 이슈 (필터링 시 해당 이슈가 있는 행만 표시)
 */
export function DataPreviewTable({
    processedData,
    originalData,
    headers,
    lockedColumns,
    toggleLock,
    columnLimits,
    onLimitChange,
    onHeaderRename,
    onCellUpdate,
    filterIssue
}: DataPreviewTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Local editing states
    const [editingHeader, setEditingHeader] = useState<string | null>(null);
    const [tempHeaderName, setTempHeaderName] = useState('');
    const [editingLength, setEditingLength] = useState<string | null>(null);
    const [editingCell, setEditingCell] = useState<{ rowIdx: number, col: string } | null>(null);

    // Pagination Logic
    const totalCount = filterIssue?.affectedRows ? filterIssue.affectedRows.length : processedData.length;
    const totalPages = Math.ceil(totalCount / rowsPerPage);

    // Reset page if filtered
    useMemo(() => {
        setCurrentPage(1);
    }, [filterIssue]);

    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentIndices = useMemo(() => {
        if (filterIssue?.affectedRows) {
            return filterIssue.affectedRows.slice(startIndex, startIndex + rowsPerPage);
        }
        return Array.from({ length: Math.min(rowsPerPage, totalCount - startIndex) }, (_, i) => startIndex + i);
    }, [currentPage, filterIssue, processedData.length, startIndex, rowsPerPage, totalCount]);

    const handleHeaderSaveInternal = (header: string, newName: string) => {
        onHeaderRename(header, newName);
        setEditingHeader(null);
    };

    return (
        <Card className="min-h-[600px] border-slate-200 shadow-sm overflow-hidden flex flex-col bg-white">
            {processedData.length > 0 ? (
                <>
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <TableRow className="bg-slate-50 border-b border-slate-200">
                                    {headers.map((header) => {
                                        const isLocked = lockedColumns.includes(header);
                                        return (
                                            <TableHead key={header} className="font-semibold text-slate-700 py-3 relative group overflow-visible min-w-[150px]">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        {editingHeader === header ? (
                                                            <div className="relative z-[110]">
                                                                <input
                                                                    type="text"
                                                                    className="w-full min-w-[120px] h-8 px-2 text-sm border-2 border-blue-500 rounded-md shadow-lg outline-none"
                                                                    value={tempHeaderName}
                                                                    autoFocus
                                                                    onChange={(e) => setTempHeaderName(e.target.value)}
                                                                    onBlur={() => handleHeaderSaveInternal(header, tempHeaderName)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleHeaderSaveInternal(header, tempHeaderName);
                                                                        if (e.key === 'Escape') setEditingHeader(null);
                                                                    }}
                                                                />
                                                                {/* Header Recommendations Popup */}
                                                                <div className="absolute top-full left-0 mt-1 bg-white border border-blue-100 rounded-lg shadow-xl p-2 min-w-[150px] animate-in slide-in-from-top-1 fadeIn duration-200 z-[120]">
                                                                    <div className="text-[10px] text-slate-400 mb-1.5 font-bold px-1 uppercase tracking-tight">추천 컬럼명</div>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {getHeaderRecommendations(processedData, header).map(rec => (
                                                                            <button
                                                                                key={rec}
                                                                                className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[11px] hover:bg-blue-600 hover:text-white transition-colors border border-blue-100"
                                                                                onMouseDown={(e) => {
                                                                                    e.preventDefault();
                                                                                    setTempHeaderName(rec);
                                                                                    handleHeaderSaveInternal(header, rec);
                                                                                }}
                                                                            >
                                                                                {rec}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span
                                                                className="cursor-pointer hover:text-blue-600 transition-colors py-1 select-none flex-1 truncate"
                                                                onDoubleClick={() => {
                                                                    setEditingHeader(header);
                                                                    setTempHeaderName(header);
                                                                }}
                                                                title="더블클릭하여 컬럼명 수정"
                                                            >
                                                                {header}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => toggleLock(header)}
                                                            className={cn(
                                                                "p-1 rounded-md transition-colors shrink-0",
                                                                isLocked ? "bg-red-50 text-red-500" : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                                                            )}
                                                            title={isLocked ? "잠금 해제" : "잠금 하기"}
                                                        >
                                                            {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                                                        </button>
                                                    </div>

                                                    {/* Max Length Config UI */}
                                                    <div className="flex items-center text-[10px] text-slate-400 font-normal">
                                                        Max:
                                                        {editingLength === header ? (
                                                            <input
                                                                type="number"
                                                                className="w-12 h-5 ml-1 pl-1 text-xs border border-blue-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                defaultValue={columnLimits[header] || 0}
                                                                autoFocus
                                                                onBlur={(e) => {
                                                                    const newVal = parseInt(e.target.value);
                                                                    if (!isNaN(newVal) && newVal > 0) {
                                                                        onLimitChange(header, newVal);
                                                                    }
                                                                    setEditingLength(null);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') e.currentTarget.blur();
                                                                }}
                                                            />
                                                        ) : (
                                                            <span
                                                                className="ml-1 cursor-pointer hover:text-blue-600 hover:underline decoration-dashed"
                                                                onClick={() => setEditingLength(header)}
                                                                title="클릭하여 최대 길이 제한 설정"
                                                            >
                                                                {columnLimits[header] || 'Auto'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentIndices.map((originalIdx) => {
                                    const row = processedData[originalIdx];
                                    const originalRow = originalData[originalIdx];
                                    if (!row) return null;

                                    return (
                                        <TableRow key={originalIdx} className="hover:bg-blue-50/30 transition-colors group/row">
                                            {headers.map((header) => {
                                                const isLocked = lockedColumns.includes(header);
                                                const processedVal = row[header]?.toString() || '';
                                                const originalVal = originalRow ? (originalRow[header]?.toString() || '') : '';
                                                const isModified = originalVal !== processedVal;

                                                return (
                                                    <TableCell
                                                        key={`${originalIdx}-${header}`}
                                                        className="whitespace-nowrap text-slate-600 py-3 relative group overflow-visible cursor-cell max-w-[200px]"
                                                        onDoubleClick={() => {
                                                            if (isLocked) return;
                                                            setEditingCell({ rowIdx: originalIdx, col: header });
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-1.5 min-h-[20px]">
                                                            {editingCell?.rowIdx === originalIdx && editingCell?.col === header ? (
                                                                <input
                                                                    type="text"
                                                                    className="w-full min-w-[100px] h-8 px-2 text-sm border border-blue-400 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                                    defaultValue={processedVal}
                                                                    autoFocus
                                                                    onBlur={(e) => {
                                                                        onCellUpdate(originalIdx, header, e.target.value);
                                                                        setEditingCell(null);
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') e.currentTarget.blur();
                                                                        if (e.key === 'Escape') setEditingCell(null);
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 w-full overflow-hidden">
                                                                    {isModified && (
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
                                                                    )}
                                                                    <span className={cn("select-none truncate block w-full", isModified && "text-blue-700 font-medium", !isModified && isLocked && "text-slate-400 italic")}>
                                                                        {isLocked && <Lock size={12} className="inline mr-1 text-red-300" />}
                                                                        {processedVal}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Original Value Tooltip on Hover (only if modified) */}
                                                        {isModified && (
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-[11px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] whitespace-nowrap border border-slate-700">
                                                                <div className="text-slate-400 mb-0.5 font-bold uppercase tracking-tighter">Original</div>
                                                                <div className="font-medium line-through decoration-slate-500 decoration-1">{originalVal || '(empty)'}</div>
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            총 <span className="font-bold text-slate-700">{totalCount}</span>행 중
                            <span className="font-bold text-slate-700"> {totalCount === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + rowsPerPage, totalCount)}</span>행 표시
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 px-3"
                            >
                                이전
                            </Button>
                            <div className="text-sm font-medium px-4">
                                {currentPage} / {totalPages || 1} 페이지
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="h-8 px-3"
                            >
                                다음
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 min-h-[400px]">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <TableIcon size={32} />
                    </div>
                    <p className="text-lg font-medium text-slate-500 mb-1">데이터 미리보기</p>
                    <p className="text-sm text-slate-400">파일을 업로드하면 정제된 결과가 여기에 표시됩니다.</p>
                </div>
            )}
        </Card>
    );
}
