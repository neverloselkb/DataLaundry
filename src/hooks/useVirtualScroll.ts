import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// 왜 분리했는가: DataPreviewTable.tsx (675줄)에서 가상 스크롤 로직만 추출하여
// 단일 책임 원칙을 적용. 테이블 외에도 재사용 가능한 범용 훅으로 설계.

interface UseVirtualScrollOptions {
    /** 각 행의 높이(px) */
    rowHeight: number;
    /** 화면 밖에 미리 렌더링할 여유 행 수 */
    overscan?: number;
    /** 전체 데이터 인덱스 배열 */
    totalIndices: number[];
}

interface UseVirtualScrollReturn {
    /** 스크롤 컨테이너 ref */
    containerRef: React.RefObject<HTMLDivElement | null>;
    /** 전체 가상 높이 (px) */
    totalVirtualHeight: number;
    /** 현재 보이는 인덱스 배열 */
    visibleIndices: number[];
    /** 상단 스페이서 높이 */
    topSpacerHeight: number;
    /** 하단 스페이서 높이 */
    bottomSpacerHeight: number;
    /** 스크롤 이벤트 핸들러 */
    handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function useVirtualScroll({
    rowHeight,
    overscan = 5,
    totalIndices
}: UseVirtualScrollOptions): UseVirtualScrollReturn {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(400);

    // 보이는 행 범위 계산
    const totalVirtualHeight = totalIndices.length * rowHeight;
    const visibleStart = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleEnd = Math.min(
        totalIndices.length,
        Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
    );

    const visibleIndices = useMemo(
        () => totalIndices.slice(visibleStart, visibleEnd),
        [totalIndices, visibleStart, visibleEnd]
    );

    const topSpacerHeight = visibleStart * rowHeight;
    const bottomSpacerHeight = Math.max(0, (totalIndices.length - visibleEnd) * rowHeight);

    // 스크롤 이벤트 핸들러
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    // 컨테이너 높이 자동 측정 (ResizeObserver)
    useEffect(() => {
        if (containerRef.current) {
            const observer = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    setContainerHeight(entry.contentRect.height);
                }
            });
            observer.observe(containerRef.current);
            return () => observer.disconnect();
        }
    }, []);

    return {
        containerRef,
        totalVirtualHeight,
        visibleIndices,
        topSpacerHeight,
        bottomSpacerHeight,
        handleScroll
    };
}
