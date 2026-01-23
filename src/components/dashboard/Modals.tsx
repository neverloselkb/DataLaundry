import { Sparkles, FileUp, Bot, AlertCircle, RefreshCw, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DataIssue } from '@/types';

// 1. Donate Modal
export function DonateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
            <Card className="w-full max-w-md shadow-2xl border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden">
                <CardHeader className="text-center pb-2 bg-gradient-to-b from-blue-50 to-white">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="text-blue-600 h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">개발자 도와주기</CardTitle>
                    <CardDescription className="text-slate-500 mt-2 px-4">
                        데이터세탁소가 업무에 도움이 되셨나요?<br />
                        보내주시는 따뜻한 후원은 지속적인 서비스 개선과 운영에 큰 힘이 됩니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center p-8">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <img src="/kakaopay-qr.png" alt="KakaoPay QR Code" className="w-64 h-auto rounded-lg" />
                        </div>
                    </div>
                    <div className="mt-8 text-center space-y-2">
                        <p className="text-sm font-medium text-slate-700">카카오페이로 따뜻한 마음 전하기</p>
                        <p className="text-xs text-slate-400">QR 코드를 스캔하면 바로 후원하실 수 있습니다.</p>
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-50 p-4 flex justify-center">
                    <Button onClick={onClose} className="bg-slate-900 hover:bg-slate-800 text-white w-full py-6 text-lg font-bold">
                        커피 한 잔 후원하고 닫기 ☕
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// 2. Guide Modal
export function GuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
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
                <CardContent className="overflow-y-auto p-6 space-y-8 text-sm leading-relaxed text-slate-700">
                    <section>
                        <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                            ⚙️ 기술적 제작 원칙
                        </h5>
                        <p>데이터세탁소는 1인 개발자의 집념으로 **'속도, 보안, 정확도'**라는 세 가지 핵심 가치를 지키기 위해 설계되었습니다.</p>
                        <ul className="mt-3 space-y-2 list-none text-xs">
                            <li className="flex gap-2">
                                <span className="text-blue-600 font-bold">✔</span>
                                <span>**Client-Only Logic**: 민감한 데이터가 외부 서버로 나가지 않도록 100% 브라우저 내 연산 로직(Web Worker)을 고집합니다.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-blue-600 font-bold">✔</span>
                                <span>**Pattern-First Engine**: 단순 치환을 넘어 정규식 패턴 매칭 엔진을 탑재하여 수천 가지 변수를 처리합니다.</span>
                            </li>
                        </ul>
                    </section>

                    <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                            📋 데이터 준비 가이드 (Best Practice)
                        </h5>
                        <div className="space-y-4">
                            <div>
                                <div className="font-semibold text-slate-900 text-xs mb-1">헤더(Header) 최적화</div>
                                <p className="text-[11px] text-slate-500">첫 번째 행은 반드시 컬럼명(헤더)이어야 합니다. 중복된 컬럼명은 AI 인식률을 떨어뜨리므로 가급적 고유한 이름을 사용해 주세요.</p>
                            </div>
                            <div>
                                <div className="font-semibold text-slate-900 text-xs mb-1">인코딩 및 용량</div>
                                <p className="text-[11px] text-slate-500">UTF-8 인코딩을 권장하지만, 한글이 깨질 경우 EUC-KR 파일을 일반 텍스트로 복사하여 붙여넣거나 .xlsx 형식으로 업로드해 보세요.</p>
                            </div>
                            <div>
                                <div className="font-semibold text-slate-900 text-xs mb-1">특수문자 처리</div>
                                <p className="text-[11px] text-slate-500">셀 내부에 줄바꿈이나 탭 기호가 많을 경우 정제 과정에서 데이터가 밀릴 수 있습니다. 업로드 전 불필요한 공백을 제거하면 가장 완벽한 결과가 나옵니다.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                            💡 제작자의 팁: 자연어의 힘
                        </h5>
                        <p className="text-xs">
                            단순한 버튼 클릭도 강력하지만, 프롬프트 창에 **"`고객명`에서 (주) 포함된 건 다 지워줘"** 처럼 구체적으로 입력해 보세요.
                            데이터세탁소의 엔진은 단순 키워드가 아닌 사용자의 의도를 분석하도록 설계되었습니다.
                        </p>
                        <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100 italic text-[11px] text-indigo-700">
                            "데이터 정제는 기술이 아니라 예술입니다. 여러분의 소중한 데이터가 빛날 수 있도록 엔진을 매일 다듬고 있습니다."
                        </div>
                    </section>
                </CardContent>
                <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4 flex justify-end">
                    <Button onClick={onClose} className="bg-slate-900 hover:bg-slate-800 text-white px-8">
                        확인했습니다
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// 3. Help Modal
export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
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
                <CardContent className="overflow-y-auto p-6 space-y-8 text-sm leading-relaxed text-slate-700">
                    <section>
                        <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                            <Bot size={18} className="text-blue-600" /> 빠른 시작 가이드
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="font-bold text-slate-900 mb-1">1. 파일 업로드</div>
                                <p className="text-xs text-slate-500">정제할 CSV 또는 Excel 파일을 업로드하거나 화면에 끌어다 놓으세요.</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="font-bold text-slate-900 mb-1">2. 정제 시작</div>
                                <p className="text-xs text-slate-500">빠른 실행 옵션을 체크하거나 프롬프트 창에 원하는 명령어를 입력하세요.</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="font-bold text-slate-900 mb-1">3. 실시간 미리보기</div>
                                <p className="text-xs text-slate-500">AI가 정제한 결과를 실시간으로 확인하고 필요시 셀을 더블클릭해 직접 수정하세요.</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="font-bold text-slate-900 mb-1">4. 결과 다운로드</div>
                                <p className="text-xs text-slate-500">정제가 완료되면 엑셀 파일로 다운로드하여 업무에 즉시 활용하세요.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                            <Sparkles size={18} className="text-blue-600" /> 자연어 명령어 가이드
                        </h5>
                        <div className="space-y-3">
                            <div className="p-3 bg-blue-50/30 rounded-lg border border-blue-100/50">
                                <div className="font-semibold text-blue-900 mb-1">데이터 치환/매핑</div>
                                <p className="text-xs text-blue-800">"`주소` 컬럼의 '서울시'를 '서울특별시'로 변경해줘"</p>
                            </div>
                            <div className="p-3 bg-blue-50/30 rounded-lg border border-blue-100/50">
                                <div className="font-semibold text-blue-900 mb-1">빈칸 처리</div>
                                <p className="text-xs text-blue-800">"`비고` 컬럼의 데이터가 '없음'이면 빈칸으로 만들어줘"</p>
                            </div>
                            <div className="p-3 bg-blue-50/30 rounded-lg border border-blue-100/50">
                                <div className="font-semibold text-blue-900 mb-1">패턴(와일드카드) 활용</div>
                                <p className="text-xs text-blue-800">"`금액` 컬럼에서 `[%d]원` 형식은 빈칸으로 변경"</p>
                                <ul className="mt-2 text-[11px] text-blue-700/70 list-disc list-inside">
                                    <li><strong>%d</strong>: 임의의 숫자 (예: 123, 10, 5)</li>
                                    <li><strong>%s</strong>: 임의의 문자열 (예: 안녕하세요, 가나다)</li>
                                    <li><strong>%Nd</strong>: N자리의 숫자 (예: %3d {"->"} 532, 100)</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                            <AlertCircle size={18} className="text-blue-600" /> 자주 묻는 질문 (FAQ)
                        </h5>
                        <div className="space-y-4">
                            <div>
                                <div className="font-bold text-slate-900 mb-1 text-xs">Q. 내 데이터는 어디에 저장되나요?</div>
                                <p className="text-xs text-slate-600">본 서비스는 100% 로컬 브라우저 처리를 원칙으로 합니다. 데이터는 서버로 절대 전송되지 않으며, 귀하의 PC 안에서만 안전하게 정제됩니다.</p>
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 mb-1 text-xs">Q. 큰 파일도 처리 가능한가요?</div>
                                <p className="text-xs text-slate-600">네, 수만 행의 데이터도 Web Worker 기술을 통해 UI 멈춤 없이 빠르게 처리할 수 있습니다. 다만 기기 사양에 따라 속도 차이가 있을 수 있습니다.</p>
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 mb-1 text-xs">Q. 정제가 제대로 되지 않을 때는?</div>
                                <p className="text-xs text-slate-600">명령어에 사용한 컬럼명이 업로드한 파일의 헤더와 정확히 일치하는지 확인해 주세요. 따옴표를 사용하여 컬럼명을 명시하면 인식률이 높아집니다.</p>
                            </div>
                        </div>
                    </section>
                </CardContent>
                <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4 flex justify-end">
                    <Button onClick={onClose} className="bg-slate-900 hover:bg-slate-800 text-white px-8">
                        닫기
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// 4. Terms Modal
export function TermsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
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
                <CardContent className="overflow-y-auto p-6 space-y-6 text-sm leading-relaxed text-slate-700">
                    <section>
                        <h5 className="font-bold text-slate-900 mb-2">1. 서비스의 성격</h5>
                        <p>본 서비스는 개인 개발자가 데이터 정제 편의를 위해 개발하고 운영하는 1인 프로젝트입니다. 기업 규모의 공식적인 서비스를 제공하기보다는 사용자의 업무 효율을 돕기 위한 도구적 성격이 강합니다.</p>
                    </section>

                    <section className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <h5 className="font-bold text-blue-900 mb-2 flex items-center gap-1">
                            <Sparkles size={14} /> 2. 데이터 보안 (서버 저장 없음)
                        </h5>
                        <p className="text-blue-800">본 서비스의 가장 큰 특징은 <strong>사용자의 데이터를 서버로 전송하거나 저장하지 않는다는 것</strong>입니다. 모든 데이터 정제 로직은 귀하의 웹 브라우저 메모리 내(Web Worker)에서만 실행됩니다. 개발자를 포함한 그 누구도 귀하가 업로드한 파일을 열람하거나 수집할 수 없습니다.</p>
                    </section>

                    <section>
                        <h5 className="font-bold text-slate-900 mb-2">3. 책임의 한계</h5>
                        <p>데이터 정제 결과는 AI 모델과 정규식 로직에 따라 생성되며, 100%의 정확성을 보장하지 않습니다. 정제 과정 중 발생할 수 있는 데이터의 손실, 변형, 오인으로 인한 어떠한 손해에 대해서도 1인 개발자인 운영자는 법적/경제적 책임을 지지 않습니다. <strong>중요 데이터는 반드시 사전에 원본을 백업하시기 바랍니다.</strong></p>
                    </section>

                    <section>
                        <h5 className="font-bold text-slate-900 mb-2">4. 서비스 이용 및 권한</h5>
                        <p>누구나 자유롭게 서비스를 이용할 수 있습니다. 단, 본 서비스의 소스코드나 로직을 허가 없이 상업적으로 재판매하거나 크롤링 등을 통해 서비스를 마비시키는 행위는 금지합니다.</p>
                    </section>

                    <section>
                        <h5 className="font-bold text-slate-900 mb-2">5. 연락처 및 피드백</h5>
                        <p>서비스 개선 제안이나 버그 리포트는 아래 이메일로 보내주시면 감사하겠습니다. (1인 개발 특성상 답변이 다소 늦어질 수 있는 점 양해 부탁드립니다.)</p>
                        <p className="mt-2 font-medium">Email: pentiumman@naver.com</p>
                    </section>
                </CardContent>
                <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4 flex justify-end">
                    <Button onClick={onClose} className="bg-slate-900 hover:bg-slate-800 text-white px-8">
                        확인했습니다
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// 5. Fix Modal
interface FixModalProps {
    open: boolean;
    onClose: () => void;
    targetIssue: DataIssue | null;
    replacementValue: string;
    setReplacementValue: (val: string) => void;
    onApply: () => void;
}

export function FixModal({ open, onClose, targetIssue, replacementValue, setReplacementValue, onApply }: FixModalProps) {
    if (!open || !targetIssue) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
            <Card className="w-[400px] shadow-lg border-slate-200 animate-in zoom-in-95 duration-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <RefreshCw size={18} className="text-blue-600" />
                        데이터 일괄 수정
                    </CardTitle>
                    <CardDescription>
                        '{targetIssue.column}' 컬럼의 길이 초과 데이터 <strong>{targetIssue.affectedRows?.length}건</strong>을 일괄 변경합니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="mb-2 block">변경할 값 입력</Label>
                        <input
                            type="text"
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="예: 공란으로 두면 빈 값으로 대체됨"
                            value={replacementValue}
                            onChange={(e) => setReplacementValue(e.target.value)}
                            autoFocus
                        />
                        <p className="text-[11px] text-slate-500 mt-1">* 입력하신 값으로 해당 데이터들이 모두 치환됩니다.</p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-slate-50/50 p-4">
                    <Button variant="ghost" onClick={onClose}>취소</Button>
                    <Button onClick={onApply} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <RefreshCw size={14} className="mr-1" /> 일괄 적용
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
