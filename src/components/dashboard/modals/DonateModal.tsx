import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

// 후원(기부) 모달 — 카카오페이 QR 코드 표시
export function DonateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    useBodyScrollLock(open);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
            <Card className="w-full max-w-md shadow-2xl border-[var(--laundry-border)] animate-in zoom-in-95 duration-200 overflow-hidden">
                <CardHeader className="text-center pb-2 bg-gradient-to-b from-blue-50 to-white">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="text-blue-600 h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-[var(--laundry-text)]">개발자 도와주기</CardTitle>
                    <CardDescription className="text-[var(--laundry-subtle)] mt-2 px-4">
                        데이터세탁소가 업무에 도움이 되셨나요?<br />
                        보내주시는 따뜻한 후원은 지속적인 서비스 개선과 운영에 큰 힘이 됩니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center p-8">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-[var(--laundry-surface)] p-4 rounded-xl border border-[var(--laundry-border)] shadow-sm">
                            <img src="./kakaopay-qr.png" alt="KakaoPay QR Code" className="w-64 h-auto rounded-lg" />
                        </div>
                    </div>
                    <div className="mt-8 text-center space-y-2">
                        <p className="text-sm font-medium text-[var(--laundry-muted)]">카카오페이로 따뜻한 마음 전하기</p>
                        <p className="text-xs text-slate-400">QR 코드를 스캔하면 바로 후원하실 수 있습니다.</p>
                    </div>
                </CardContent>
                <CardFooter className="bg-[var(--laundry-bg)] p-4 flex justify-center">
                    <Button onClick={onClose} className="bg-[var(--laundry-accent)] hover:bg-[var(--laundry-accent-hover)] text-[var(--laundry-bg)] w-full py-6 text-lg font-bold">
                        커피 한 잔 후원하고 닫기 ☕
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
