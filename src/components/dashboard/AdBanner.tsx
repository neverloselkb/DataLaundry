"use client";

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AdBannerProps {
    slot: string;
    format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical'; // vertical 추가
    style?: React.CSSProperties;
    className?: string;
    isTest?: boolean;
    height?: string; // 커스텀 높이 지원
}

/**
 * 리액트/Next.js 환경에서 안전하게 구글 애드센스를 렌더링하는 컴포넌트
 */
export function AdBanner({ slot, format = 'auto', style, className, isTest = false, height = '60px' }: AdBannerProps) {
    const adRef = useRef<boolean>(false);

    useEffect(() => {
        // 클라이언트 사이드인지, 이미 완료되었는지 체크
        if (typeof window === 'undefined' || adRef.current) return;

        const pushAd = () => {
            try {
                // @ts-ignore
                if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
                    // @ts-ignore
                    window.adsbygoogle.push({});
                    adRef.current = true;
                }
            } catch (err) {
                console.error('AdSense push error:', err);
            }
        };

        // DOM이 준비될 시간을 충분히 주기 위해 약간의 지연 후 실행
        const timer = setTimeout(pushAd, 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className={cn("relative bg-slate-50/20 overflow-hidden w-full", className)}
            style={{ height: height, maxHeight: height, minHeight: height, ...style }} // Wrapper Height Flexible
        >
            <ins
                className="adsbygoogle"
                data-ad-client="ca-pub-0000000000000000"
                data-ad-slot={slot}
                // data-ad-format을 vertical/horizontal/auto로 설정
                data-ad-format={format}
                data-full-width-responsive="false"
                {...(isTest ? { 'data-adtest': 'on' } : {})}
                style={{
                    display: 'inline-block',
                    width: '100%',
                    height: height
                }}
            />
        </div>
    );
}
