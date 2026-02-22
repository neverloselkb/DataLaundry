import { FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

// 제작 가이드 모달 — 정제 우선순위, 데이터 준비, 자연어 활용법 설명
export function GuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    useBodyScrollLock(open);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl border-[var(--laundry-border)] animate-in zoom-in-95 duration-200 flex flex-col">
                <CardHeader className="border-b border-[var(--laundry-border)] bg-[var(--laundry-elevated)]">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileUp size={20} className="text-blue-600" />
                            데이터세탁소 제작 가이드
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </Button>
                    </div>
                    <CardDescription>최상의 정제 결과를 얻기 위한 데이터 준비 및 기술적 원칙을 소개합니다.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-y-auto p-6 space-y-8 text-sm leading-relaxed text-[var(--laundry-muted)]">
                    <section>
                        <h5 className="font-bold text-[var(--laundry-text)] mb-4 flex items-center gap-2 text-base">
                            🛡️ 정제 우선순위 5대 원칙
                        </h5>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { rank: 1, title: "잠금(Lock) 보호", desc: "잠긴 컬럼은 엔진이 절대 수정하지 않습니다. (보안 최우선)" },
                                { rank: 2, title: "개별 설정 우선", desc: "헤더에서 직접 지정한 형식이 전역 설정보다 먼저 적용됩니다." },
                                { rank: 3, title: "자연어 우선권", desc: "자연어에 특정 포맷이 있다면 프로그램 기본값보다 우선합니다." },
                                { rank: 4, title: "체크박스 선행", desc: "공통 옵션으로 기초 정제를 먼저 수행한 뒤 자연어를 입힙니다." },
                                { rank: 5, title: "자연어 최종 확정", desc: "자연어 처리는 가장 나중에 수행되어 이전 결과를 덮어씁니다." },
                            ].map((rule) => (
                                <div key={rule.rank} className="flex gap-3 p-2 rounded-lg bg-[var(--laundry-bg)] border border-[var(--laundry-border)] items-center">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-[var(--laundry-bg)] text-[10px] font-bold flex items-center justify-center">
                                        {rule.rank}
                                    </span>
                                    <div>
                                        <span className="font-bold text-xs text-[var(--laundry-text)] mr-2">{rule.title}</span>
                                        <span className="text-[11px] text-[var(--laundry-subtle)]">{rule.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-[var(--laundry-bg)] p-5 rounded-xl border border-[var(--laundry-border)]">
                        <h5 className="font-bold text-[var(--laundry-text)] mb-4 flex items-center gap-2 text-base">
                            📋 데이터 준비 가이드 (Best Practice)
                        </h5>
                        <div className="space-y-4">
                            <div>
                                <div className="font-semibold text-[var(--laundry-text)] text-xs mb-1">헤더(Header) 최적화</div>
                                <p className="text-[11px] text-[var(--laundry-subtle)]">첫 번째 행은 반드시 컬럼명(헤더)이어야 합니다. 중복된 컬럼명은 인식률을 떨어뜨리므로 가급적 고유한 이름을 사용해 주세요.</p>
                            </div>
                            <div>
                                <div className="font-semibold text-[var(--laundry-text)] text-xs mb-1">인코딩 및 용량</div>
                                <p className="text-[11px] text-[var(--laundry-subtle)]">UTF-8 인코딩을 권장하지만, 한글이 깨질 경우 EUC-KR 파일을 일반 텍스트로 복사하여 붙여넣거나 .xlsx 형식으로 업로드해 보세요.</p>
                            </div>
                            <div>
                                <div className="font-semibold text-[var(--laundry-text)] text-xs mb-1">특수문자 처리</div>
                                <p className="text-[11px] text-[var(--laundry-subtle)]">셀 내부에 줄바꿈이나 탭 기호가 많을 경우 정제 과정에서 데이터가 밀릴 수 있습니다. 업로드 전 불필요한 공백을 제거하면 가장 완벽한 결과가 나옵니다.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h5 className="font-bold text-[var(--laundry-text)] mb-4 flex items-center gap-2 text-base">
                            🚀 단계별 자연어 활용 가이드
                        </h5>
                        <div className="space-y-3">
                            <div className="p-3 bg-[var(--laundry-info)]\/10/50 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-[var(--laundry-info)] text-[10px] font-bold rounded">Lv.1 기초</span>
                                    <span className="text-sm font-bold text-blue-900">한 마디로 정리하기</span>
                                </div>
                                <p className="text-[11px] text-[var(--laundry-info)] mb-2">단순한 명령어로 전체 데이터를 빠르게 닦아냅니다.</p>
                                <ul className="text-[11px] space-y-1 text-[var(--laundry-subtle)] list-disc list-inside">
                                    <li>&quot;공백 다 지워줘&quot;</li>
                                    <li>&quot;HTML 태그 싹 다 지워줘&quot;</li>
                                    <li>&quot;모두 대문자로 변환해줘&quot;</li>
                                    <li>&quot;주소에서 시/도만 추출해줘&quot;</li>
                                </ul>
                            </div>

                            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded">Lv.2 중급</span>
                                    <span className="text-sm font-bold text-indigo-900">구체적으로 지시하기</span>
                                </div>
                                <p className="text-[11px] text-indigo-700 mb-2">원하는 형식이나 특정 데이터를 콕 집어 정제합니다.</p>
                                <ul className="text-[11px] space-y-1 text-[var(--laundry-subtle)] list-disc list-inside">
                                    <li>&quot;날짜 형식을 <span className="font-bold text-indigo-600 underline">yyyy/MM/dd</span>로 변경&quot; (구분자 지정)</li>
                                    <li>&quot;업체명 정규화 (<span className="font-bold text-indigo-600 underline">(주), 주식회사 제거</span>)&quot;</li>
                                    <li>&quot;담당자 성함에서 <span className="font-bold text-indigo-600 underline">직함은 다 지워줘</span>&quot;</li>
                                    <li>&quot;계좌/카드번호 <span className="font-bold text-indigo-600 underline">뒷자리 별표 마스킹</span>&quot;</li>
                                </ul>
                            </div>

                            <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded">Lv.3 고급</span>
                                    <span className="text-sm font-bold text-violet-900">패턴과 와일드카드 활용</span>
                                </div>
                                <p className="text-[11px] text-violet-700 mb-2">반복되는 복잡한 패턴을 한 번에 정밀 타격합니다.</p>
                                <ul className="text-[11px] space-y-1 text-[var(--laundry-subtle)] list-disc list-inside">
                                    <li>&quot;<span className="font-bold text-violet-600">[%d]원</span> 형식은 빈칸으로 변경&quot; (%d는 숫자 매칭)</li>
                                    <li>&quot;상태가 <span className="font-bold text-violet-600">&apos;active&apos;면 &apos;정상&apos;</span>으로 치환&quot;</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <h5 className="font-bold text-amber-900 mb-2 flex items-center gap-2 text-sm">
                            ✉️ 정제가 제대로 안 되시나요?
                        </h5>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                            특정 데이터 패턴이 정제되지 않거나 오류가 발생한다면, **해당 화면 스크린샷**과 **입력하신 자연어 명령어**를 아래 메일로 보내주세요.
                            엔진 고도화에 큰 도움이 됩니다!
                        </p>
                        <p className="mt-2 text-xs font-bold text-amber-900">Email: kblee7782@gmail.com</p>
                    </section>
                </CardContent>
                <CardFooter className="border-t border-[var(--laundry-border)] bg-[var(--laundry-elevated)] p-4 flex justify-end">
                    <Button onClick={onClose} className="bg-[var(--laundry-accent)] hover:bg-[var(--laundry-accent-hover)] text-[var(--laundry-bg)] px-8">
                        확인했습니다
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
