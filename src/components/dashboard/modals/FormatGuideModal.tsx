import { useState } from 'react';
import { Sparkles, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

// 가이드 테이블 — 옵션별 Before/After 비교 표시
function GuideTable({ items }: { items: { option: string; desc: string; input: string; output: string }[] }) {
    return (
        <div className="overflow-hidden rounded-lg border border-[var(--laundry-border)]">
            <table className="w-full text-sm text-left">
                <thead className="bg-[var(--laundry-bg)] text-[var(--laundry-muted)] font-semibold border-b border-[var(--laundry-border)]">
                    <tr>
                        <th className="p-3 w-[20%]">옵션명</th>
                        <th className="p-3 w-[30%]">설명</th>
                        <th className="p-3 w-[25%] text-[var(--laundry-subtle)]">Before</th>
                        <th className="p-3 w-[25%] text-blue-600">After</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[var(--laundry-elevated)]">
                            <td className="p-3 font-medium text-[var(--laundry-text)]">{item.option}</td>
                            <td className="p-3 text-[var(--laundry-subtle)] text-xs">{item.desc}</td>
                            <td className="p-3 text-[var(--laundry-subtle)] font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px]" title={item.input}>{item.input}</td>
                            <td className="p-3 text-blue-600 font-bold font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px]" title={item.output}>{item.output}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// 데이터 형식 가이드 모달 — 탭별 옵션 설명 (기본, 비즈니스, 업종, FAQ)
export function FormatGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'basic' | 'business' | 'industry' | 'faq'>('basic');
    useBodyScrollLock(open);

    if (!open) return null;

    // 탭 버튼 컴포넌트 — 활성 상태에 따라 스타일 변경
    const TabButton = ({ id, label }: { id: typeof activeTab; label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-all ${activeTab === id
                ? 'bg-[var(--laundry-surface)] text-[var(--laundry-text)] shadow-sm ring-1 ring-slate-200'
                : 'text-[var(--laundry-subtle)] hover:text-[var(--laundry-text)] hover:bg-slate-200/50'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl border-[var(--laundry-border)] animate-in zoom-in-95 duration-200 flex flex-col">
                <CardHeader className="border-b border-[var(--laundry-border)] bg-[var(--laundry-elevated)] pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <TableIcon size={20} className="text-blue-600" />
                            데이터 형식 가이드
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </Button>
                    </div>
                </CardHeader>

                <div className="flex-1 flex flex-col overflow-hidden bg-[var(--laundry-surface)]">
                    <div className="border-b border-[var(--laundry-border)] px-6 pt-4 pb-0">
                        {/* 우선순위 안내 */}
                        <div className="mb-4 p-3 bg-[var(--laundry-info)]\/10 border border-blue-100 rounded-lg flex items-start gap-3">
                            <div className="bg-blue-600 p-1 rounded-md text-[var(--laundry-bg)] mt-0.5 shrink-0">
                                <Sparkles size={14} />
                            </div>
                            <div>
                                <h5 className="text-[11px] font-bold text-blue-900 mb-0.5">정제 우선순위 안내</h5>
                                <p className="text-[10px] text-blue-800 leading-relaxed">
                                    <span className="font-bold underlineDecoration-dashed">잠금(Lock)</span> &gt;
                                    <span className="font-bold"> 개별 설정</span> &gt;
                                    <span className="font-bold"> 전역 옵션(체크박스)</span> &gt;
                                    <span className="font-bold text-[var(--laundry-info)]"> 자동 감지</span> 순서로 적용됩니다.<br />
                                    개별 컬럼에 포맷을 지정하면 전역 체크박스가 꺼져 있어도 해당 컬럼은 무조건 정제됩니다.
                                </p>
                            </div>
                        </div>

                        <div className="bg-[var(--laundry-elevated)] p-1 rounded-lg flex space-x-1 mb-4">
                            <TabButton id="basic" label="기본/포맷팅" />
                            <TabButton id="business" label="비즈니스" />
                            <TabButton id="industry" label="업종 특화 (NEW)" />
                            <TabButton id="faq" label="자연어 예시" />
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1">
                        {activeTab === 'basic' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h4 className="font-bold text-[var(--laundry-text)] flex items-center gap-2">
                                    🛠 기본 및 포맷팅 (Basic Formatting)
                                </h4>
                                <GuideTable items={[
                                    { option: "공백 제거", desc: "앞뒤 공백만 제거", input: "  홍길동  ", output: "홍길동" },
                                    { option: "HTML 태그 제거", desc: "웹소스 코드 삭제", input: "<p>안녕하세요</p>", output: "안녕하세요" },
                                    { option: "이모지 제거", desc: "이모티콘, 특수 그림문자 삭제", input: "반가워요 👋✨", output: "반가워요 " },
                                    { option: "대문자 변환", desc: "영문 소문자를 대문자로", input: "apple", output: "APPLE" },
                                    { option: "소문자 변환", desc: "영문 대문자를 소문자로", input: "USA", output: "usa" },
                                    { option: "날짜 형식", desc: "YYYY.MM.DD 통일", input: "2024-1-1", output: "2024.01.01" },
                                    { option: "일시 형식", desc: "초 포함 YYYY.MM.DD HH:mm:ss", input: "24/1/1 9:30", output: "2024.01.01 09:30:00" },
                                    { option: "숫자 콤마", desc: "천단위 구분 기호", input: "1234500", output: "1,234,500" },
                                    { option: "우편번호", desc: "잘못된 자릿수 정리 (5자리)", input: "123-456", output: "12345" },
                                ]} />
                            </div>
                        )}

                        {activeTab === 'business' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h4 className="font-bold text-[var(--laundry-text)] flex items-center gap-2">
                                    💼 비즈니스 & 연락처 (Business)
                                </h4>
                                <GuideTable items={[
                                    { option: "휴대폰 번호", desc: "하이픈 규격화", input: "01012345678", output: "010-1234-5678" },
                                    { option: "유선전화", desc: "지역번호 포함 포맷", input: "021234567", output: "02-123-4567" },
                                    { option: "사업자번호", desc: "10자리 하이픈", input: "1234567890", output: "123-45-67890" },
                                    { option: "법인번호", desc: "13자리 하이픈", input: "1101111234567", output: "110111-1234567" },
                                    { option: "URL 표준화", desc: "https:// 프로토콜 추가", input: "www.naver.com", output: "https://www.naver.com" },
                                    { option: "개인정보 마스킹", desc: "주민번호 뒷자리 가림", input: "990101-1234567", output: "990101-*******" },
                                ]} />
                            </div>
                        )}

                        {activeTab === 'industry' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h4 className="font-bold text-[var(--laundry-text)] flex items-center gap-2">
                                    🏭 업종별 특화 (Industry Specific)
                                </h4>
                                <GuideTable items={[
                                    { option: "운송장번호 (쇼핑몰)", desc: "지수 표기 제거, 숫자만", input: "1.23E+11, 12-34", output: "123000000000, 1234" },
                                    { option: "주문번호 (쇼핑몰)", desc: "특수문자 제거", input: "ORDER_#001", output: "ORDER001" },
                                    { option: "세무용 날짜 (세무)", desc: "8자리 YYYYMMDD", input: "2024-01-01", output: "20240101" },
                                    { option: "회계 음수 (재무)", desc: "괄호/세모 -> 마이너스", input: "(1,000), △500", output: "-1000, -500" },
                                    { option: "면적 단위 제거 (부동산)", desc: "평, ㎡ 제거 후 숫자화", input: "32평, 84㎡", output: "32, 84" },
                                    { option: "SNS ID (마케팅)", desc: "URL/@ 제거", input: "instagram.com/user, @id", output: "user, id" },
                                    { option: "해시태그 (마케팅)", desc: "공백->언더바, # 추가", input: "맛집 추천", output: "#맛집_추천" },
                                ]} />
                            </div>
                        )}

                        {activeTab === 'faq' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-[var(--laundry-info)]\/10 p-4 rounded-lg border border-blue-100">
                                    <h5 className="font-bold text-blue-900 mb-2">💬 자연어 처리 예시</h5>
                                    <p className="text-sm text-blue-800 mb-4">
                                        복잡한 설정 없이, 채팅창에 말하듯이 입력하면 엔진이 자동으로 의도를 파악합니다.
                                    </p>
                                    <ul className="space-y-2 text-sm text-[var(--laundry-muted)]">
                                        <li className="flex gap-2 items-start">
                                            <span className="text-[var(--laundry-info)] font-bold">Q.</span>
                                            <span>&quot;운송장번호가 엑셀에서 E+11 처럼 깨져요.&quot;</span>
                                        </li>
                                        <li className="flex gap-2 items-start mb-2">
                                            <span className="text-green-600 font-bold">A.</span>
                                            <span className="bg-[var(--laundry-surface)] px-2 py-0.5 rounded border border-[var(--laundry-border)] text-xs text-[var(--laundry-subtle)] font-mono">formatTrackingNum</span>
                                            <span>옵션이 자동 적용되어 숫자로 변환됩니다.</span>
                                        </li>
                                        <hr className="border-blue-200/50" />
                                        <li className="flex gap-2 items-start">
                                            <span className="text-[var(--laundry-info)] font-bold">Q.</span>
                                            <span>&quot;세무 신고해야 하는데 날짜 8자리로 바꾸고 싶어.&quot;</span>
                                        </li>
                                        <li className="flex gap-2 items-start">
                                            <span className="text-green-600 font-bold">A.</span>
                                            <span className="bg-[var(--laundry-surface)] px-2 py-0.5 rounded border border-[var(--laundry-border)] text-xs text-[var(--laundry-subtle)] font-mono">formatTaxDate</span>
                                            <span>옵션이 켜지며 &quot;20240101&quot; 형태로 변환됩니다.</span>
                                        </li>
                                        <hr className="border-blue-200/50" />
                                        <li className="flex gap-2 items-start">
                                            <span className="text-[var(--laundry-info)] font-bold">Q.</span>
                                            <span>&quot;가격이 10000보다 크면 &apos;High&apos;로 바꾸고 싶어요.&quot;</span>
                                        </li>
                                        <li className="flex gap-2 items-start">
                                            <span className="text-green-600 font-bold">A.</span>
                                            <div className="flex flex-col gap-1">
                                                <span><strong>조건부 값 변경</strong>도 가능합니다! 단, 띄어쓰기를 꼭 지켜주세요.</span>
                                                <div className="p-2 bg-[var(--laundry-surface)] rounded border border-[var(--laundry-border)] text-xs text-[var(--laundry-subtle)]">
                                                    <span className="text-red-500 font-bold text-[10px] mr-1">[X]</span>
                                                    price가10000이상이면High로... (인식 불가 🙅‍♂️)<br />
                                                    <span className="text-green-600 font-bold text-[10px] mr-1">[O]</span>
                                                    <strong>price가 10000 이상</strong>이면 <strong>&apos;High&apos;</strong>로 바꿔줘 (인식 성공 🙆‍♂️)
                                                </div>
                                                <span className="text-[11px] text-slate-400 mt-0.5">* &quot;컬럼명 / 숫자 / 조건&quot; 사이는 반드시 띄어써야 합니다.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                    <h5 className="font-bold text-amber-900 mb-2 flex items-center gap-2 text-xs">
                                        ✉️ 정제가 제대로 안 되시나요?
                                    </h5>
                                    <p className="text-[10px] text-amber-800 leading-relaxed">
                                        특정 데이터가 정제되지 않는다면 **화면 스크린샷**과 **명령어**를 메일로 보내주세요. 고도화에 반영하겠습니다.
                                        <br /><strong>Email: kblee7782@gmail.com</strong>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <CardFooter className="border-t border-[var(--laundry-border)] bg-[var(--laundry-elevated)] p-4 flex justify-end">
                    <Button onClick={onClose} className="bg-[var(--laundry-accent)] hover:bg-[var(--laundry-accent-hover)] text-[var(--laundry-bg)] px-8">
                        확인 완료
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
