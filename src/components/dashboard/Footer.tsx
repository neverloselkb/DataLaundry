import { AlertCircle, Github } from 'lucide-react';
import Link from 'next/link';

// 데이터세탁소 푸터 — Industrial 다크, 미니멀
// 왜 이런 디자인: 공장 바닥의 명판처럼 최소한의 정보만 표시

export function Footer() {
    return (
        <footer className="mt-auto border-t border-[var(--laundry-border)] bg-[var(--laundry-bg)] py-10 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* 브랜드 */}
                <div className="col-span-1">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-[var(--laundry-accent)] rounded flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="2" stroke="#18181B" strokeWidth="2.5" /><circle cx="12" cy="14" r="5" stroke="#18181B" strokeWidth="2" /></svg>
                        </div>
                        <span className="text-lg font-black" style={{ fontFamily: 'var(--font-display)' }}>
                            데이터<span className="text-[var(--laundry-accent)]">세탁소</span>
                        </span>
                    </div>
                    <p className="text-xs text-[var(--laundry-muted)] leading-relaxed">
                        로컬 브라우저 엔진으로 데이터를<br />안전하고 빠르게 정제합니다.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--laundry-surface)] border border-[var(--laundry-border)] rounded text-[10px] font-mono text-[var(--laundry-subtle)]">
                        <span className="status-dot status-dot-active" />
                        100% CLIENT-SIDE
                    </div>
                </div>

                {/* 기능 */}
                <div>
                    <h4 className="text-xs font-bold text-[var(--laundry-accent)] uppercase tracking-wider mb-3">기능</h4>
                    <ul className="space-y-2 text-xs text-[var(--laundry-muted)]">
                        <li>자연어 명령어 정제</li>
                        <li>날짜 형식 통일</li>
                        <li>데이터 무결성 진단</li>
                        <li>자동 매핑 및 치환</li>
                    </ul>
                </div>

                {/* 지원 */}
                <div>
                    <h4 className="text-xs font-bold text-[var(--laundry-accent)] uppercase tracking-wider mb-3">지원</h4>
                    <ul className="space-y-2 text-xs text-[var(--laundry-muted)]">
                        <li>
                            <Link href="/terms" className="flex items-center gap-1.5 hover:text-[var(--laundry-accent)] transition-colors">
                                <AlertCircle size={12} className="text-[var(--laundry-subtle)]" />
                                이용 약관
                            </Link>
                        </li>
                        <li>
                            <Link href="/privacy" className="hover:text-[var(--laundry-accent)] transition-colors">개인정보처리방침</Link>
                        </li>
                        <li>
                            <Link href="/guide" className="hover:text-[var(--laundry-accent)] transition-colors">제작 가이드</Link>
                        </li>
                    </ul>
                </div>

                {/* 연락처 */}
                <div>
                    <h4 className="text-xs font-bold text-[var(--laundry-accent)] uppercase tracking-wider mb-3">연락처</h4>
                    <address className="not-italic space-y-2 text-xs text-[var(--laundry-muted)] flex flex-col items-start gap-1">
                        <p className="font-mono text-[11px] mb-1">kblee7782@gmail.com</p>
                        <Link href="/contact" className="hover:text-[var(--laundry-accent-hover)] font-semibold transition-colors">
                            이메일 문의하기
                        </Link>
                        <a
                            href="https://github.com/neverloselkb/DataLaundry"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-[var(--laundry-text)] transition-colors"
                        >
                            <Github size={12} />
                            GitHub
                        </a>
                    </address>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-[var(--laundry-border)]">
                <p className="text-[10px] font-mono text-[var(--laundry-subtle)] text-center">
                    © 2026 데이터세탁소 — All rights reserved
                </p>
            </div>
        </footer>
    );
}
