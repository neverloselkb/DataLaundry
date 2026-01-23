import { Sparkles } from 'lucide-react';

export function Header() {
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
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                        Browser-Only Security
                    </div>
                </div>
            </div>
        </header>
    );
}
