import Link from 'next/link';
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "데이터 클리닝 팁 & 블로그 - 데이터세탁소",
    description: "실무에 당장 써먹을 수 있는 데이터 전처리 및 정제 노하우. 엑셀 지수 변환 해결, 정규식 기초, 이메일 마스킹 방법 등."
};

export default function BlogPage() {
    return (
        <main className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-black mb-8" style={{ fontFamily: 'var(--font-display)' }}>
                데이터 클리닝 팁 & 블로그
            </h1>
            <p className="text-[var(--laundry-muted)] mb-8">
                데이터세탁소에서 제공하는 실무에 당장 써먹을 수 있는 데이터 전처리 및 정제 노하우들을 정리했습니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    {
                        title: "이메일 마스킹은 어떻게 해야 안전할까?",
                        desc: "고객 정보는 소중합니다. 가장 보편적이고 안전한 이메일 마스킹 규칙과 노하우를 소개합니다.",
                        date: "2024-03-12"
                    },
                    {
                        title: "B2B 영업 시 엑셀 데이터 전처리 노하우",
                        desc: "수만 개의 기업 DB 속에서 (주), 주식회사 등의 잡음을 걷어내고 깔끔하게 식별하는 방법.",
                        date: "2024-03-05"
                    },
                    {
                        title: "전화번호 하이픈(-) 정규화 패턴의 이해",
                        desc: "01012345678, 010.1234.5678 등 다양한 연락처 포맷을 010-1234-5678 규격으로 맞추는 정규식 기본.",
                        date: "2024-02-28"
                    },
                    {
                        title: "엑셀에서 발생하는 지수(E+) 변환 문제 해결 팁",
                        desc: "운송장 번호나 바코드가 엑셀에서 1.2E+14 처럼 깨졌을 때 복구하고 예방하는 완벽 가이드.",
                        date: "2024-02-15"
                    }
                ].map((post, idx) => (
                    <article key={idx} className="bg-[var(--laundry-surface)] p-6 rounded border border-[var(--laundry-border)] hover:border-[var(--laundry-accent)] transition-colors cursor-pointer group">
                        <span className="text-xs text-[var(--laundry-accent)] font-bold mb-2 block">{post.date}</span>
                        <h2 className="text-lg font-bold text-[var(--laundry-text)] mb-2 group-hover:text-[var(--laundry-accent)] transition-colors">{post.title}</h2>
                        <p className="text-sm text-[var(--laundry-muted)] leading-relaxed">
                            {post.desc}
                        </p>
                    </article>
                ))}
            </div>

            <div className="mt-12 text-center text-sm text-[var(--laundry-subtle)]">
                * 상세 게시글 페이지들은 준비 중입니다! 현재는 목록 아티클 형식을 제공합니다.
            </div>
        </main>
    );
}
