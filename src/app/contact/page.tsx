import Link from 'next/link';
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "문의하기 - 데이터세탁소",
    description: "데이터세탁소 이용 중 발생한 문제, 기능 추가 제안, 제휴 문의 등 다양한 의견을 보내주세요."
};

export default function ContactPage() {
    return (
        <main className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-black mb-8" style={{ fontFamily: 'var(--font-display)' }}>
                문의하기
            </h1>
            <section className="bg-[var(--laundry-surface)] p-8 rounded border border-[var(--laundry-border)]">
                <p className="text-[var(--laundry-muted)] leading-relaxed mb-6">
                    데이터세탁소 사용 중 불편한 점, 기능 추가 제안, 제휴 문의 등 다양한 피드백을 기다립니다.
                    개인정보 보호 정책 등에 관한 문의도 아래 연락처를 통해 남겨주세요.
                </p>

                <div className="space-y-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[var(--laundry-subtle)]">이메일</span>
                        <a href="mailto:kblee7782@gmail.com" className="text-lg text-[var(--laundry-accent)] hover:underline">kblee7782@gmail.com</a>
                    </div>
                </div>

                <div className="mt-12 p-4 bg-[var(--laundry-elevated)] border border-[var(--laundry-border)] rounded text-sm text-[var(--laundry-muted)]">
                    * 데이터세탁소는 1인 프로젝트로 운영되고 있어 회신이 다소 지연될 수 있는 점 양해 부탁드립니다.
                </div>
            </section>
        </main>
    );
}
