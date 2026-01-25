import { useEffect } from 'react';

/**
 * 모달이 열려있는 동안 body 스크롤을 막는 커스텀 훅
 * @param isLocked 스크롤 잠금 여부 (모달 open 상태)
 */
export function useBodyScrollLock(isLocked: boolean) {
    useEffect(() => {
        if (isLocked) {
            // 현재 스크롤 위치 저장 (선택 사항, 필요시 구현)
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';

            // Cleanup function
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isLocked]);
}
