import { AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

// 이용약관 및 개인정보 처리방침 모달
export function TermsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    useBodyScrollLock(open);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl border-[var(--laundry-border)] animate-in zoom-in-95 duration-200 flex flex-col">
                <CardHeader className="border-b border-[var(--laundry-border)] bg-[var(--laundry-elevated)]">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <AlertCircle size={20} className="text-blue-600" />
                            이용약관 및 개인정보 처리방침
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </Button>
                    </div>
                    <CardDescription>데이터세탁소 서비스를 이용하시기 전 반드시 확인해 주세요.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-y-auto p-6 space-y-6 text-sm leading-relaxed text-[var(--laundry-muted)]">
                    <section>
                        <h5 className="font-bold text-[var(--laundry-text)] mb-2">1. 서비스의 성격</h5>
                        <p>본 서비스는 개인 개발자가 데이터 정제 편의를 위해 개발하고 운영하는 1인 프로젝트입니다. 기업 규모의 공식적인 서비스를 제공하기보다는 사용자의 업무 효율을 돕기 위한 도구적 성격이 강합니다.</p>
                    </section>

                    <section className="bg-[var(--laundry-info)]\/10/50 p-4 rounded-lg border border-blue-100">
                        <h5 className="font-bold text-blue-900 mb-2 flex items-center gap-1">
                            <Sparkles size={14} /> 2. 데이터 보안 (서버 저장 없음)
                        </h5>
                        <p className="text-blue-800">본 서비스의 가장 큰 특징은 <strong>사용자의 데이터를 서버로 전송하거나 저장하지 않는다는 것</strong>입니다. 모든 데이터 정제 로직은 귀하의 웹 브라우저 메모리 내(Web Worker)에서만 실행됩니다. 개발자를 포함한 그 누구도 귀하가 업로드한 파일을 열람하거나 수집할 수 없습니다.</p>
                    </section>

                    <section>
                        <h5 className="font-bold text-[var(--laundry-text)] mb-2">3. 책임의 한계</h5>
                        <p>데이터 정제 결과는 정규식 로직에 따라 생성되며, 100%의 정확성을 보장하지 않습니다. 정제 과정 중 발생할 수 있는 데이터의 손실, 변형, 오인으로 인한 어떠한 손해에 대해서도 1인 개발자인 운영자는 법적/경제적 책임을 지지 않습니다. <strong>중요 데이터는 반드시 사전에 원본을 백업하시기 바랍니다.</strong></p>
                    </section>

                    <section>
                        <h5 className="font-bold text-[var(--laundry-text)] mb-2">4. 서비스 이용 및 권한</h5>
                        <p>누구나 자유롭게 서비스를 이용할 수 있습니다. 단, 본 서비스의 소스코드나 로직을 허가 없이 상업적으로 재판매하거나 크롤링 등을 통해 서비스를 마비시키는 행위는 금지합니다.</p>
                    </section>

                    <section>
                        <h5 className="font-bold text-[var(--laundry-text)] mb-2">5. 연락처 및 피드백</h5>
                        <p>서비스 개선 제안이나 버그 리포트는 아래 이메일로 보내주시면 감사하겠습니다. (1인 개발 특성상 답변이 다소 늦어질 수 있는 점 양해 부탁드립니다.)</p>
                        <p className="mt-2 font-medium">Email: kblee7782@gmail.com</p>
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
