import React, { useState, useEffect } from 'react';
import { Loader2, Lightbulb } from 'lucide-react';
import { AdBanner } from '@/components/dashboard/AdBanner';

interface LoadingOverlayProps {
    isVisible: boolean;
    progress: number;
    message: string;
}

const TIPS = [
    "Tip: '전화번호 하이픈 제거해줘'라고 입력하면 깔끔한 숫자만 남습니다.",
    "Tip: '날짜를 yyyy-MM-dd로 바꿔줘'라고 요청해보세요.",
    "Tip: 엑셀 데이터를 복사해서 붙여넣기만 해도 바로 인식됩니다.",
    "Tip: 개인정보가 포함된 컬럼은 자동으로 감지해 마스킹 처리를 도와줍니다.",
    "Tip: '금액 콤마 찍어줘'라고 하면 천 단위 구분 기호가 추가됩니다.",
    "Tip: 대용량 데이터는 자동으로 분할 처리되어 안전합니다.",
    "Tip: 로컬 정제 엔진이 수만 행의 데이터를 초고속으로 처리합니다."
];

export function LoadingOverlay({ isVisible, progress, message }: LoadingOverlayProps) {
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    // 팁 자동 롤링 (3초마다 변경)
    useEffect(() => {
        if (!isVisible) return;
        const interval = setInterval(() => {
            setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
        }, 3500);
        return () => clearInterval(interval);
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300">
            <div className="w-full max-w-2xl px-6 flex flex-col items-center space-y-8">

                {/* 1. 로딩 인디케이터 & 메시지 */}
                <div className="flex flex-col items-center space-y-4 text-white">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                            {Math.round(progress)}%
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold animate-pulse">{message || "데이터 정제 중..."}</h2>
                    <p className="text-gray-400 text-sm">잠시만 기다려주세요. 엔진이 열심히 일하고 있습니다.</p>
                </div>

                {/* 2. 팁 영역 (Tip Carousel) */}
                <div className="w-full bg-white/10 rounded-xl p-6 border border-white/20 backdrop-blur-md">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-yellow-500/20 rounded-full">
                            <Lightbulb className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-yellow-500 font-bold mb-1 text-sm uppercase tracking-wider">Useful Tip</h3>
                            <p className="text-white text-lg font-medium leading-relaxed transition-all duration-500 min-h-[3.5rem] flex items-center">
                                {TIPS[currentTipIndex]}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 닫기 버튼 (개발 단계 편의용, 실제 서비스 시에는 제거하거나 보이지 않게 처리 가능) */}
                {/* <button className="text-gray-500 text-xs hover:text-white underline mt-4">백그라운드로 숨기기</button> */}
            </div>
        </div>
    );
}
