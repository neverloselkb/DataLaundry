import Link from 'next/link';
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "사용 가이드 - 데이터세탁소",
    description: "엑셀, CSV 파일 업로드부터 옵션 설정, AI 커스텀 정제까지 데이터세탁소를 200% 활용하는 방법을 알려드립니다."
};

export default function GuidePage() {
    return (
        <main className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-black mb-8" style={{ fontFamily: 'var(--font-display)' }}>
                데이터세탁소 사용 가이드
            </h1>
            <div className="space-y-6 text-[var(--laundry-muted)] leading-relaxed">
                <section className="bg-[var(--laundry-surface)] p-6 rounded border border-[var(--laundry-border)]">
                    <h2 className="text-xl font-bold text-[var(--laundry-text)] mb-4">1. 파일 업로드</h2>
                    <p>
                        데이터세탁소는 CSV, Excel (XLSX) 파일을 지원합니다. 메인 화면 중앙의 업로드 영역에 파일을 드래그 앤 드롭하거나,
                        영역을 클릭하여 컴퓨터에 있는 파일을 선택하세요. 브라우저 내부에서만 처리되므로 서버로 데이터가 절대 전송되지 않습니다.
                    </p>
                </section>

                <section className="bg-[var(--laundry-surface)] p-6 rounded border border-[var(--laundry-border)]">
                    <h2 className="text-xl font-bold text-[var(--laundry-text)] mb-4">2. 정제 옵션 선택</h2>
                    <p>
                        업로드가 완료되면 좌측 패널에 정제 옵션이 표시됩니다. "빠른 설정(프리셋)"을 통해 목적에 맞는 옵션들을 한 번에 선택할 수 있으며,
                        각 컬럼의 헤더에 있는 ⚙️(설정) 아이콘을 눌러 개별 컬럼마다 다른 정제 방식을 적용할 수도 있습니다.
                    </p>
                    <ul className="list-disc pl-5 mt-4 space-y-2">
                        <li><strong>개인정보 및 보안:</strong> 이메일 마스킹, 전화번호 마스킹, 주민등록번호 마스킹 등</li>
                        <li><strong>텍스트 정제:</strong> HTML 태그 제거, 띄어쓰기 1개로 통일, 대/소문자 변환 등</li>
                        <li><strong>금융 및 번호:</strong> 사업자등록번호 형식 일치, 원화(KRW) 화폐 단위 통일 등</li>
                    </ul>
                </section>

                <section className="bg-[var(--laundry-surface)] p-6 rounded border border-[var(--laundry-border)]">
                    <h2 className="text-xl font-bold text-[var(--laundry-text)] mb-4">3. 커스텀 프롬프트</h2>
                    <p>
                        단순 체크박스로 해결되지 않는 복잡한 패턴은 하단의 "추가 요청사항" 입력칸에 자연어로 적어주세요.
                        예: <code>"주소 컬럼에서 '서울특별시'를 '서울'로 줄여주고, '동' 이름만 따로 빼서 새로운 컬럼으로 만들어 줘"</code>
                    </p>
                </section>

                <section className="bg-[var(--laundry-surface)] p-6 rounded border border-[var(--laundry-border)]">
                    <h2 className="text-xl font-bold text-[var(--laundry-text)] mb-4">4. 결과 다운로드</h2>
                    <p>
                        세탁이 완료되면 우측 상단에 "다운로드" 버튼이 활성화됩니다.
                        정제 전/후의 내용을 엑셀에서 하이라이트된 상태로 비교하시려면 옵션에서 <strong>"수정된 셀 하이라이트"</strong>를 켜두세요.
                    </p>
                </section>
            </div>

            <div className="mt-12 text-center">
                <Link href="/" className="inline-block bg-[var(--laundry-accent)] text-[#18181B] font-bold px-6 py-3 rounded hover:bg-[var(--laundry-accent-hover)] transition-colors">
                    메인으로 돌아가기
                </Link>
            </div>
        </main>
    );
}
