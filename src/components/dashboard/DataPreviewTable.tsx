import React, { useState, useMemo, useRef, useEffect, memo, useCallback } from 'react';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';
import { useTableKeyboard } from '@/hooks/useTableKeyboard';
import {
    Lock, Unlock, Table as TableIcon, Settings, Calendar, Clock, RefreshCw,
    Smartphone, Phone as PhoneIcon, Mail, Link as LinkIcon, UserCheck,
    Banknote, Landmark, Hash, Globe, CreditCard, ShoppingCart, Ruler,
    Instagram, Tag, Sparkles, CheckCircle2, MapPin, Code, Smile, Type,
    X, FileSpreadsheet, Barcode, Scale, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createPortal } from 'react-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DataRow, DataIssue, ColumnSpecificOptions, ColumnOptionType } from '@/types';
import { getHeaderRecommendations, recommendColumnFormat } from '@/lib/core/analyzers';


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
    columnOptions: ColumnSpecificOptions;
    onColumnOptionChange: (header: string, type: ColumnOptionType) => void;
    onReset: () => void;
    onApply: () => void;
}

/**
 * 데이터 미리보기 및 수정 테이블 컴포넌트 (Memoized)
 */
export const DataPreviewTable = memo(function DataPreviewTable({
    processedData,
    originalData,
    headers,
    lockedColumns,
    toggleLock,
    columnLimits,
    onLimitChange,
    onHeaderRename,
    onCellUpdate,
    filterIssue,
    columnOptions = {},
    onColumnOptionChange,
    onReset,
    onApply
}: DataPreviewTableProps) {
    // Local editing states
    const [editingHeader, setEditingHeader] = useState<string | null>(null);
    const [tempHeaderName, setTempHeaderName] = useState('');
    const [editingLength, setEditingLength] = useState<string | null>(null);

    // Dropdown state with position
    const [activeMenu, setActiveMenu] = useState<{ header: string; x: number; y: number } | null>(null);

    // Pagination Logic Removed -> Scroll View Mode
    const MIN_ROWS = 10;

    // totalCount 선언 추가
    const totalCount = filterIssue?.affectedRows ? filterIssue.affectedRows.length : processedData.length;

    const currentDataIndices = useMemo(() => {
        if (filterIssue?.affectedRows) {
            return filterIssue.affectedRows;
        }
        return Array.from({ length: processedData.length }, (_, i) => i);
    }, [filterIssue, processedData.length]);

    // 빈 행 개수 계산
    const emptyRows = Math.max(0, MIN_ROWS - currentDataIndices.length);

    // ⚡ 가상 스크롤 — 커스텀 훅으로 분리
    const ROW_HEIGHT = 41;
    const {
        containerRef: tableContainerRef,
        totalVirtualHeight,
        visibleIndices,
        topSpacerHeight,
        bottomSpacerHeight,
        handleScroll
    } = useVirtualScroll({
        rowHeight: ROW_HEIGHT,
        overscan: 5,
        totalIndices: currentDataIndices
    });

    // ⌨️ 키보드 네비게이션 — 커스텀 훅으로 분리
    const {
        selectedCell,
        editingCell,
        setSelectedCell,
        setEditingCell,
        handleKeyDown
    } = useTableKeyboard({
        headers,
        lockedColumns,
        dataIndices: currentDataIndices
    });

    const handleHeaderSaveInternal = (header: string, newName: string) => {
        onHeaderRename(header, newName);
        setEditingHeader(null);
    };

    return (
        <div className="card-industrial flex flex-col overflow-visible">
            {processedData.length > 0 ? (
                <>
                    <div
                        ref={tableContainerRef}
                        className="flex-1 overflow-auto relative z-0 w-full max-w-full overflow-x-auto max-h-[400px] bg-[var(--laundry-surface)] rounded outline-none focus:ring-1 focus:ring-[var(--laundry-accent)] custom-scrollbar"
                        tabIndex={0}
                        onKeyDown={handleKeyDown}
                        onScroll={handleScroll}
                    >
                        <Table>
                            <TableHeader className="bg-[var(--laundry-surface)] sticky top-0 z-50 shadow-sm border-b border-[var(--laundry-border)]">
                                <TableRow className="bg-[var(--laundry-surface)] border-b border-[var(--laundry-border)]">
                                    {/* Row Number Header */}
                                    <TableHead className="w-12 min-w-[3rem] px-0 text-center font-bold text-[var(--laundry-subtle)] bg-[var(--laundry-surface)] border-r border-[var(--laundry-border)] sticky left-0 z-[60] select-none font-mono">
                                        #
                                    </TableHead>
                                    {headers.map((header, idx) => {
                                        const isLocked = lockedColumns.includes(header);
                                        const isLastCols = idx >= headers.length - 2 && headers.length > 2;
                                        return (
                                            <TableHead key={header} className="font-semibold text-[var(--laundry-text)] py-3 relative group overflow-visible min-w-[150px]">
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
                                                                <div className={cn(
                                                                    "absolute top-full mt-1 bg-[var(--laundry-elevated)] border border-[var(--laundry-border)] rounded shadow-xl p-2 min-w-[150px] animate-in slide-in-from-top-1 fadeIn duration-200 z-[120]",
                                                                    isLastCols ? "right-0" : "left-0"
                                                                )}>
                                                                    <div className="text-[10px] text-[var(--laundry-subtle)] mb-1.5 font-bold px-1 uppercase tracking-tight font-mono">추천 컬럼명</div>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {getHeaderRecommendations(processedData, header).map(rec => (
                                                                            <button
                                                                                key={rec}
                                                                                className="px-2 py-1 bg-[var(--laundry-bg)] text-[var(--laundry-text)] rounded text-[11px] hover:bg-[var(--laundry-accent)] hover:text-[var(--laundry-bg)] transition-colors border border-[var(--laundry-border)]"
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
                                                                className="cursor-pointer hover:text-[var(--laundry-accent)] transition-colors py-1 select-none flex-1 truncate"
                                                                onDoubleClick={() => {
                                                                    setEditingHeader(header);
                                                                    setTempHeaderName(header);
                                                                }}
                                                                title="더블클릭하여 컬럼명 수정"
                                                            >
                                                                {header}
                                                            </span>
                                                        )}
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => toggleLock(header)}
                                                                className={cn(
                                                                    "p-1 rounded transition-colors shrink-0",
                                                                    isLocked ? "bg-[var(--laundry-danger)]/20 text-[var(--laundry-danger)]" : "text-[var(--laundry-subtle)] hover:text-[var(--laundry-accent)] hover:bg-[var(--laundry-accent-glow)]"
                                                                )}
                                                                title={isLocked ? "잠금 해제" : "잠금 하기"}
                                                            >
                                                                {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                                                            </button>

                                                            {/* Column Settings Menu Trigger */}
                                                            <div className="relative">
                                                                <button
                                                                    onClick={(e) => {
                                                                        if (activeMenu?.header === header) {
                                                                            setActiveMenu(null);
                                                                        } else {
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            setActiveMenu({
                                                                                header,
                                                                                x: rect.left,
                                                                                y: rect.bottom + 4 // small gap
                                                                            });
                                                                        }
                                                                        e.stopPropagation(); // Prevent immediate close
                                                                    }}
                                                                    className={cn(
                                                                        "p-1 rounded transition-colors shrink-0",
                                                                        columnOptions[header] ? "bg-[var(--laundry-accent-glow)] text-[var(--laundry-accent)]" : "text-[var(--laundry-subtle)] hover:text-[var(--laundry-accent)] hover:bg-[var(--laundry-accent-glow)]"
                                                                    )}
                                                                    title="정제 옵션 설정"
                                                                >
                                                                    <Settings size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Max Length Config UI */}
                                                        <div className="flex items-center text-[10px] text-[var(--laundry-subtle)] font-normal font-mono">
                                                            Max:
                                                            {editingLength === header ? (
                                                                <input
                                                                    type="number"
                                                                    className="w-12 h-5 ml-1 pl-1 text-xs border border-[var(--laundry-border)] rounded bg-[var(--laundry-bg)] text-[var(--laundry-text)] focus:outline-none focus:ring-1 focus:ring-[var(--laundry-accent)]"
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
                                                                    className="ml-1 cursor-pointer hover:text-[var(--laundry-accent)] hover:underline decoration-dashed"
                                                                    onClick={() => setEditingLength(header)}
                                                                    title="클릭하여 최대 길이 제한 설정"
                                                                >
                                                                    {columnLimits[header] || 'Auto'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* ⚡ Virtual Scrolling: 위쪽 빈 공간 */}
                                {topSpacerHeight > 0 && (
                                    <tr style={{ height: topSpacerHeight }} aria-hidden="true">
                                        <td colSpan={headers.length + 1} />
                                    </tr>
                                )}
                                {/* ⚡ 화면에 보이는 행만 렌더링 */}
                                {visibleIndices.map((originalIdx) => {
                                    const row = processedData[originalIdx];
                                    const originalRow = originalData[originalIdx];
                                    if (!row) return null;

                                    return (
                                        <TableRow key={originalIdx} className="hover:bg-[var(--laundry-elevated)] transition-colors group/row border-b border-[var(--laundry-border)]/50">
                                            {/* Row Number Cell */}
                                            <TableCell className="w-12 min-w-[3rem] p-0 text-center font-mono text-xs text-[var(--laundry-subtle)] bg-[var(--laundry-bg)] border-r border-[var(--laundry-border)] sticky left-0 z-10 select-none group-hover/row:!bg-[var(--laundry-surface)] shadow-[1px_0_0_0_var(--laundry-border)]">
                                                {originalIdx + 1}
                                            </TableCell>
                                            {headers.map((header) => {
                                                const isLocked = lockedColumns.includes(header);
                                                const processedVal = row[header]?.toString() || '';
                                                const originalVal = originalRow ? (originalRow[header]?.toString() || '') : '';
                                                const isModified = originalVal !== processedVal;

                                                return (
                                                    <TableCell
                                                        key={`${originalIdx}-${header}`}
                                                        id={`cell-${originalIdx}-${header}`}
                                                        className={cn(
                                                            "whitespace-nowrap text-[var(--laundry-muted)] py-3 relative group overflow-visible cursor-cell max-w-[200px] transition-colors duration-75",
                                                            selectedCell?.rowIdx === originalIdx && selectedCell?.col === header && "!ring-1 !ring-[var(--laundry-accent)] !z-20 !bg-[var(--laundry-accent-glow)] text-[var(--laundry-text)] font-bold shadow-md"
                                                        )}
                                                        onClick={() => {
                                                            setSelectedCell({ rowIdx: originalIdx, col: header });
                                                            tableContainerRef.current?.focus({ preventScroll: true });
                                                        }}
                                                        onDoubleClick={() => {
                                                            if (isLocked) return;
                                                            setEditingCell({ rowIdx: originalIdx, col: header });
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-1.5 min-h-[20px]">
                                                            {editingCell?.rowIdx === originalIdx && editingCell?.col === header ? (
                                                                <input
                                                                    type="text"
                                                                    className="w-full min-w-[100px] h-8 px-2 text-sm border border-[var(--laundry-accent)] rounded bg-[var(--laundry-bg)] text-[var(--laundry-text)] shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--laundry-accent)]"
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
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--laundry-accent)] shrink-0 glow-amber" />
                                                                    )}
                                                                    <span className={cn("select-none truncate block w-full", isModified && "text-[var(--laundry-accent)] font-medium", !isModified && isLocked && "text-[var(--laundry-subtle)] italic")}>
                                                                        {isLocked && <Lock size={12} className="inline mr-1 text-[var(--laundry-danger)] opacity-70" />}
                                                                        {processedVal}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Original Value Tooltip on Hover (only if modified) */}
                                                        {isModified && (
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--laundry-elevated)] text-[var(--laundry-text)] text-[11px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] whitespace-nowrap border border-[var(--laundry-border)]">
                                                                <div className="text-[var(--laundry-subtle)] mb-0.5 font-bold uppercase tracking-tighter">Original</div>
                                                                <HighlightDiff original={originalVal} modified={processedVal} />
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[var(--laundry-elevated)]" />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    );
                                })}
                                {/* ⚡ Virtual Scrolling: 아래쪽 빈 공간 */}
                                {bottomSpacerHeight > 0 && (
                                    <tr style={{ height: bottomSpacerHeight }} aria-hidden="true">
                                        <td colSpan={headers.length + 1} />
                                    </tr>
                                )}
                                {/* Empty Rows Filling to maintain grid look */}
                                {emptyRows > 0 && Array.from({ length: emptyRows }).map((_, i) => (
                                    <TableRow key={`empty-${i}`} className="hover:bg-transparent">
                                        <TableCell className="w-12 min-w-[3rem] p-0 text-center font-mono text-xs text-[var(--laundry-subtle)]/50 bg-[var(--laundry-bg)] border-r border-[var(--laundry-border)] sticky left-0 z-10 select-none">
                                            {currentDataIndices.length + i + 1}
                                        </TableCell>
                                        {headers.map((header) => (
                                            <TableCell key={`empty-cell-${i}-${header}`} className="py-3 text-transparent select-none bg-[url('/grid-pattern.svg')] bg-[length:4px_4px] opacity-10">
                                                -
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer Actions (Simplified) */}
                    <div className="p-4 border-t border-[var(--laundry-border)] bg-[var(--laundry-elevated)] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-[var(--laundry-muted)] order-2 sm:order-1 w-full sm:w-auto text-center sm:text-left">
                            <span className="font-bold text-[var(--laundry-text)]">{totalCount}</span>개의 데이터가 정제되었습니다. (스크롤하여 전체 확인)
                        </div>

                        {/* Action Buttons (Right) */}
                        <div className="flex items-center gap-2 order-1 sm:order-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onReset}
                                className="bg-[var(--laundry-surface)] hover:bg-[var(--laundry-danger)]/20 text-[var(--laundry-text)] hover:text-[var(--laundry-danger)] border-[var(--laundry-border)] h-9 px-3 text-xs"
                                title="모든 작업 초기화"
                            >
                                <RefreshCw size={14} className="mr-1.5" />
                                초기화
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onApply}
                                className="bg-[var(--laundry-accent)] hover:bg-[var(--laundry-accent-hover)] text-[var(--laundry-bg)] border-none h-9 px-3 text-xs shadow-none font-bold glow-amber"
                                title="현재 결과를 원본으로 확정"
                            >
                                <CheckCircle2 size={14} className="mr-1.5" />
                                결과 확정
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-[var(--laundry-subtle)] gap-4 min-h-[300px]">
                    <div className="w-16 h-16 rounded-full bg-[var(--laundry-elevated)] flex items-center justify-center">
                        <FileSpreadsheet size={32} className="opacity-50" />
                    </div>
                    <div className="text-center">
                        <p className="font-medium text-[var(--laundry-muted)]">데이터가 없습니다</p>
                        <p className="text-sm mt-1">좌측 패널에서 첫 번째 파일을 선택해주세요</p>
                    </div>
                </div>
            )}

            {/* Portal Dropdown Menu */}
            {activeMenu && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] isolate"
                    onClick={() => setActiveMenu(null)}
                >
                    <div
                        className="absolute bg-[var(--laundry-surface)] border border-[var(--laundry-border)] rounded-lg shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100 flex flex-col w-64 max-h-[450px] overflow-hidden"
                        style={{
                            top: Math.min(activeMenu.y, window.innerHeight - 450), // Prevent bottom overflow
                            left: Math.max(10, Math.min(activeMenu.x, window.innerWidth - 266)), // Prevent x overflow
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-[10px] text-[var(--laundry-subtle)] px-3 py-2 font-bold uppercase tracking-wider border-b border-[var(--laundry-border)] mb-1 flex justify-between items-center">
                            <span>{activeMenu.header} 설정</span>
                            <button onClick={() => setActiveMenu(null)} className="text-[var(--laundry-subtle)] hover:text-[var(--laundry-accent)]">
                                <X size={12} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5">
                            {(() => {
                                const header = activeMenu.header;
                                const recommended = recommendColumnFormat(processedData, header);
                                const categories = [
                                    {
                                        label: '기본 및 날짜',
                                        items: [
                                            { id: 'date', label: '날짜 (YYYY-MM-DD)', icon: Calendar },
                                            { id: 'datetime', label: '일시 (YYYY-MM-DD HH:mm)', icon: Clock },
                                            { id: 'dateTruncate', label: '날짜 절삭 (연/월)', icon: Calendar },
                                        ]
                                    },
                                    {
                                        label: '고급 텍스트 정제',
                                        items: [
                                            { id: 'htmlRemove', label: 'HTML 태그 제거', icon: Code },
                                            { id: 'emojiRemove', label: '이모지 제거', icon: Smile },
                                            { id: 'upperCase', label: '대문자 변환', icon: Type },
                                            { id: 'lowerCase', label: '소문자 변환', icon: Type },
                                        ]
                                    },
                                    {
                                        label: '개인정보 및 보안',
                                        items: [
                                            { id: 'mobile', label: '휴대폰 번호', icon: Smartphone },
                                            { id: 'phone', label: '전화번호', icon: PhoneIcon },
                                            { id: 'phoneMidMask', label: '연락처 중간가림', icon: Smartphone },
                                            { id: 'email', label: '이메일 주소', icon: Mail },
                                            { id: 'emailMask', label: '이메일 마스킹', icon: Mail },
                                            { id: 'nameMask', label: '성함 마스킹', icon: UserCheck },
                                            { id: 'rrn', label: '주민번호 마스킹', icon: UserCheck },
                                        ]
                                    },
                                    {
                                        label: '비즈니스 및 금융',
                                        items: [
                                            { id: 'companyClean', label: '업체명 정규화', icon: Landmark },
                                            { id: 'positionRemove', label: '직함 제거', icon: UserCheck },
                                            { id: 'bizNum', label: '사업자번호', icon: Landmark },
                                            { id: 'corpNum', label: '법인번호', icon: Landmark },
                                            { id: 'amount', label: '금액 (콤마)', icon: Banknote },
                                            { id: 'amountKrn', label: '금액 (한글 숫자)', icon: CreditCard },
                                            { id: 'accountMask', label: '계좌번호 마스킹', icon: Banknote },
                                            { id: 'cardMask', label: '카드번호 마스킹', icon: CreditCard },
                                        ]
                                    },
                                    {
                                        label: '업종 특화 (전문가)',
                                        items: [
                                            { id: 'companyClean', label: '업체명 정규화 (B2B)', icon: Landmark },
                                            { id: 'positionRemove', label: '직함 제거 (인사)', icon: UserCheck },
                                            { id: 'buildingExtract', label: '아파트/건물명 추출', icon: Globe },
                                            { id: 'exponentialRestore', label: '엑셀 지수 복원 (물류)', icon: RefreshCw },
                                            { id: 'skuNormalize', label: '상품코드/모델명 표준화', icon: Barcode },
                                            { id: 'unitUnify', label: '단위 통일 (EA/KG)', icon: Scale },
                                            { id: 'currencyStandard', label: '통화 기호 통일 (KRW)', icon: Wallet },
                                        ]
                                    }
                                ];

                                return categories.map((cat, i) => (
                                    <div key={i} className="mb-2 last:mb-0">
                                        <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 bg-slate-50/50 flex items-center gap-1">
                                            {i === 0 && <Sparkles size={10} className="text-yellow-500" />}
                                            {cat.label}
                                        </div>
                                        <div className="px-1 py-1 grid grid-cols-1 gap-0.5">
                                            {cat.items.map((item) => {
                                                const isSelected = columnOptions[header] === item.id;
                                                const Icon = item.icon;
                                                const isRec = recommended === item.id;

                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            const newValue = item.id === columnOptions[header] ? null : item.id as ColumnOptionType;
                                                            onColumnOptionChange(header, newValue);
                                                            setActiveMenu(null);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-3 py-1.5 text-[11px] rounded-md transition-all group relative",
                                                            isSelected
                                                                ? "bg-blue-600 text-white shadow-md shadow-blue-200 font-medium"
                                                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                                                            isRec && !isSelected && "ring-1 ring-yellow-400/50 bg-yellow-50/30"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Icon size={12} className={cn(isSelected ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                                                            <span>{item.label}</span>
                                                        </div>
                                                        {isRec && !isSelected && (
                                                            <span className="text-[9px] text-yellow-600 font-bold bg-yellow-100 px-1 py-0.5 rounded ml-2 animate-pulse">추천</span>
                                                        )}
                                                        {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                        <div className="p-1 border-t border-slate-50 mt-1">
                            <button
                                onClick={() => {
                                    onColumnOptionChange(activeMenu.header, null);
                                    setActiveMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <RefreshCw size={12} />
                                설정 초기화 (기본값)
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
});

/**
 * 변경된 내용(Diff)을 시각화하는 컴포넌트 (Memoized)
 */
const HighlightDiff = memo(function HighlightDiff({ original, modified }: { original: string, modified: string }) {
    if (!original) return <span className="text-[var(--laundry-subtle)] italic">(empty)</span>;

    const result = [];
    let mIdx = 0;

    for (let oIdx = 0; oIdx < original.length; oIdx++) {
        const oChar = original[oIdx];
        const mChar = modified[mIdx];

        // 1. 매칭 성공 (그대로 유지됨)
        if (mIdx < modified.length && oChar === mChar) {
            result.push(<span key={oIdx}>{oChar}</span>);
            mIdx++;
        }
        // 2. 불일치 -> 원본에서 삭제된 것으로 간주 (정제 로직 특성상 대부분 삭제/치환)
        else {
            // 특히 공백이 삭제된 경우 빨간색 블록으로 강조
            if (/\s/.test(oChar)) {
                result.push(
                    <span
                        key={oIdx}
                        className="bg-[var(--laundry-danger)]/80 text-transparent inline-block align-middle mx-[0.5px] w-[4px] h-[10px] rounded-[1px] select-none"
                        title="제거된 공백"
                    >
                        _
                    </span>
                );
            }
            // 일반 문자가 삭제/변경됨
            else {
                result.push(
                    <span key={oIdx} className="text-[var(--laundry-danger)] line-through decoration-[var(--laundry-danger)]/50 decoration-2 font-semibold">
                        {oChar}
                    </span>
                );
            }
            // mIdx는 증가시키지 않음 (다음 원본 문자와 현재 수정본 문자를 다시 비교)
        }
    }

    return (
        <div className="font-mono text-[10px] leading-tight tracking-wide break-all max-w-[200px] whitespace-pre-wrap">
            {result}
        </div>
    );
});
