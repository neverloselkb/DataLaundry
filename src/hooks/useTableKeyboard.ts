import { useState, useEffect, useCallback } from 'react';

// 왜 분리했는가: 키보드 네비게이션 로직은 테이블 렌더링과 독립적.
// 여러 테이블 컴포넌트에서 재사용 가능한 훅으로 추출.

interface UseTableKeyboardOptions {
    /** 전체 헤더(컬럼명) 배열 */
    headers: string[];
    /** 잠긴 컬럼 배열 (편집 불가) */
    lockedColumns: string[];
    /** 현재 보이는 데이터 인덱스 배열 */
    dataIndices: number[];
}

interface UseTableKeyboardReturn {
    /** 선택된 셀 */
    selectedCell: { rowIdx: number; col: string } | null;
    /** 편집 중인 셀 */
    editingCell: { rowIdx: number; col: string } | null;
    /** 셀 선택 핸들러 */
    setSelectedCell: (cell: { rowIdx: number; col: string } | null) => void;
    /** 편집 셀 설정 핸들러 */
    setEditingCell: (cell: { rowIdx: number; col: string } | null) => void;
    /** 키보드 이벤트 핸들러 */
    handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function useTableKeyboard({
    headers,
    lockedColumns,
    dataIndices
}: UseTableKeyboardOptions): UseTableKeyboardReturn {
    const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; col: string } | null>(null);
    const [editingCell, setEditingCell] = useState<{ rowIdx: number; col: string } | null>(null);

    // 키보드 화살표/엔터 네비게이션
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!selectedCell || editingCell) return;

        const { rowIdx, col } = selectedCell;
        const colIdx = headers.indexOf(col);
        const totalRows = dataIndices.length;

        let nextRow = rowIdx;
        let nextColIdx = colIdx;

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                nextRow = Math.max(0, rowIdx - 1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                nextRow = Math.min(totalRows - 1, rowIdx + 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                nextColIdx = Math.max(0, colIdx - 1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextColIdx = Math.min(headers.length - 1, colIdx + 1);
                break;
            case 'Enter':
                e.preventDefault();
                // 잠기지 않은 컬럼만 편집 모드 진입
                if (!lockedColumns.includes(col)) {
                    setEditingCell({ rowIdx, col });
                }
                return;
            default:
                return;
        }

        const nextCol = headers[nextColIdx];
        setSelectedCell({ rowIdx: nextRow, col: nextCol });
    }, [selectedCell, editingCell, headers, lockedColumns, dataIndices.length]);

    // 선택된 셀로 자동 스크롤
    useEffect(() => {
        if (selectedCell) {
            const cellId = `cell-${selectedCell.rowIdx}-${selectedCell.col}`;
            const element = document.getElementById(cellId);
            if (element) {
                element.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
            }
        }
    }, [selectedCell]);

    return {
        selectedCell,
        editingCell,
        setSelectedCell,
        setEditingCell,
        handleKeyDown
    };
}
