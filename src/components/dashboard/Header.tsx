import { Sparkles, HelpCircle, Download } from 'lucide-react';

interface HeaderProps {
    onOpenGuide?: () => void;
}

export function Header({ onOpenGuide }: HeaderProps) {
    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 bg-opacity-80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
                    <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-500/30">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-extrabold text-slate-800 tracking-tight">
                        데이터<span className="text-blue-600">세탁소</span>
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onOpenGuide}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all border border-transparent hover:border-blue-100"
                    >
                        <HelpCircle size={14} />
                        사용 가이드
                    </button>

                    <a
                        href="/sample_data.csv"
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-all border border-blue-100"
                    >
                        <Download size={14} />
                        테스트 데이터
                    </a>

                    <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden md:block" />

                    <div className="hidden md:flex items-center text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                        Browser-Only Security
                    </div>
                </div>
            </div>
        </header>
    );
}
