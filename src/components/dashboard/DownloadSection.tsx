import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DownloadSectionProps {
    handleDownload: () => void;
    rowCount: number;
}

/**
 * 정제 결과 다운로드 섹션 컴포넌트
 * 작업 완료 메시지와 다운로드 버튼을 제공합니다.
 * 
 * @param handleDownload 다운로드 핸들러 함수
 * @param onReset 초기화 핸들러 함수
 * @param rowCount 정제된 데이터의 행 수
 */
export function DownloadSection({ handleDownload, rowCount }: DownloadSectionProps) {
    if (rowCount === 0) return null;

    return (
        <Card className="border-green-200 bg-green-50 shadow-sm animate-in fade-in slide-in-from-bottom-5">
            <CardContent className="p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="font-medium text-green-700">작업 완료!</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full border border-green-200">{rowCount} rows</div>
                </div>
                <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="w-full border-green-300 hover:bg-green-100 hover:text-green-800 text-green-700 transition-colors h-10"
                >
                    <Download size={16} className="mr-2" />
                    결과 파일 다운로드
                </Button>
            </CardContent>
        </Card>
    );
}
