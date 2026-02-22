import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { AdBanner } from '../AdBanner';

// 정제 완료 광고 모달 — 처리 완료 후 팝업
interface AdCompletionModalProps {
    open: boolean;
    onClose: () => void;
}

export function AdCompletionModal({ open, onClose }: AdCompletionModalProps) {
    useBodyScrollLock(open);
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <Card className="w-full max-w-md shadow-2xl border-[var(--laundry-border)] animate-in zoom-in-95 duration-300 overflow-hidden bg-[var(--laundry-surface)]">
                <CardHeader className="text-center pb-4 pt-8 bg-gradient-to-b from-blue-50/50 to-white">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-inner ring-4 ring-blue-50">
                        <Sparkles className="text-blue-600 h-8 w-8 animate-pulse" />
                    </div>
                    <CardTitle className="text-2xl font-black text-[var(--laundry-text)] tracking-tight">✨ 정제 완료!</CardTitle>
                    <CardDescription className="text-[var(--laundry-subtle)] mt-2 font-medium">
                        스마트 엔진이 성공적으로 데이터를 닦아냈습니다.<br />
                        아래 미리보기에서 결과를 바로 확인해 보세요.
                    </CardDescription>
                </CardHeader>

                {/* AD Slot: Processing-Completion (Focus) */}
                <div className="px-6 py-4 bg-[var(--laundry-elevated)] border-y border-[var(--laundry-border)] flex flex-col items-center min-h-[140px] justify-center">
                    <span className="text-[9px] text-slate-400 font-bold mb-2 uppercase tracking-widest">Sponsored Information</span>
                    <AdBanner slot="8888880001" format="horizontal" isTest={true} className="w-full" />
                </div>

                <CardFooter className="p-6 pt-6">
                    <Button
                        onClick={onClose}
                        className="w-full py-7 bg-blue-600 hover:bg-blue-700 text-[var(--laundry-bg)] font-black text-lg shadow-lg hover:shadow-blue-200 transition-all rounded-xl"
                    >
                        결과 확인하기
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
