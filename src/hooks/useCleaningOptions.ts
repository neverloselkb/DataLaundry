import { useState } from 'react';
import { ProcessingOptions } from '@/types';

/**
 * 정제 옵션 및 프롬프트 상태를 관리하는 커스텀 훅
 * 기본 옵션값 설정 및 상태 변경 로직을 캡슐화합니다.
 */
export function useCleaningOptions() {
    const [prompt, setPrompt] = useState<string>("");

    const [options, setOptions] = useState<ProcessingOptions>({
        removeWhitespace: false,
        formatMobile: false,
        formatGeneralPhone: false,
        formatDate: false,
        formatDateTime: false,
        formatNumber: false,
        cleanEmail: false,
        formatZip: false,
        highlightChanges: false,
        cleanGarbage: false,
        cleanAmount: false,
        cleanName: false,
        formatBizNum: false,
        formatCorpNum: false,
        formatUrl: false,
        maskPersonalData: false,
        formatTrackingNum: false,
        cleanOrderId: false,
        formatTaxDate: false,
        formatAccountingNum: false,
        cleanAreaUnit: false,
        cleanSnsId: false,
        formatHashtag: false,
        cleanCompanyName: false,
        removePosition: false,
        extractDong: false,
        maskAccount: false,
        maskCard: false,
        maskName: false,
        maskEmail: false,
        maskAddress: false,
        maskPhoneMid: false,
        categoryAge: false,
        truncateDate: false,
        restoreExponential: false,
        extractBuilding: false,
        normalizeSKU: false,
        unifyUnit: false,
        standardizeCurrency: false,
        useAI: false // 기본값: AI 비활성화 (순수 로컬 모드)
    });

    // 필요 시 옵션 초기화 로직 등 추가

    return {
        options,
        setOptions,
        prompt,
        setPrompt
    };
}
