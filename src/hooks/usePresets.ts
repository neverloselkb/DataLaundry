import { useState, useEffect, useCallback } from 'react';
import { CleaningPreset, ProcessingOptions, ColumnSpecificOptions } from '@/types';
import { INITIAL_OPTIONS } from './useCleaningOptions';

const STORAGE_KEY = 'data_laundry_presets';

const DEFAULT_OPTIONS = INITIAL_OPTIONS;

// 1. 전문가 추천 시스템 기본 프리셋 정의
const SYSTEM_PRESETS: CleaningPreset[] = [
    {
        id: 'sys-standard',
        name: '🧼 표준 세탁 (Standard)',
        description: '공백 제거, 전화번호 포맷, 날짜 통일 등 필수 정제 종합 세트',
        isSystem: true,
        createdAt: Date.now(),
        prompt: '',
        columnOptions: {},
        options: {
            ...DEFAULT_OPTIONS,
            removeWhitespace: true,
            formatMobile: true,
            formatDate: true,
            formatNumber: true,
            cleanGarbage: true
        }
    },
    {
        id: 'sys-privacy',
        name: '🛡️ 개인정보 마스킹 (Privacy)',
        description: '이름, 연락처 중간자리, 주소 뒷부분을 즉시 마스킹 처리',
        isSystem: true,
        createdAt: Date.now(),
        prompt: '이름 별표 처리해줘, 주소는 번지수 가려줘',
        columnOptions: {},
        options: {
            ...DEFAULT_OPTIONS,
            maskPersonalData: true,
            maskPhoneMid: true,
            maskName: true,
            maskAddress: true,
            maskEmail: true
        }
    },
    {
        id: 'sys-finance',
        name: '📊 금융/회계 모드 (Finance)',
        description: '지수 표기 복원, 통화 기호 정규화, 금액 수치화 집중 모드',
        isSystem: true,
        createdAt: Date.now(),
        prompt: '숫자에서 콤마 제거하고 단위만 남겨줘',
        columnOptions: {},
        options: {
            ...DEFAULT_OPTIONS,
            formatNumber: true,
            cleanAmount: true,
            restoreExponential: true,
            standardizeCurrency: true,
            unifyUnit: true
        }
    },
    {
        id: 'sys-business',
        name: '🏢 기업 정보 통합 (Corp)',
        description: '사업자/법인 번호 표준화 및 업체명 노이즈 제거',
        isSystem: true,
        createdAt: Date.now(),
        prompt: '(주) 같은 괄호 제거하고 업체명만 남겨',
        columnOptions: {},
        options: {
            ...DEFAULT_OPTIONS,
            formatBizNum: true,
            formatCorpNum: true,
            cleanCompanyName: true,
            removePosition: true
        }
    }
];

/**
 * 정제 프리셋 관리 커스텀 훅
 */
export function usePresets() {
    const [presets, setPresets] = useState<CleaningPreset[]>([]);

    // 초기 로드: 시스템 프리셋 + 저장된 사용자 프리셋 통합
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const userPresets = JSON.parse(saved);
                setPresets([...SYSTEM_PRESETS, ...userPresets]);
            } catch (e) {
                setPresets(SYSTEM_PRESETS);
            }
        } else {
            setPresets(SYSTEM_PRESETS);
        }
    }, []);

    // 프리셋 저장
    const savePreset = useCallback((name: string, description: string, options: ProcessingOptions, prompt: string, columnOptions: ColumnSpecificOptions) => {
        const newPreset: CleaningPreset = {
            id: `usr-${Date.now()}`,
            name,
            description,
            options,
            prompt,
            columnOptions,
            createdAt: Date.now()
        };

        const updated = [...presets.filter(p => !p.isSystem), newPreset];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setPresets([...SYSTEM_PRESETS, ...updated]);

        return newPreset;
    }, [presets]);

    // 프리셋 삭제
    const deletePreset = useCallback((id: string) => {
        const p = presets.find(item => item.id === id);
        if (p?.isSystem) return false;

        const updated = presets.filter(p => !p.isSystem && p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setPresets([...SYSTEM_PRESETS, ...updated]);
        return true;
    }, [presets]);

    // 프리셋 내보내기 (JSON 다운로드)
    const exportPresets = useCallback(() => {
        const userPresets = presets.filter(p => !p.isSystem);
        if (userPresets.length === 0) {
            alert('내보낼 사용자 정의 프리셋이 없습니다.');
            return;
        }

        const dataStr = JSON.stringify(userPresets, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `data_laundry_presets_${new Date().toISOString().split('T')[0]}.laundry`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }, [presets]);

    // 프리셋 가져오기 (JSON 읽기)
    const importPresets = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target?.result as string);

                // 간단한 구조 검증
                if (!Array.isArray(imported)) throw new Error('올바르지 않은 형식입니다.');

                const userPresets = presets.filter(p => !p.isSystem);

                // 중복 ID 방지를 위해 새 ID 부여 또는 기존 필터링 (여기서는 신규 추가 전략)
                const newPresets = imported.map(p => ({
                    ...p,
                    id: `usr-imp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    isSystem: false // 혹시 모를 오염 방지
                }));

                const updated = [...userPresets, ...newPresets];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                setPresets([...SYSTEM_PRESETS, ...updated]);

                alert(`${newPresets.length}개의 프리셋을 성공적으로 가져왔습니다. ✨`);
            } catch (err) {
                alert('프리셋 파일을 읽는 중 오류가 발생했습니다. 올바른 .laundry 파일인지 확인해주세요.');
            }
        };
        reader.readAsText(file);
    }, [presets]);

    return {
        presets,
        savePreset,
        deletePreset,
        exportPresets,
        importPresets
    };
}
