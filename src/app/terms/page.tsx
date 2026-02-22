import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "이용약관 - 데이터세탁소",
    description: "데이터세탁소 서비스 이용을 위한 약관 및 법적 고지사항에 대해 안내합니다."
};

export default function TermsPage() {
    return (
        <main className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-black mb-8" style={{ fontFamily: 'var(--font-display)' }}>
                이용약관
            </h1>
            <section className="bg-[var(--laundry-surface)] p-8 rounded border border-[var(--laundry-border)] text-[var(--laundry-muted)] leading-relaxed space-y-6">
                <div>
                    <h2 className="text-lg font-bold text-[var(--laundry-text)] mb-2">1. 목적</h2>
                    <p>본 약관은 "데이터세탁소"(이하 "서비스")가 제공하는 데이터 정제 및 변환 서비스의 이용과 관련하여, 회사와 사용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-[var(--laundry-text)] mb-2">2. 서비스의 성격 및 책임 한계</h2>
                    <p>
                        본 서비스는 사용자의 브라우저 내에서만 동작하며, 어떠한 데이터도 외부 서버로 전송, 저장, 수집하지 않습니다.
                        서비스를 통해 가공된 데이터의 정확성 및 결과물 사용으로 인해 발생하는 모든 책임은 전적으로 사용자 본인에게 있습니다.
                    </p>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-[var(--laundry-text)] mb-2">3. 저작권 및 사용 제한</h2>
                    <p>
                        본 서비스의 UI, 로고, 디자인, 코드 및 텍스트 등에 대한 저작권은 "데이터세탁소" 제공자에게 있습니다.
                        사용자는 서비스를 상업적 목적으로 재판매하거나 소스 코드를 무단 복제하여 사용할 수 없습니다.
                    </p>
                </div>
            </section>
        </main>
    );
}
