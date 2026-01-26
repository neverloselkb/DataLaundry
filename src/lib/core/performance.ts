
interface PerformanceMetrics {
    tier: 'High' | 'Medium' | 'Low';
    recommendedRows: number;
    memoryGB?: number;
    cores?: number;
}

/**
 * 사용자 시스템의 하드웨어 성능을 추정하여 권장 데이터 처리량을 반환합니다.
 * navigator.deviceMemory는 Chrome 기반 브라우저에서만 제한적으로 지원됩니다.
 */
export const estimatePerformance = (): PerformanceMetrics => {
    // 1. 하드웨어 스펙 수집
    const cores = navigator.hardwareConcurrency || 4; // 기본값 4코어
    // @ts-ignore: deviceMemory is experimental
    const memory = (navigator as any).deviceMemory || 4; // 기본값 4GB (보수적 접근)

    // 2. 성능 점수 계산 (메모리 가중치 70%, 코어 가중치 30%)
    // 통상적인 8GB 램, 4코어 PC를 'Medium' 기준으로 삼음

    let tier: 'High' | 'Medium' | 'Low' = 'Medium';
    let recommendedRows = 100000; // 기본 10만줄

    // High Spec: 16GB+ RAM or (8GB RAM + 8 Core+)
    if (memory >= 8 && cores >= 8) {
        tier = 'High';
        recommendedRows = 300000; // 30만줄
    }
    // Low Spec: < 4GB RAM
    else if (memory < 4) {
        tier = 'Low';
        recommendedRows = 30000; // 3만줄
    }
    // Medium Spec: 4~8GB RAM
    else {
        tier = 'Medium';
        recommendedRows = 100000; // 10만줄

        // 메모리가 8GB라면 조금 더 쳐줌
        if (memory >= 8) recommendedRows = 150000;
    }

    return {
        tier,
        recommendedRows,
        memoryGB: memory,
        cores
    };
};
