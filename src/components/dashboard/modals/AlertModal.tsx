import { Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { AdBanner } from '../AdBanner';

// 알림 모달 — 성공/정보/경고/에러 표시
interface AlertModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    buttonLabel?: string;
    type?: 'success' | 'info' | 'warning' | 'error';
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
            <Card className="w-[380px] shadow-2xl border-[var(--laundry-border)] animate-in zoom-in-95 duration-200 overflow-hidden">
                <CardHeader className="pb-3 text-center">
                    <div className={`mx-auto w-12 h-12 ${bg} rounded-full flex items-center justify-center mb-2`}>
                        {icon}
                    </div>
                    <CardTitle className="text-xl font-bold text-[var(--laundry-text)]">{title}</CardTitle>
                    <CardDescription className="text-[var(--laundry-subtle)] mt-2 whitespace-pre-wrap leading-relaxed">{description}</CardDescription>
                </CardHeader>

                {/* AD Slot: Modal-Alert (Center) */}
                <div className="py-2 border-y border-[var(--laundry-border)]">
                    <AdBanner slot="9999990002" className="bg-transparent" />
                </div>

                <CardFooter className="p-6 pt-2">
                    <Button onClick={onClose} className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-[var(--laundry-bg)] font-bold">
                        {buttonLabel}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
