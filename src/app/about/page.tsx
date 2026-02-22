import Link from 'next/link';
import { Shield, FastForward, EyeOff } from 'lucide-react';
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "데이터세탁소 소개 - 안전하고 빠른 브라우저 기반 데이터 정제",
    description: "데이터세탁소가 만들어진 이유와 100% 브라우저 기반 동작의 안전성, 빠른 처리 속도 등 핵심 가치를 확인하세요."
};

export default function AboutPage() {
    return (
        <main className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-black mb-8" style={{ fontFamily: 'var(--font-display)' }}>
                데이터세탁소 소개
            </h1>

            <section className="bg-[var(--laundry-surface)] p-8 rounded border border-[var(--laundry-border)] mb-8">
                <h2 className="text-2xl font-bold text-[var(--laundry-text)] mb-4">왜 만들었나요?</h2>
                <p className="text-[var(--laundry-muted)] leading-relaxed mb-4">
                    데이터 전처리는 데이터 분석, 마케팅, 영업, 물류 등 모든 분야에서 가장 시간이 오래 걸리고 지루한 작업입니다.
                    간단히 전화번호에 하이픈을 빼고 싶거나, 회사명에서 '(주)'를 날리고 싶을 뿐인데, 엑셀 수식을 뒤지거나 파이썬 파이썬 스크립트를 짜야하는 현실이 답답했습니다.
                </p>
                <p className="text-[var(--laundry-muted)] leading-relaxed">
                    그래서 누구나 클릭 몇 번, 혹은 "~~해 줘"라는 간단한 말 한마디로 지저분한 데이터를 깨끗하게 세탁할 수 있는 브라우저 전용 툴을 만들게 되었습니다.
                </p>
            </section>

            <h2 className="text-2xl font-bold text-[var(--laundry-text)] mb-6 mt-12">핵심 가치 보장 (Core Values)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[var(--laundry-elevated)] p-6 rounded border border-[var(--laundry-border)]">
                    <Shield size={24} className="text-[var(--laundry-success)] mb-4" />
                    <h3 className="text-lg font-bold text-[var(--laundry-text)] mb-2">100% 브라우저 기반</h3>
                    <p className="text-sm text-[var(--laundry-muted)] leading-relaxed">
                        사용자가 업로드한 엑셀/CSV 데이터는 절대 외부 서버로 전송되지 않습니다. 모든 연산은 오직 사용자의 기기(브라우저 메모리) 안에서만 처리되므로 민감한 고객 정보 유출 걱정이 없습니다.
                    </p>
                </div>
                <div className="bg-[var(--laundry-elevated)] p-6 rounded border border-[var(--laundry-border)]">
                    <FastForward size={24} className="text-[var(--laundry-accent)] mb-4" />
                    <h3 className="text-lg font-bold text-[var(--laundry-text)] mb-2">압도적인 처리 속도</h3>
                    <p className="text-sm text-[var(--laundry-muted)] leading-relaxed">
                        복잡한 정규식이나 매크로 없이, 수만 건의 데이터도 클릭 즉시 가공됩니다. 오버헤드가 큰 서버 통신 지연 없이 원클릭으로 결괏값을 확인하세요.
                    </p>
                </div>
                <div className="bg-[var(--laundry-elevated)] p-6 rounded border border-[var(--laundry-border)]">
                    <EyeOff size={24} className="text-[var(--laundry-info)] mb-4" />
                    <h3 className="text-lg font-bold text-[var(--laundry-text)] mb-2">개인정보 완벽 마스킹</h3>
                    <p className="text-sm text-[var(--laundry-muted)] leading-relaxed">
                        이름, 전화번호, 이메일, 계좌번호 등 개인정보 마스킹에 특화된 프리셋을 제공합니다. 데이터를 안전하게 익명화하여 안심하고 협업하세요.
                    </p>
                </div>
            </div>

            <div className="mt-12 text-center">
                <Link href="/" className="inline-block bg-[var(--laundry-accent)] text-[#18181B] font-bold px-6 py-3 rounded hover:bg-[var(--laundry-accent-hover)] transition-colors">
                    데이터세탁소 시작하기
                </Link>
            </div>
        </main>
    );
}
