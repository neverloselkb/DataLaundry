import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { AdBanner } from '../AdBanner';

// 확인/취소 모달 — 위험한 작업 전 사용자 확인
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
            <Card className="w-[400px] shadow-2xl border-[var(--laundry-border)] animate-in zoom-in-95 duration-200 overflow-hidden">
                <CardHeader className="pb-3 text-center">
                    <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                        {icon || <AlertCircle className="text-amber-600 h-6 w-6" />}
                    </div>
                    <CardTitle className="text-xl font-bold text-[var(--laundry-text)]">{title}</CardTitle>
                    <CardDescription className="text-[var(--laundry-subtle)] mt-2 whitespace-pre-wrap leading-relaxed">{description}</CardDescription>
                </CardHeader>

                {/* AD Slot: Modal-Confirm (Center) */}
                <div className="py-2 border-y border-[var(--laundry-border)]">
                    <AdBanner slot="9999990001" className="bg-transparent" />
                </div>

                <CardFooter className="flex justify-center gap-3 p-6 pt-2">
                    <Button variant="outline" onClick={onClose} className="flex-1 py-6 border-[var(--laundry-border)] text-[var(--laundry-subtle)] hover:bg-[var(--laundry-bg)]">
                        {cancelLabel}
                    </Button>
                    <Button onClick={onConfirm} className="flex-1 py-6 bg-[var(--laundry-accent)] hover:bg-[var(--laundry-accent-hover)] text-[var(--laundry-bg)] font-bold">
                        {confirmLabel}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
