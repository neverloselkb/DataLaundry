import { useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils'; // Assuming global utils is in lib/utils

interface UploadSectionProps {
    file: File | null;
    isDragging: boolean;
    error: string | null;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * 파일 업로드 섹션 컴포넌트
 * 드래그 앤 드롭 및 클릭을 통한 파일 선택을 지원합니다.
 * 
 * @param file 현재 선택된 파일 객체
 * @param isDragging 드래그 중 여부 (스타일 변경용)
 * @param error 업로드 관련 에러 메시지
 * @param onDragOver 드래그 오버 핸들러
 * @param onDragLeave 드래그 리브 핸들러
 * @param onDrop 드롭 핸들러
 * @param onFileSelect 파일 선택 인풋 핸들러
 */
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

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">1</span>
                    데이터 업로드
                </CardTitle>
                <CardDescription>CSV 또는 Excel 파일을 올려주세요.</CardDescription>
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
