'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// 왜 필요한가: React 런타임 에러 발생 시 전체 앱이 크래시되는 것을 방지.
// 컴포넌트 트리 일부만 fallback UI로 교체하여 안정성 보장.

interface ErrorBoundaryProps {
    children: ReactNode;
    /** 에러 발생 시 표시할 커스텀 UI. 미지정 시 기본 fallback 사용 */
    fallback?: ReactNode;
    /** 에러 발생 시 콜백 (로깅 등) */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // 에러 로깅 — 외부 서비스(Sentry 등) 연동 가능
        console.error('[ErrorBoundary] 렌더링 에러 발생:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    // 다시 시도 — state 초기화하여 자식 컴포넌트 재렌더링 시도
    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            // 커스텀 fallback이 있으면 사용
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // 기본 fallback UI
            return (
                <div className="flex flex-col items-center justify-center p-8 bg-red-50/50 border border-red-200 rounded-xl text-center space-y-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="text-red-600 h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-900 mb-1">
                            문제가 발생했습니다
                        </h3>
                        <p className="text-sm text-red-700">
                            이 영역에서 예상치 못한 오류가 발생했습니다.
                        </p>
                        {this.state.error && (
                            <p className="text-xs text-red-500 mt-2 font-mono bg-red-100 p-2 rounded max-w-md mx-auto break-all">
                                {this.state.error.message}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={this.handleRetry}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <RefreshCw size={14} />
                        다시 시도
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
