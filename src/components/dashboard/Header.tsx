import Link from 'next/link';
import { HelpCircle, Download, Shield } from 'lucide-react';

// 데이터세탁소 헤더 — Industrial/Utilitarian 다크 테마
// 왜 이런 디자인: "공장 제어판 상단 바"처럼 단단하고 실용적인 느낌

export function Header() {
    return (
        <header className="bg-[var(--laundry-surface)] border-b border-[var(--laundry-border)] sticky top-0 z-50 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                {/* 로고 — 세탁기 아이콘 + Black Han Sans 타이틀 */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-8 h-8 bg-[var(--laundry-accent)] rounded flex items-center justify-center group-hover:bg-[var(--laundry-accent-hover)] transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="2" width="18" height="20" rx="2" stroke="#18181B" strokeWidth="2" />
                            <circle cx="12" cy="14" r="5" stroke="#18181B" strokeWidth="2" />
                            <circle cx="12" cy="14" r="2" stroke="#18181B" strokeWidth="1.5" />
                            <circle cx="7" cy="5" r="1" fill="#18181B" />
                            <circle cx="10" cy="5" r="1" fill="#18181B" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                            데이터<span className="text-[var(--laundry-accent)]">세탁소</span>
                        </span>
                        <span className="text-[9px] font-medium text-[var(--laundry-subtle)] uppercase tracking-wider mt-0.5">
                            DATA LAUNDRY ENGINE
                        </span>
                    </div>
                </Link>

                {/* 중앙 GNB */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/guide" className="text-sm font-bold text-[var(--laundry-muted)] hover:text-[var(--laundry-accent)] transition-colors">가이드</Link>
                    <Link href="/blog" className="text-sm font-bold text-[var(--laundry-muted)] hover:text-[var(--laundry-accent)] transition-colors">데이터 팁</Link>
                    <Link href="/about" className="text-sm font-bold text-[var(--laundry-muted)] hover:text-[var(--laundry-accent)] transition-colors">소개</Link>
                    <Link href="/contact" className="text-sm font-bold text-[var(--laundry-muted)] hover:text-[var(--laundry-accent)] transition-colors">문의하기</Link>
                </nav>

                {/* 우측 도구 모음 */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <a
                        href="/sample_data.csv"
                        download
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-[var(--laundry-accent)] bg-[var(--laundry-accent-glow)] hover:bg-[var(--laundry-accent)]/20 rounded transition-colors"
                    >
                        <Download size={13} />
                        <span className="hidden sm:inline">샘플 다운로드</span>
                    </a>

                    <div className="h-4 w-px bg-[var(--laundry-border)] mx-1 hidden sm:block" />

                    {/* 보안 상태 인디케이터 — 공장 장비 상태 표시기 느낌 */}
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--laundry-bg)] border border-[var(--laundry-border)] rounded text-[10px] font-mono text-[var(--laundry-subtle)]">
                        <Shield size={10} className="text-[var(--laundry-success)]" />
                        <span className="status-dot status-dot-active" />
                        LOCAL ONLY
                    </div>
                </div>
            </div>
        </header>
    );
}
