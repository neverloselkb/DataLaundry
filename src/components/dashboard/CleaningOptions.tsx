import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ProcessingOptions } from '@/types';
import { ProcessingStatus } from './ProcessingStatus';

interface CleaningOptionsProps {
    options: ProcessingOptions;
    setOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>>;
    prompt: string;
    setPrompt: (prompt: string) => void;
    isProcessing: boolean;
    progress: number;
    progressMessage: string;
    onProcess: () => void;
    fileLoaded: boolean;
}

/**
 * 정제 옵션 및 요청 섹션 컴포넌트
 * 체크박스 옵션, 자연어 프롬프트 입력, 실행 버튼을 포함합니다.
 * 
 * @param options 현재 선택된 정제 옵션
 * @param setOptions 옵션 변경 함수
 * @param prompt 자연어 프롬프트
 * @param setPrompt 프롬프트 변경 함수
 * @param isProcessing 현재 처리 중 여부
 * @param progress 처리 진행률
 * @param progressMessage 처리 상태 메시지
 * @param onProcess 정제 시작 핸들러
 * @param fileLoaded 파일 업로드 여부 (비활성화 처리용)
 */
export function CleaningOptions({
    options,
    setOptions,
    prompt,
    setPrompt,
    isProcessing,
    progress,
    progressMessage,
    onProcess,
    fileLoaded
}: CleaningOptionsProps) {
    const [tipIndex, setTipIndex] = useState(0);

    const tips = [
        "'주소에서 시/도만 남겨줘'",
        "'[%3d]원 형식의 데이터는 빈칸으로 변경해줘' (와일드카드 활용)",
        "'[%d]는 숫자, [%s]는 문자를 뜻해요'",
        "'Inactive는 [정지]로, active는 [정상]으로 변경해줘'",
        "'Name 컬럼에서 숫자랑 특수문자 빼줘'",
        "'우편번호가 5자리가 넘으면 지워줘'",
        "'Price, Cost 컬럼에 콤마 찍어줘'",
        "'날짜 형식을 yyyy-mm-dd로 통일해줘'"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % tips.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [tips.length]);

    const handleQuickAction = (type: 'all' | 'none') => {
        setOptions(prev => ({
            ...prev,
            removeWhitespace: type === 'all',
            formatMobile: type === 'all',
            formatGeneralPhone: type === 'all',
            formatDate: type === 'all',
            formatNumber: type === 'all',
            cleanEmail: type === 'all',
            formatZip: type === 'all',
            cleanName: type === 'all'
        }));
    };

    return (
        <Card className={cn("border-slate-200 shadow-sm transition-opacity", !fileLoaded && "opacity-50 pointer-events-none")}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">2</span>
                    정제 요청
                </CardTitle>
                <CardDescription>어떻게 데이터를 정리할까요?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Quick Actions */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">빠른 실행 메뉴</Label>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => handleQuickAction('all')}>
                                전체 선택
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-slate-500" onClick={() => handleQuickAction('none')}>
                                해제
                            </Button>
                        </div>
                    </div>

                    {/* Options Grid */}
                    <div className="flex flex-col gap-2">
                        <OptionCheckbox id="whitespace" label="공백 제거 (Trim)" checked={options.removeWhitespace} onChange={(c) => setOptions(p => ({ ...p, removeWhitespace: c }))} />
                        <OptionCheckbox id="mobile" label="휴대폰 번호 포맷 통일 (01X-XXXX-XXXX)" checked={options.formatMobile} onChange={(c) => setOptions(p => ({ ...p, formatMobile: c }))} />
                        <OptionCheckbox id="phone" label="전화번호 포맷 통일 (XX-XXXX-XXXX)" checked={options.formatGeneralPhone} onChange={(c) => setOptions(p => ({ ...p, formatGeneralPhone: c }))} />
                        <OptionCheckbox id="date" label="날짜 형식 통일 (yyyy.MM.dd)" checked={options.formatDate} onChange={(c) => setOptions(p => ({ ...p, formatDate: c }))} />
                        <OptionCheckbox id="dateTime" label="일시 형식 표준화 (yyyy.MM.dd HH:mm:ss)" checked={options.formatDateTime} onChange={(c) => setOptions(p => ({ ...p, formatDateTime: c }))} />
                        <OptionCheckbox id="number" label="숫자 천단위 콤마 (1,234,567)" checked={options.formatNumber} onChange={(c) => setOptions(p => ({ ...p, formatNumber: c }))} />
                        <OptionCheckbox id="email" label="이메일 형식 체크 및 필터링" checked={options.cleanEmail} onChange={(c) => setOptions(p => ({ ...p, cleanEmail: c }))} />
                        <OptionCheckbox id="zip" label="우편번호 형식 통일 (5자리)" checked={options.formatZip} onChange={(c) => setOptions(p => ({ ...p, formatZip: c }))} />
                        <OptionCheckbox id="cleanName" label="이름의 노이즈 제거 (숫자/특수문자)" checked={options.cleanName} onChange={(c) => setOptions(p => ({ ...p, cleanName: c }))} />

                        <div className="flex items-center space-x-2 pt-1 border-t border-slate-100 mt-1">
                            <Checkbox id="highlight" checked={options.highlightChanges} onCheckedChange={(c) => setOptions(p => ({ ...p, highlightChanges: c as boolean }))} />
                            <label htmlFor="highlight" className="text-sm font-bold text-blue-600 leading-none cursor-pointer">변경 사항 하이라이트 (Excel 전용)</label>
                        </div>

                        <OptionCheckbox id="garbage" label="무의미한 데이터 및 깨진 글자 정리" checked={options.cleanGarbage} onChange={(c) => setOptions(p => ({ ...p, cleanGarbage: c }))} />
                        <OptionCheckbox id="amount" label="금액 데이터 정밀 세척 (한글 단위 변환)" checked={options.cleanAmount} onChange={(c) => setOptions(p => ({ ...p, cleanAmount: c }))} />
                    </div>
                </div>

                {/* Prompt Input */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                    <Label htmlFor="prompt">추가 요청사항 (자연어)</Label>
                    <Textarea
                        id="prompt"
                        placeholder="예: 주소에서 시/도만 남겨줘. (아니면 미리보기를 더블클릭하여 직접 수정 가능)"
                        className="min-h-[80px] resize-none focus-visible:ring-blue-500"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>

                {/* Tips Carousel */}
                <div className="text-xs text-slate-500 bg-slate-100 p-3 rounded-md overflow-hidden relative h-[44px] flex items-center">
                    <span className="font-medium mr-2 shrink-0">💡 팁:</span>
                    <div className="relative flex-1">
                        {tips.map((tip, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "absolute left-0 top-1/2 -translate-y-1/2 w-full transition-all duration-700 ease-in-out",
                                    tipIndex === idx ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
                                )}
                            >
                                {tip}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                {isProcessing ? (
                    <ProcessingStatus progress={progress} message={progressMessage} />
                ) : (
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-12 text-lg shadow-md hover:shadow-lg transition-all"
                        onClick={onProcess}
                        disabled={!prompt && !Object.values(options).some(Boolean)}
                    >
                        <Sparkles size={20} />
                        데이터 정제하기
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

// Helper component for cleaner code
function OptionCheckbox({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (c: boolean) => void }) {
    return (
        <div className="flex items-center space-x-2">
            <Checkbox id={id} checked={checked} onCheckedChange={(c) => onChange(c as boolean)} />
            <label htmlFor={id} className="text-sm font-medium leading-none cursor-pointer">{label}</label>
        </div>
    );
}
