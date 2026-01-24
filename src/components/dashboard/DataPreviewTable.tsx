import { useState, useMemo } from 'react';
import {
    Lock, Unlock, Table as TableIcon, Settings, Calendar, Clock, RefreshCw,
    Smartphone, Phone as PhoneIcon, Mail, Link as LinkIcon, UserCheck,
    Banknote, Landmark, Hash, Globe, CreditCard, ShoppingCart, Ruler,
    Instagram, Tag, Sparkles, CheckCircle2, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    filterIssue,
    columnOptions = {},
    onColumnOptionChange
}: DataPreviewTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Local editing states
    const [editingHeader, setEditingHeader] = useState<string | null>(null);
    const [tempHeaderName, setTempHeaderName] = useState('');
    const [editingLength, setEditingLength] = useState<string | null>(null);
    const [editingCell, setEditingCell] = useState<{ rowIdx: number, col: string } | null>(null);

    // Dropdown state
    const [activeMenuHeader, setActiveMenuHeader] = useState<string | null>(null);

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
        <Card className="min-h-[600px] border-slate-200 shadow-sm flex flex-col bg-white overflow-visible">
            {processedData.length > 0 ? (
                <>
                    <div className="flex-1 overflow-auto relative z-0">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <TableRow className="bg-slate-50 border-b border-slate-200">
                                    {headers.map((header, idx) => {
                                        const isLocked = lockedColumns.includes(header);
                                        const isLastCols = idx >= headers.length - 2 && headers.length > 2;
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
                                                                <div className={cn(
                                                                    "absolute top-full mt-1 bg-white border border-blue-100 rounded-lg shadow-xl p-2 min-w-[150px] animate-in slide-in-from-top-1 fadeIn duration-200 z-[120]",
                                                                    isLastCols ? "right-0" : "left-0"
                                                                )}>
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
                                                        <div className="flex items-center gap-1">
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

                                                            {/* Column Settings Menu */}
                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => setActiveMenuHeader(activeMenuHeader === header ? null : header)}
                                                                    className={cn(
                                                                        "p-1 rounded-md transition-colors shrink-0",
                                                                        columnOptions[header] ? "bg-blue-50 text-blue-600" : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                                                                    )}
                                                                    title="정제 옵션 설정"
                                                                >
                                                                    <Settings size={14} />
                                                                </button>

                                                                {/* Custom Dropdown */}
                                                                {activeMenuHeader === header && (
                                                                    <div
                                                                        className={cn(
                                                                            "absolute top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-2xl z-[1000] p-1 animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[450px] overflow-hidden",
                                                                            isLastCols ? "right-0 origin-top-right" : "left-0 origin-top-left"
                                                                        )}
                                                                    >
                                                                        <div className="text-[10px] text-slate-400 px-3 py-2 font-bold uppercase tracking-wider border-b border-slate-50 mb-1">컬럼 정제 포맷 설정</div>
                                                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5">
                                                                            {(() => {
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
                                                                                            { id: 'skuNormalize', label: 'SKU/모델명 표준화', icon: Hash },
                                                                                            { id: 'unitUnify', label: '단위 제거 (평/kg)', icon: Ruler },
                                                                                            { id: 'currencyStandardize', label: '통화 기호 정리 ($/￥)', icon: Banknote },
                                                                                            { id: 'trackingNum', label: '운송장번호 정제', icon: ShoppingCart },
                                                                                            { id: 'orderId', label: '주문번호 정제', icon: ShoppingCart },
                                                                                            { id: 'zip', label: '우편번호 (5자리)', icon: Globe },
                                                                                            { id: 'url', label: 'URL 홈페이지', icon: LinkIcon },
                                                                                            { id: 'dongExtract', label: '동/읍/면 추출', icon: MapPin },
                                                                                            { id: 'addressMask', label: '상세주소 마스킹', icon: Globe },
                                                                                            { id: 'ageCategory', label: '연령대 (범주화)', icon: Hash },
                                                                                            { id: 'area', label: '면적 데이터화', icon: Ruler },
                                                                                            { id: 'snsId', label: 'SNS ID 추출', icon: Instagram },
                                                                                            { id: 'hashtag', label: '해시태그 표준화', icon: Tag },
                                                                                        ]
                                                                                    }
                                                                                ];

                                                                                return categories.map((cat, catIdx) => (
                                                                                    <div key={catIdx} className="mb-4">
                                                                                        <div className="px-3 py-1 text-[9px] font-bold text-slate-300 uppercase select-none">{cat.label}</div>
                                                                                        <div className="flex flex-col gap-0.5">
                                                                                            {cat.items.map(item => {
                                                                                                const isRec = item.id === recommended;
                                                                                                const isSelected = columnOptions[header] === item.id;
                                                                                                const Icon = item.icon;
                                                                                                return (
                                                                                                    <button
                                                                                                        key={item.id}
                                                                                                        onClick={() => {
                                                                                                            onColumnOptionChange(header, item.id as ColumnOptionType);
                                                                                                            setActiveMenuHeader(null);
                                                                                                        }}
                                                                                                        className={cn(
                                                                                                            "group flex items-center justify-between px-3 py-1.5 text-[11px] rounded-md transition-all mx-1",
                                                                                                            isSelected
                                                                                                                ? "bg-blue-600 text-white font-semibold shadow-sm"
                                                                                                                : isRec
                                                                                                                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                                                                                    : "text-slate-600 hover:bg-slate-50"
                                                                                                        )}
                                                                                                    >
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <Icon size={12} className={cn(isSelected ? "text-white" : "text-slate-400 group-hover:text-blue-500")} />
                                                                                                            {item.label}
                                                                                                        </div>
                                                                                                        {isRec && !isSelected && (
                                                                                                            <span className="flex items-center gap-0.5 text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded-full font-bold animate-pulse">
                                                                                                                <Sparkles size={8} /> 추천
                                                                                                            </span>
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
                                                                                    onColumnOptionChange(header, null);
                                                                                    setActiveMenuHeader(null);
                                                                                }}
                                                                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                                            >
                                                                                <RefreshCw size={12} />
                                                                                설정 초기화 (기본값)
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
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
