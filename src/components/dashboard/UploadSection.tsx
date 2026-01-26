import { useRef, useEffect, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Info, Cpu } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { estimatePerformance } from '@/lib/core/performance';

interface UploadSectionProps {
    file: File | null;
    isDragging: boolean;
    error: string | null;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadSection({
    file,
    isDragging,
    error,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect
}: UploadSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [perf, setPerf] = useState<{ tier: string, recommendedRows: number, memoryGB?: number } | null>(null);

    useEffect(() => {
        // 컴포넌트 마운트 시 시스템 성능 체크
        const result = estimatePerformance();
        setPerf(result);
    }, []);

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <Card className="border-slate-200 shadow-sm relative overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">1</span>
                        데이터 업로드
                    </CardTitle>

                    {/* PC Ability Badge */}
                    {perf && (
                        <div
                            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-full animate-in fade-in duration-700 cursor-help"
                            title={perf.memoryGB && perf.memoryGB >= 8
                                ? "💡 실제 8GB 이상의 램을 보유하고 있다면, 표시된 권장량보다 훨씬 더 많은 데이터도 충분히 처리 가능합니다."
                                : "현재 브라우저 환경에서 쾌적하게 처리할 수 있는 권장 데이터 규모입니다."}
                        >
                            <span className={cn(
                                "flex h-2 w-2 rounded-full",
                                perf.tier === 'High' ? "bg-green-500" :
                                    perf.tier === 'Low' ? "bg-yellow-500" : "bg-blue-500"
                            )} />
                            <div className="flex flex-col leading-none">
                                <span className="text-[10px] text-slate-400 font-medium mb-0.5">내 PC 권장 사양</span>
                                <span className="text-xs text-slate-700 font-bold flex items-center gap-1">
                                    <Cpu size={10} className="text-slate-400" />
                                    ~{(perf.recommendedRows / 10000).toFixed(0)}만 행
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                <CardDescription className="flex items-center justify-between">
                    <span>CSV 또는 Excel 파일을 올려주세요.</span>
                    {perf && perf.memoryGB && (
                        <span
                            className="text-[10px] text-slate-400 hidden sm:inline-block cursor-help border-b border-dashed border-slate-300"
                            title="브라우저 보안 정책상 최대 8GB까지만 표시되지만, 실제 32GB 등 고용량 메모리 보유 시 시스템 자원을 최대한 활용하여 정제 작업을 수행합니다."
                        >
                            (RAM {perf.memoryGB >= 8 ? "8GB+" : `${perf.memoryGB}GB`} 감지됨)
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={triggerFileInput}
                    className={cn(
                        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200",
                        isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50",
                        file ? "bg-slate-50 border-blue-200" : ""
                    )}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".csv, .xlsx, .xls"
                        onChange={onFileSelect}
                    />
                    {file ? (
                        <div className="flex flex-col items-center gap-2 text-blue-700">
                            <FileSpreadsheet size={32} />
                            <div className="font-medium text-sm">{file.name}</div>
                            <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Upload size={32} />
                            <div className="font-medium text-sm text-slate-600">
                                파일을 드래그하거나 <span className="text-blue-600">클릭</span>하세요
                            </div>
                            <div className="text-xs">CSV, Excel 지원</div>
                        </div>
                    )}
                </div>
                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
