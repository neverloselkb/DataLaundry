import { Bot, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

// 도움말 센터 모달 — 빠른 시작, 자연어 명령, FAQ
export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    useBodyScrollLock(open);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl border-[var(--laundry-border)] animate-in zoom-in-95 duration-200 flex flex-col">
                <CardHeader className="border-b border-[var(--laundry-border)] bg-[var(--laundry-elevated)]">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Bot size={20} className="text-blue-600" />
                            데이터세탁소 도움말 센터
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </Button>
                    </div>
                    <CardDescription>서비스의 핵심 기능과 사용 팁을 확인해 보세요.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-y-auto p-6 space-y-8 text-sm leading-relaxed text-[var(--laundry-muted)]">
                    <section>
                        <h5 className="font-bold text-[var(--laundry-text)] mb-4 flex items-center gap-2 text-base">
                            <Bot size={18} className="text-blue-600" /> 빠른 시작 가이드
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[var(--laundry-bg)] p-3 rounded-lg border border-[var(--laundry-border)]">
                                <div className="font-bold text-[var(--laundry-text)] mb-1">1. 파일 업로드</div>
                                <p className="text-xs text-[var(--laundry-subtle)]">정제할 CSV 또는 Excel 파일을 업로드하거나 화면에 끌어다 놓으세요.</p>
                            </div>
                            <div className="bg-[var(--laundry-bg)] p-3 rounded-lg border border-[var(--laundry-border)]">
                                <div className="font-bold text-[var(--laundry-text)] mb-1">2. 정제 시작</div>
                                <p className="text-xs text-[var(--laundry-subtle)]">빠른 실행 옵션을 체크하거나 프롬프트 창에 원하는 명령어를 입력하세요.</p>
                            </div>
                            <div className="bg-[var(--laundry-bg)] p-3 rounded-lg border border-[var(--laundry-border)]">
                                <div className="font-bold text-[var(--laundry-text)] mb-1">3. 실시간 미리보기</div>
                                <p className="text-xs text-[var(--laundry-subtle)]">스마트 엔진이 정제한 결과를 실시간으로 확인하고 필요시 셀을 더블클릭해 직접 수정하세요.</p>
                            </div>
                            <div className="bg-[var(--laundry-bg)] p-3 rounded-lg border border-[var(--laundry-border)]">
                                <div className="font-bold text-[var(--laundry-text)] mb-1">4. 결과 다운로드</div>
                                <p className="text-xs text-[var(--laundry-subtle)]">정제가 완료되면 엑셀 파일로 다운로드하여 업무에 즉시 활용하세요.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h5 className="font-bold text-[var(--laundry-text)] mb-4 flex items-center gap-2 text-base">
                            <Sparkles size={18} className="text-blue-600" /> 자연어 명령어 가이드
                        </h5>
                        <div className="space-y-3">
                            <div className="p-3 bg-[var(--laundry-info)]\/10/30 rounded-lg border border-blue-100/50">
                                <div className="font-semibold text-blue-900 mb-1">데이터 치환/매핑</div>
                                <p className="text-xs text-blue-800">&quot;`주소` 컬럼의 &apos;서울시&apos;를 &apos;서울특별시&apos;로 변경해줘&quot;</p>
                            </div>
                            <div className="p-3 bg-[var(--laundry-info)]\/10/30 rounded-lg border border-blue-100/50">
                                <div className="font-semibold text-blue-900 mb-1">빈칸 처리</div>
                                <p className="text-xs text-blue-800">&quot;`비고` 컬럼의 데이터가 &apos;없음&apos;이면 빈칸으로 만들어줘&quot;</p>
                            </div>
                            <div className="p-3 bg-[var(--laundry-info)]\/10/30 rounded-lg border border-blue-100/50">
                                <div className="font-semibold text-blue-900 mb-1">패턴(와일드카드) 활용</div>
                                <p className="text-xs text-blue-800">&quot;`금액` 컬럼에서 `[%d]원` 형식은 빈칸으로 변경&quot;</p>
                                <ul className="mt-2 text-[11px] text-[var(--laundry-info)]/70 list-disc list-inside">
                                    <li><strong>%d</strong>: 임의의 숫자 (예: 123, 10, 5)</li>
                                    <li><strong>%s</strong>: 임의의 문자열 (예: 안녕하세요, 가나다)</li>
                                    <li><strong>%Nd</strong>: N자리의 숫자 (예: %3d {"->"} 532, 100)</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h5 className="font-bold text-[var(--laundry-text)] mb-4 flex items-center gap-2 text-base">
                            <AlertCircle size={18} className="text-blue-600" /> 자주 묻는 질문 (FAQ)
                        </h5>
                        <div className="space-y-4">
                            <div>
                                <div className="font-bold text-[var(--laundry-text)] mb-1 text-xs">Q. 내 데이터는 어디에 저장되나요?</div>
                                <p className="text-xs text-[var(--laundry-subtle)]">본 서비스는 100% 로컬 브라우저 처리를 원칙으로 합니다. 데이터는 서버로 절대 전송되지 않으며, 귀하의 PC 안에서만 안전하게 정제됩니다.</p>
                            </div>
                            <div>
                                <div className="font-bold text-[var(--laundry-text)] mb-1 text-xs">Q. 큰 파일도 처리 가능한가요?</div>
                                <p className="text-xs text-[var(--laundry-subtle)]">네, 수만 행의 데이터도 Web Worker 기술을 통해 UI 멈춤 없이 빠르게 처리할 수 있습니다. 다만 기기 사양에 따라 속도 차이가 있을 수 있습니다.</p>
                            </div>
                            <div>
                                <div className="font-bold text-[var(--laundry-text)] mb-1 text-xs">Q. 정제가 제대로 되지 않을 때는?</div>
                                <p className="text-xs text-[var(--laundry-subtle)]">명령어에 사용한 컬럼명이 업로드한 파일의 헤더와 정확히 일치하는지 확인해 주세요. 따옴표를 사용하여 컬럼명을 명시하면 인식률이 높아집니다.</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-4">
                        <h5 className="font-bold text-amber-900 mb-2 flex items-center gap-2 text-sm">
                            ✉️ 정제가 제대로 안 되시나요?
                        </h5>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                            특정 데이터 패턴이 정제되지 않거나 오류가 발생한다면, **해당 화면 스크린샷**과 **입력하신 자연어 명령어**를 개발자 메일로 보내주세요.
                        </p>
                        <p className="mt-2 text-xs font-bold text-amber-900">Email: kblee7782@gmail.com</p>
                    </section>
                </CardContent>
                <CardFooter className="border-t border-[var(--laundry-border)] bg-[var(--laundry-elevated)] p-4 flex justify-end">
                    <Button onClick={onClose} className="bg-[var(--laundry-accent)] hover:bg-[var(--laundry-accent-hover)] text-[var(--laundry-bg)] px-8">
                        닫기
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
