import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DataIssue } from '@/types';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

// 데이터 일괄 수정 모달 — 이슈 항목의 값을 일괄 변경
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
            <Card className="w-[400px] shadow-lg border-[var(--laundry-border)] animate-in zoom-in-95 duration-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <RefreshCw size={18} className="text-blue-600" />
                        데이터 일괄 수정
                    </CardTitle>
                    <CardDescription>
                        &apos;{targetIssue.column}&apos; 컬럼의 길이 초과 데이터 <strong>{targetIssue.affectedRows?.length}건</strong>을 일괄 변경합니다.
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
                        <p className="text-[11px] text-[var(--laundry-subtle)] mt-1">* 입력하신 값으로 해당 데이터들이 모두 치환됩니다.</p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-[var(--laundry-elevated)] p-4">
                    <Button variant="ghost" onClick={onClose}>취소</Button>
                    <Button onClick={onApply} className="bg-blue-600 hover:bg-blue-700 text-[var(--laundry-bg)]">
                        <RefreshCw size={14} className="mr-1" /> 일괄 적용
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
