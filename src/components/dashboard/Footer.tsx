import { Sparkles, AlertCircle, Bot, FileUp, Github } from 'lucide-react';

interface FooterProps {
    setTermsModalOpen: (open: boolean) => void;
    setHelpModalOpen: (open: boolean) => void;
    setGuideModalOpen: (open: boolean) => void;
    setDonateModalOpen: (open: boolean) => void;
}

export function Footer({ setTermsModalOpen, setHelpModalOpen, setGuideModalOpen, setDonateModalOpen }: FooterProps) {
    return (
        <footer className="mt-auto border-t border-slate-200 bg-slate-50/50 py-12 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-6 w-6 text-blue-600 fill-blue-600/10" />
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                            데이터세탁소
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        AI 기술을 활용하여 복잡한 세일즈/마케팅 데이터를<br />
                        단 몇 초 만에 완벽하게 정제해 드립니다.
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold text-slate-900 mb-4">서비스 기능</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li>자연어 명령어 정제</li>
                        <li>글로벌 날짜 형식 통일</li>
                        <li>데이터 무결성 진단</li>
                        <li>자동 매핑 및 치환</li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-slate-900 mb-4">고객 지원</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setTermsModalOpen(true)}>
                            <AlertCircle size={14} className="text-slate-400" />
                            이용 약관 및 정책
                        </li>
                        <li className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setHelpModalOpen(true)}>
                            <Bot size={14} className="text-slate-400" />
                            도움말 센터
                        </li>
                        <li className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setGuideModalOpen(true)}>
                            <FileUp size={14} className="text-slate-400" />
                            제작 가이드
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-slate-900 mb-4">연락처</h4>
                    <address className="not-italic space-y-2 text-sm text-slate-600">
                        <p>Email: pentiumman@naver.com</p>
                        <p className="flex items-center gap-1.5 cursor-pointer text-blue-600 hover:text-blue-700 font-bold group transition-colors" onClick={() => setDonateModalOpen(true)}>
                            <Sparkles size={14} className="group-hover:animate-pulse" />
                            개발자 도와주기
                        </p>
                        <a
                            href="https://github.com/neverloselkb/DataLaundry"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                        >
                            <Github size={14} className="text-slate-400" />
                            GitHub 프로필
                        </a>
                        <p className="pt-2 text-[11px] text-slate-400 font-medium">
                            © 2026 데이터세탁소. All rights reserved.
                        </p>
                    </address>
                </div>
            </div>
        </footer>
    );
}
