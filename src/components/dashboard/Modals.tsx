import { Sparkles, FileUp, Bot, AlertCircle, RefreshCw, Github, TableIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DataIssue } from '@/types';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { AdBanner } from './AdBanner'; // [NEW]

// 1. Donate Modal
export function DonateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    useBodyScrollLock(open);
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
    useBodyScrollLock(open);
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
                                <div key={rule.rank} className="flex gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100 items-center">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                                        {rule.rank}
                                    </span>
                                    <div>
                                        <span className="font-bold text-xs text-slate-800 mr-2">{rule.title}</span>
                                        <span className="text-[11px] text-slate-500">{rule.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                            📋 데이터 준비 가이드 (Best Practice)
                        </h5>
                        <div className="space-y-4">
                            <div>
                                <div className="font-semibold text-slate-900 text-xs mb-1">헤더(Header) 최적화</div>
                                <p className="text-[11px] text-slate-500">첫 번째 행은 반드시 컬럼명(헤더)이어야 합니다. 중복된 컬럼명은 인식률을 떨어뜨리므로 가급적 고유한 이름을 사용해 주세요.</p>
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
                            🚀 단계별 자연어 활용 가이드
                        </h5>
                        <div className="space-y-3">
                            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">Lv.1 기초</span>
                                    <span className="text-sm font-bold text-blue-900">한 마디로 정리하기</span>
                                </div>
                                <p className="text-[11px] text-blue-700 mb-2">단순한 명령어로 전체 데이터를 빠르게 닦아냅니다.</p>
                                <ul className="text-[11px] space-y-1 text-slate-600 list-disc list-inside">
                                    <li>"공백 다 지워줘"</li>
                                    <li>"HTML 태그 싹 다 지워줘"</li>
                                    <li>"모두 대문자로 변환해줘"</li>
                                    <li>"주소에서 시/도만 추출해줘"</li>
                                </ul>
                            </div>

                            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded">Lv.2 중급</span>
                                    <span className="text-sm font-bold text-indigo-900">구체적으로 지시하기</span>
                                </div>
                                <p className="text-[11px] text-indigo-700 mb-2">원하는 형식이나 특정 데이터를 콕 집어 정제합니다.</p>
                                <ul className="text-[11px] space-y-1 text-slate-600 list-disc list-inside">
                                    <li>"날짜 형식을 <span className="font-bold text-indigo-600 underline">yyyy/MM/dd</span>로 변경" (구분자 지정)</li>
                                    <li>"업체명 정규화 (<span className="font-bold text-indigo-600 underline">(주), 주식회사 제거</span>)"</li>
                                    <li>"담당자 성함에서 <span className="font-bold text-indigo-600 underline">직함은 다 지워줘</span>"</li>
                                    <li>"계좌/카드번호 <span className="font-bold text-indigo-600 underline">뒷자리 별표 마스킹</span>"</li>
                                </ul>
                            </div>

                            <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded">Lv.3 고급</span>
                                    <span className="text-sm font-bold text-violet-900">패턴과 와일드카드 활용</span>
                                </div>
                                <p className="text-[11px] text-violet-700 mb-2">반복되는 복잡한 패턴을 한 번에 정밀 타격합니다.</p>
                                <ul className="text-[11px] space-y-1 text-slate-600 list-disc list-inside">
                                    <li>"<span className="font-bold text-violet-600">[%d]원</span> 형식은 빈칸으로 변경" (%d는 숫자 매칭)</li>
                                    <li>"상태가 <span className="font-bold text-violet-600">'active'면 '정상'</span>으로 치환"</li>
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
                        <p className="mt-2 text-xs font-bold text-amber-900">Email: pentiumman@naver.com</p>
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

import { useState } from 'react';

// ... (imports)

// 3. Format Guide Modal
export function FormatGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'basic' | 'business' | 'industry' | 'faq'>('basic');
    useBodyScrollLock(open);

    if (!open) return null;

    const GuideTable = ({ items }: { items: { option: string; desc: string; input: string; output: string }[] }) => (
        <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="p-3 w-[20%]">옵션명</th>
                        <th className="p-3 w-[30%]">설명</th>
                        <th className="p-3 w-[25%] text-slate-500">Before</th>
                        <th className="p-3 w-[25%] text-blue-600">After</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-medium text-slate-900">{item.option}</td>
                            <td className="p-3 text-slate-600 text-xs">{item.desc}</td>
                            <td className="p-3 text-slate-500 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px]" title={item.input}>{item.input}</td>
                            <td className="p-3 text-blue-600 font-bold font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px]" title={item.output}>{item.output}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const TabButton = ({ id, label }: { id: typeof activeTab; label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-all ${activeTab === id
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
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

                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    <div className="border-b border-slate-200 px-6 pt-4 pb-0">
                        {/* Priority Guide Alert */}
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                            <div className="bg-blue-600 p-1 rounded-md text-white mt-0.5 shrink-0">
                                <Sparkles size={14} />
                            </div>
                            <div>
                                <h5 className="text-[11px] font-bold text-blue-900 mb-0.5">정제 우선순위 안내</h5>
                                <p className="text-[10px] text-blue-800 leading-relaxed">
                                    <span className="font-bold underlineDecoration-dashed">잠금(Lock)</span> &gt;
                                    <span className="font-bold"> 개별 설정</span> &gt;
                                    <span className="font-bold"> 전역 옵션(체크박스)</span> &gt;
                                    <span className="font-bold text-blue-500"> 자동 감지</span> 순서로 적용됩니다.<br />
                                    개별 컬럼에 포맷을 지정하면 전역 체크박스가 꺼져 있어도 해당 컬럼은 무조건 정제됩니다.
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-100 p-1 rounded-lg flex space-x-1 mb-4">
                            <TabButton id="basic" label="기본/포맷팅" />
                            <TabButton id="business" label="비즈니스" />
                            <TabButton id="industry" label="업종 특화 (NEW)" />
                            <TabButton id="faq" label="자연어 예시" />
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1">
                        {activeTab === 'basic' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
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
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
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
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
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
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <h5 className="font-bold text-blue-900 mb-2">💬 자연어 처리 예시</h5>
                                    <p className="text-sm text-blue-800 mb-4">
                                        복잡한 설정 없이, 채팅창에 말하듯이 입력하면 엔진이 자동으로 의도를 파악합니다.
                                    </p>
                                    <ul className="space-y-2 text-sm text-slate-700">
                                        <li className="flex gap-2 items-start">
                                            <span className="text-blue-500 font-bold">Q.</span>
                                            <span>"운송장번호가 엑셀에서 E+11 처럼 깨져요."</span>
                                        </li>
                                        <li className="flex gap-2 items-start mb-2">
                                            <span className="text-green-600 font-bold">A.</span>
                                            <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-xs text-slate-500 font-mono">formatTrackingNum</span>
                                            <span>옵션이 자동 적용되어 숫자로 변환됩니다.</span>
                                        </li>
                                        <hr className="border-blue-200/50" />
                                        <li className="flex gap-2 items-start">
                                            <span className="text-blue-500 font-bold">Q.</span>
                                            <span>"세무 신고해야 하는데 날짜 8자리로 바꾸고 싶어."</span>
                                        </li>
                                        <li className="flex gap-2 items-start">
                                            <span className="text-green-600 font-bold">A.</span>
                                            <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-xs text-slate-500 font-mono">formatTaxDate</span>
                                            <span>옵션이 켜지며 "20240101" 형태로 변환됩니다.</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                    <h5 className="font-bold text-amber-900 mb-2 flex items-center gap-2 text-xs">
                                        ✉️ 정제가 제대로 안 되시나요?
                                    </h5>
                                    <p className="text-[10px] text-amber-800 leading-relaxed">
                                        특정 데이터가 정제되지 않는다면 **화면 스크린샷**과 **명령어**를 메일로 보내주세요. 고도화에 반영하겠습니다.
                                        <br /><strong>Email: pentiumman@naver.com</strong>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4 flex justify-end">
                    <Button onClick={onClose} className="bg-slate-900 hover:bg-slate-800 text-white px-8">
                        확인 완료
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// 4. Help Modal
export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    useBodyScrollLock(open);
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
                                <p className="text-xs text-slate-500">스마트 엔진이 정제한 결과를 실시간으로 확인하고 필요시 셀을 더블클릭해 직접 수정하세요.</p>
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

                    <section className="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-4">
                        <h5 className="font-bold text-amber-900 mb-2 flex items-center gap-2 text-sm">
                            ✉️ 정제가 제대로 안 되시나요?
                        </h5>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                            특정 데이터 패턴이 정제되지 않거나 오류가 발생한다면, **해당 화면 스크린샷**과 **입력하신 자연어 명령어**를 개발자 메일로 보내주세요.
                        </p>
                        <p className="mt-2 text-xs font-bold text-amber-900">Email: pentiumman@naver.com</p>
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
    useBodyScrollLock(open);
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
                        <p>데이터 정제 결과는 정규식 로직에 따라 생성되며, 100%의 정확성을 보장하지 않습니다. 정제 과정 중 발생할 수 있는 데이터의 손실, 변형, 오인으로 인한 어떠한 손해에 대해서도 1인 개발자인 운영자는 법적/경제적 책임을 지지 않습니다. <strong>중요 데이터는 반드시 사전에 원본을 백업하시기 바랍니다.</strong></p>
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
    useBodyScrollLock(open);
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

// 6. Confirm Modal
interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    icon?: React.ReactNode;
}

export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel = "확인", cancelLabel = "취소", icon }: ConfirmModalProps) {
    useBodyScrollLock(open);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
            <Card className="w-[400px] shadow-2xl border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden">
                <CardHeader className="pb-3 text-center">
                    <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                        {icon || <AlertCircle className="text-amber-600 h-6 w-6" />}
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
                    <CardDescription className="text-slate-500 mt-2 whitespace-pre-wrap leading-relaxed">{description}</CardDescription>
                </CardHeader>

                {/* AD Slot: Modal-Confirm (Center) - [Moved] */}
                <div className="py-2 border-y border-slate-50">
                    <AdBanner slot="9999990001" className="bg-transparent" />
                </div>

                <CardFooter className="flex justify-center gap-3 p-6 pt-2">
                    <Button variant="outline" onClick={onClose} className="flex-1 py-6 border-slate-200 text-slate-600 hover:bg-slate-50">
                        {cancelLabel}
                    </Button>
                    <Button onClick={onConfirm} className="flex-1 py-6 bg-slate-900 hover:bg-slate-800 text-white font-bold">
                        {confirmLabel}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// 7. Alert Modal (Simple Success/Info)
interface AlertModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    buttonLabel?: string;
    type?: 'success' | 'info';
}

export function AlertModal({ open, onClose, title, description, buttonLabel = "확인", type = 'success' }: AlertModalProps) {
    useBodyScrollLock(open);
    if (!open) return null;

    const icon = type === 'success'
        ? <Sparkles className="text-green-600 h-6 w-6" />
        : <AlertCircle className="text-blue-600 h-6 w-6" />;
    const bg = type === 'success' ? 'bg-green-100' : 'bg-blue-100';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
            <Card className="w-[380px] shadow-2xl border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden">
                <CardHeader className="pb-3 text-center">
                    <div className={`mx-auto w-12 h-12 ${bg} rounded-full flex items-center justify-center mb-2`}>
                        {icon}
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
                    <CardDescription className="text-slate-500 mt-2 whitespace-pre-wrap leading-relaxed">{description}</CardDescription>
                </CardHeader>

                {/* AD Slot: Modal-Alert (Center) - [Moved] */}
                <div className="py-2 border-y border-slate-50">
                    <AdBanner slot="9999990002" className="bg-transparent" />
                </div>

                <CardFooter className="p-6 pt-2">
                    <Button onClick={onClose} className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-bold">
                        {buttonLabel}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
// 8. Cleaning Completion Ad Modal (Popup after processing)
interface AdCompletionModalProps {
    open: boolean;
    onClose: () => void;
}

export function AdCompletionModal({ open, onClose }: AdCompletionModalProps) {
    useBodyScrollLock(open);
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <Card className="w-full max-w-md shadow-2xl border-slate-200 animate-in zoom-in-95 duration-300 overflow-hidden bg-white">
                <CardHeader className="text-center pb-4 pt-8 bg-gradient-to-b from-blue-50/50 to-white">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-inner ring-4 ring-blue-50">
                        <Sparkles className="text-blue-600 h-8 w-8 animate-pulse" />
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">✨ 정제 완료!</CardTitle>
                    <CardDescription className="text-slate-500 mt-2 font-medium">
                        스마트 엔진이 성공적으로 데이터를 닦아냈습니다.<br />
                        아래 미리보기에서 결과를 바로 확인해 보세요.
                    </CardDescription>
                </CardHeader>

                {/* AD Slot: Processing-Completion (Focus) */}
                <div className="px-6 py-4 bg-slate-50/50 border-y border-slate-100 flex flex-col items-center min-h-[140px] justify-center">
                    <span className="text-[9px] text-slate-400 font-bold mb-2 uppercase tracking-widest">Sponsored Information</span>
                    <AdBanner slot="8888880001" format="horizontal" isTest={true} className="w-full" />
                </div>

                <CardFooter className="p-6 pt-6">
                    <Button
                        onClick={onClose}
                        className="w-full py-7 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-lg hover:shadow-blue-200 transition-all rounded-xl"
                    >
                        결과 확인하기
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
