'use client';

import { useState, useRef } from 'react';
import { Upload, FileUp, Download, Sparkles, RefreshCw, AlertCircle, FileSpreadsheet, Bot, Loader2, Lock, Unlock, Eye, EyeOff, Filter, FilterX, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DataRow, downloadData, parseFile, processDataLocal, detectDataIssues, DataIssue, calculateDiffStats, ProcessingStats, calculateColumnLengths } from '@/lib/data-processor';
import { cn } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox"
import { useEffect } from 'react';

export default function DataCleanDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<DataRow[]>([]);
  const [processedData, setProcessedData] = useState<DataRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState({
    removeWhitespace: false,
    formatMobile: false,
    formatGeneralPhone: false,
    formatDate: false,
    formatDateTime: false,
    formatNumber: false,
    cleanEmail: false,
    formatZip: false,
    highlightChanges: false,
    cleanGarbage: false,
    cleanAmount: false,
    cleanName: false,
  });
  const [issues, setIssues] = useState<DataIssue[]>([]);
  const [lockedColumns, setLockedColumns] = useState<string[]>([]);
  const [columnLimits, setColumnLimits] = useState<Record<string, number>>({});
  const [editingLength, setEditingLength] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowIdx: number, col: string } | null>(null);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [editingHeader, setEditingHeader] = useState<string | null>(null);
  const [tempHeaderName, setTempHeaderName] = useState('');
  const [filterIssue, setFilterIssue] = useState<DataIssue | null>(null);
  const [fixModalOpen, setFixModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [targetFixIssue, setTargetFixIssue] = useState<DataIssue | null>(null);
  const [replacementValue, setReplacementValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Worker & Progress State
  const workerRef = useRef<Worker | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  useEffect(() => {
    // Initialize Web Worker
    workerRef.current = new Worker(new URL('../lib/worker.ts', import.meta.url));

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, progress, message, processedData, issues, stats, error } = e.data;

      if (type === 'PROGRESS') {
        setProgress(progress);
        setProgressMessage(message);
      } else if (type === 'COMPLETE') {
        setProcessedData(processedData);
        setIssues(issues);
        setStats(stats);
        setIsProcessing(false);
        setFilterIssue(null);
        setProgress(100);
      } else if (type === 'ERROR') {
        console.error(error);
        setError('데이터 처리 중 오류가 발생했습니다.');
        setIsProcessing(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleProcess = (overrideOptions?: any, overridePrompt?: string) => {
    const activeOptions = overrideOptions || options;
    const activePrompt = overridePrompt !== undefined ? overridePrompt : prompt;

    if (!activePrompt.trim() && !Object.values(activeOptions).some(Boolean)) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('엔진 초기화 중...');

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'PROCESS',
        data,
        prompt: activePrompt,
        options: activeOptions,
        lockedColumns,
        columnLimits
      });
    }
  };

  const rowsPerPage = 15;
  const filteredIndices = filterIssue?.affectedRows || null;
  const totalCount = filteredIndices ? filteredIndices.length : processedData.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalCount);
  const currentIndices = filteredIndices
    ? filteredIndices.slice(startIndex, endIndex)
    : Array.from({ length: Math.max(0, endIndex - startIndex) }, (_, k) => startIndex + k);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) await handleFileUpload(droppedFile);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (uploadedFile: File) => {
    setError(null);
    setFile(uploadedFile);
    setCurrentPage(1); // Reset page on new upload
    try {
      const parsed = await parseFile(uploadedFile);
      if (parsed.length === 0) {
        setError('데이터가 비어있거나 형식을 인식할 수 없습니다.');
        return;
      }
      setData(parsed);
      setProcessedData(parsed);
      const initialLimits = calculateColumnLengths(parsed);
      setColumnLimits(initialLimits);
      const initialIssues = detectDataIssues(parsed, initialLimits, options);
      setIssues(initialIssues);
    } catch (err) {
      setError('파일을 읽는 중 오류가 발생했습니다.');
      console.error(err);
    }
  };



  const handleApplyFix = () => {
    if (!targetFixIssue || !targetFixIssue.affectedRows) return;

    // 1. Update Original Data (Source of Truth)
    const newData = [...data];
    targetFixIssue.affectedRows.forEach(idx => {
      if (newData[idx]) {
        newData[idx] = { ...newData[idx], [targetFixIssue.column]: replacementValue };
      }
    });
    setData(newData);

    // 2. Update Processed Data (Immediate View)
    const newProcessed = [...processedData];
    targetFixIssue.affectedRows.forEach(idx => {
      if (newProcessed[idx]) {
        newProcessed[idx] = { ...newProcessed[idx], [targetFixIssue.column]: replacementValue };
      }
    });
    setProcessedData(newProcessed);

    // 3. Re-Analyze
    const newIssues = detectDataIssues(newProcessed, columnLimits, options);
    setIssues(newIssues);
    setStats(calculateDiffStats(newData, newProcessed, detectDataIssues(newData, columnLimits, options).length, newIssues.length));

    // 4. Close Modal & Reset
    setFixModalOpen(false);
    setTargetFixIssue(null);
    setReplacementValue('');
  };

  const handleCellSave = (rowIdx: number, col: string, newVal: string) => {
    // 1. Update Data
    const newData = [...data];
    if (newData[rowIdx]) newData[rowIdx] = { ...newData[rowIdx], [col]: newVal };
    setData(newData);

    const newProcessed = [...processedData];
    if (newProcessed[rowIdx]) newProcessed[rowIdx] = { ...newProcessed[rowIdx], [col]: newVal };
    setProcessedData(newProcessed);

    // 2. Re-Analyze
    const newIssues = detectDataIssues(newProcessed, columnLimits, options);
    setIssues(newIssues);
    setStats(calculateDiffStats(newData, newProcessed, detectDataIssues(newData, columnLimits, options).length, newIssues.length));

    setEditingCell(null);
  };

  const toggleLock = (column: string) => {
    setLockedColumns(prev =>
      prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
    );
  };

  const handleDownload = () => {
    if (processedData.length === 0) return;
    const originalName = file?.name || 'data';
    const originalExt = originalName.includes('.') ? originalName.split('.').pop()?.toLowerCase() : 'csv';
    const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
    const fileName = `cleaned_${baseName}.${originalExt}`;
    downloadData(processedData, fileName, data, options.highlightChanges);
  };

  const getHeaderRecommendations = (column: string) => {
    // Get first 20 rows of data for the target column to analyze patterns
    const values = processedData.slice(0, 20).map(r => String(r[column] || ''));
    const combined = values.join(' ');

    const recs: string[] = [];
    // Phone pattern (Mobile or General)
    if (/01[016789]|-?\d{3,4}-?\d{4}/.test(combined)) recs.push('연락처', '휴대폰', 'Phone', 'Mobile');
    // Email pattern
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(combined)) recs.push('이메일', 'Email');
    // Amount/Price pattern (Won symbol, currency commas, or specific numbers)
    if (/원|금액|매출|가격|price|amount|\d{1,3}(,\d{3})+/i.test(combined + column)) recs.push('금액', '가격', 'Amount', 'Price');
    // Date pattern
    if (/\d{4}[.-/]\d{1,2}[.-/]\d{1,2}|오늘|어제|일시|일자/.test(combined + column)) recs.push('날짜', '등록일시', 'Date');
    // Postcode pattern (5-6 digits in specific context)
    if (/\b\d{5}\b/.test(combined) && (column.includes('우편') || /zip|postal/i.test(column))) recs.push('우편번호', 'Zip Code', 'Postcode');
    // Name pattern (Koreans names are often 3 chars, or contains Name keyword)
    if (/name|이름|성함|성명/i.test(column)) recs.push('고객명', '성함', 'Name', 'Customer');
    // Address pattern (City names)
    if (['서울', '경기', '부산', '대구', '인천', '광주', '대전', '울산', '세종'].some(city => combined.includes(city))) recs.push('주소', '거주지', 'Address');

    // Add original as fallback if empty, otherwise remove duplicates and take top 5
    if (recs.length === 0) recs.push('데이터', '기타', 'Data', 'Etc');
    return Array.from(new Set(recs)).filter(r => r !== column).slice(0, 5);
  };

  const handleHeaderSave = (oldName: string, newName: string) => {
    if (!newName || oldName === newName) {
      setEditingHeader(null);
      return;
    }

    // 1. Update data (Source of Truth)
    const newData = data.map(row => {
      const { [oldName]: val, ...rest } = row;
      return { ...rest, [newName]: val };
    });
    setData(newData);

    // 2. Update processedData (Immediate View)
    const newProcessed = processedData.map(row => {
      const { [oldName]: val, ...rest } = row;
      return { ...rest, [newName]: val };
    });
    setProcessedData(newProcessed);

    // 3. Update columnLimits
    const newLimits = { ...columnLimits };
    newLimits[newName] = newLimits[oldName];
    delete newLimits[oldName];
    setColumnLimits(newLimits);

    // 4. Update lockedColumns
    setLockedColumns(prev => prev.map(c => c === oldName ? newName : c));

    // 5. Re-Analyze
    const newIssues = detectDataIssues(newProcessed, newLimits, options);
    setIssues(newIssues);

    setEditingHeader(null);
  };


  const headers = processedData.length > 0 ? Object.keys(processedData[0]) : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Sparkles size={20} />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              데이터세탁소
            </h1>
          </div>
          <div className="text-sm text-slate-500">지저분한 데이터를 새것처럼 (Data Laundry)</div>
        </div>
      </header>

      {/* AdSense Top Test Ad Area */}
      <div className="container mx-auto px-4 mt-8">
        <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px] text-slate-400">
          <span className="text-xs font-bold uppercase tracking-widest mb-2">Advertisement (Top Test Ad)</span>
          <ins className="adsbygoogle"
            style={{ display: 'block', width: '100%', textAlign: 'center' }}
            data-ad-client="ca-pub-0000000000000000"
            data-ad-slot="1111111111"
            data-ad-format="auto"
            data-full-width-responsive="true"
            data-adtest="on"></ins>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Panel: Upload & Controls */}
          <div className="space-y-6">

            {/* 1. Upload Section */}
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
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
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
                    onChange={handleFileSelect}
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

            {/* Analysis Report Section */}
            {issues.length > 0 && (
              <Card className="border-amber-200 bg-amber-50 shadow-sm animate-in fade-in slide-in-from-bottom-5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-amber-800 flex items-center gap-2">
                    <AlertCircle size={18} />
                    데이터 분석 리포트
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(showAllIssues ? issues : issues.slice(0, 3)).map((issue, idx) => (
                    <div key={idx} className="flex items-start justify-between bg-white p-3 rounded-md border border-amber-100 shadow-sm text-sm">
                      <div className="text-amber-900">
                        <span className="font-bold text-amber-700 block mb-1">⚠️ {issue.column}</span>
                        {issue.message}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 h-auto py-1 px-2 whitespace-nowrap ml-2"
                        onClick={() => {
                          if (issue.fixType === 'maxLength') {
                            setTargetFixIssue(issue);
                            setReplacementValue(''); // Default empty
                            setFixModalOpen(true);
                          } else if (issue.suggestion) {
                            const newOptions = { ...options, ...issue.suggestion };
                            setOptions(newOptions);
                            handleProcess(newOptions);
                          } else if (issue.promptSuggestion) {
                            setPrompt(issue.promptSuggestion);
                            handleProcess(options, issue.promptSuggestion);
                          }
                        }}
                      >
                        {issue.fixType === 'maxLength' ? '수정하기' : (issue.promptSuggestion ? '정제 제안' : '옵션 적용')}
                      </Button>

                      {issue.affectedRows && issue.affectedRows.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-auto py-1 px-2 whitespace-nowrap ml-1",
                            filterIssue === issue
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          )}
                          onClick={() => {
                            setFilterIssue(filterIssue === issue ? null : issue);
                            setCurrentPage(1);
                          }}
                          title={filterIssue === issue ? "전체 보기" : "이 문제만 보기"}
                        >
                          {filterIssue === issue ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      )}
                    </div>
                  ))}
                  {issues.length > 3 && (
                    <div
                      className="text-center text-xs text-amber-600 font-medium cursor-pointer hover:underline py-1"
                      onClick={() => setShowAllIssues(!showAllIssues)}
                    >
                      {showAllIssues ? "간단히 보기" : `+ ${issues.length - 3}개의 이슈가 더 발견되었습니다.`}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 2. Request Section */}
            <Card className={cn("border-slate-200 shadow-sm transition-opacity", !file && "opacity-50 pointer-events-none")}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">2</span>
                  정제 요청
                </CardTitle>
                <CardDescription>어떻게 데이터를 정리할까요?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">빠른 실행 메뉴</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setOptions(prev => ({
                          ...prev,
                          removeWhitespace: true,
                          formatMobile: true,
                          formatGeneralPhone: true,
                          formatDate: true,
                          formatNumber: true,
                          cleanEmail: true,
                          formatZip: true,
                          cleanName: true
                        }))}
                      >
                        전체 선택
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 text-slate-500"
                        onClick={() => setOptions(prev => ({
                          ...prev,
                          removeWhitespace: false,
                          formatMobile: false,
                          formatGeneralPhone: false,
                          formatDate: false,
                          formatNumber: false,
                          cleanEmail: false,
                          formatZip: false,
                          cleanName: false
                        }))}
                      >
                        해제
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="whitespace"
                        checked={options.removeWhitespace}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, removeWhitespace: checked as boolean }))}
                      />
                      <label htmlFor="whitespace" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        공백 제거 (Trim)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mobile"
                        checked={(options as any).formatMobile}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, formatMobile: checked as boolean }))}
                      />
                      <label htmlFor="mobile" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        휴대폰 번호 포맷 통일 (01X-XXXX-XXXX)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="phone"
                        checked={(options as any).formatGeneralPhone}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, formatGeneralPhone: checked as boolean }))}
                      />
                      <label htmlFor="phone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        전화번호 포맷 통일 (XX-XXXX-XXXX)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="date"
                        checked={options.formatDate}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, formatDate: checked as boolean }))}
                      />
                      <label htmlFor="date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        날짜 형식 통일 (yyyy.MM.dd)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="dateTime"
                        checked={options.formatDateTime}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, formatDateTime: checked as boolean }))}
                      />
                      <label htmlFor="dateTime" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        일시 형식 표준화 (yyyy.MM.dd HH:mm:ss)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="number"
                        checked={options.formatNumber}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, formatNumber: checked as boolean }))}
                      />
                      <label htmlFor="number" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        숫자 천단위 콤마 (1,234,567)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email"
                        checked={options.cleanEmail}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, cleanEmail: checked as boolean }))}
                      />
                      <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        이메일 형식 체크 및 필터링
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="zip"
                        checked={options.formatZip}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, formatZip: checked as boolean }))}
                      />
                      <label htmlFor="zip" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        우편번호 형식 통일 (5자리)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cleanName"
                        checked={options.cleanName}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, cleanName: checked as boolean }))}
                      />
                      <label htmlFor="cleanName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        이름의 노이즈 제거 (숫자/특수문자)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 pt-1 border-t border-slate-100 mt-1">
                      <Checkbox
                        id="highlight"
                        checked={options.highlightChanges}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, highlightChanges: checked as boolean }))}
                      />
                      <label htmlFor="highlight" className="text-sm font-bold text-blue-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        변경 사항 하이라이트 (Excel 전용)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="garbage"
                        checked={options.cleanGarbage}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, cleanGarbage: checked as boolean }))}
                      />
                      <label htmlFor="garbage" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        무의미한 데이터 및 깨진 글자 정리
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="amount"
                        checked={options.cleanAmount}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, cleanAmount: checked as boolean }))}
                      />
                      <label htmlFor="amount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        금액 데이터 정밀 세척 (한글 단위 변환)
                      </label>
                    </div>
                  </div>
                </div>

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
                  <div className="w-full space-y-3 p-4 bg-blue-50/50 rounded-lg animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-between text-sm text-blue-700 font-medium mb-1">
                      <div className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        <span>{progressMessage || '처리 준비 중...'}</span>
                      </div>
                      <span className="font-bold">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-blue-200 rounded-full overflow-hidden w-full">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                        style={{ width: `${Math.max(5, progress)}%` }}
                      />
                    </div>
                    <div className="text-xs text-blue-400 text-center pt-1">
                      Tip: 작업 중에도 다른 탭을 보거나 업무를 보실 수 있습니다.
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-12 text-lg shadow-md hover:shadow-lg transition-all"
                    onClick={() => handleProcess()}
                    disabled={!prompt && !Object.values(options).some(Boolean)}
                  >
                    <Sparkles size={20} />
                    데이터 정제하기
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* 3. Analysis Report Section */}
            {stats && (
              <Card className="border-slate-200 shadow-sm border-l-4 border-l-blue-500 overflow-hidden">
                <CardHeader className="pb-2 bg-blue-50/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-800">
                      <Bot size={16} />
                      데이터 정제 리포트
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-blue-400 hover:text-blue-600 hover:bg-blue-100"
                      onClick={() => setIssues(detectDataIssues(processedData))}
                      title="리포트 새로고침"
                    >
                      <RefreshCw size={12} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">데이터 건강 점수</div>
                    <div className="text-xl font-bold text-blue-600">
                      {issues.length === 0 ? '100%' : `${Math.max(0, 100 - issues.length * 10)}%`}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">정제된 셀</div>
                      <div className="text-lg font-bold text-slate-700">{stats.changedCells}건</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">해결된 이슈</div>
                      <div className="text-lg font-bold text-green-600">{stats.resolvedIssues}건</div>
                    </div>
                  </div>

                  {issues.length > 0 ? (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
                      <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800 leading-relaxed">
                        아직 <strong>{issues.length}개</strong>의 잠재적 이슈가 남아있습니다. 추가 정제가 필요할 수 있습니다.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex gap-2">
                      <Sparkles size={16} className="text-green-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-green-800 leading-relaxed">
                        모든 데이터 이슈가 해결되었습니다! 원본 데이터가 완벽하게 정제되었습니다.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 4. Download Section */}
            {processedData.length > 0 && (
              <Card className="border-slate-200 shadow-sm border-l-4 border-l-green-500">
                <CardBodyDownloader handleDownload={handleDownload} rowCount={processedData.length} />
              </Card>
            )}
          </div>

          {/* Right Panel: Data Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FileUp size={20} className="text-slate-500" />
                데이터 미리보기
                {processedData.length > 0 && (
                  <span className="text-sm font-normal text-slate-500">
                    (총 {processedData.length}행{filterIssue?.affectedRows ? `, 필터됨: ${filterIssue.affectedRows.length}행` : ''})
                  </span>
                )}
                {processedData.length > 0 && (
                  <span className="text-xs text-blue-500 font-normal ml-2 bg-blue-50 px-2 py-0.5 rounded-full hidden sm:inline-block">
                    💡 Tip: 셀을 더블클릭하여 직접 수정 가능
                  </span>
                )}
              </h2>
              {file && (
                <Button variant="outline" size="sm" onClick={() => { setData([]); setFile(null); setProcessedData([]); setPrompt(''); setFilterIssue(null); }}>
                  초기화
                </Button>
              )}
            </div>

            <Card className="min-h-[650px] border-slate-200 shadow-sm overflow-hidden flex flex-col bg-white">
              {processedData.length > 0 ? (
                <>
                  <div className="flex-1 overflow-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <TableRow className="bg-slate-50 border-b border-slate-200">
                          {headers.map((header) => {
                            const isLocked = lockedColumns.includes(header);
                            return (
                              <TableHead key={header} className="font-semibold text-slate-700 py-3 relative group overflow-visible">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    {editingHeader === header ? (
                                      <div className="relative z-[110]">
                                        <input
                                          type="text"
                                          className="w-full min-w-[120px] h-8 px-2 text-sm border-2 border-blue-500 rounded-md shadow-lg outline-none"
                                          value={tempHeaderName}
                                          autoFocus
                                          onChange={(e) => setTempHeaderName(e.target.value)}
                                          onBlur={() => handleHeaderSave(header, tempHeaderName)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleHeaderSave(header, tempHeaderName);
                                            if (e.key === 'Escape') setEditingHeader(null);
                                          }}
                                        />
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-blue-100 rounded-lg shadow-xl p-2 min-w-[150px] animate-in slide-in-from-top-1 fadeIn duration-200">
                                          <div className="text-[10px] text-slate-400 mb-1.5 font-bold px-1 uppercase tracking-tight">추천 컬럼명</div>
                                          <div className="flex flex-wrap gap-1">
                                            {getHeaderRecommendations(header).map(rec => (
                                              <button
                                                key={rec}
                                                className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[11px] hover:bg-blue-600 hover:text-white transition-colors border border-blue-100"
                                                onMouseDown={(e) => {
                                                  e.preventDefault(); // Prevent blur from firing before this click
                                                  setTempHeaderName(rec);
                                                  handleHeaderSave(header, rec);
                                                }}
                                              >
                                                {rec}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <span
                                        className="cursor-pointer hover:text-blue-600 transition-colors py-1 select-none"
                                        onDoubleClick={() => {
                                          setEditingHeader(header);
                                          setTempHeaderName(header);
                                        }}
                                        title="더블클릭하여 컬럼명 수정"
                                      >
                                        {header}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => toggleLock(header)}
                                      className={cn(
                                        "p-1 rounded-md transition-colors",
                                        isLocked ? "bg-red-50 text-red-500" : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                                      )}
                                      title={isLocked ? "잠금 해제" : "잠금 하기"}
                                    >
                                      {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                                    </button>
                                  </div>

                                  {/* Max Length Config UI */}
                                  <div className="flex items-center text-[10px] text-slate-400 font-normal">
                                    Max:
                                    {editingLength === header ? (
                                      <input
                                        type="number"
                                        className="w-10 h-4 ml-1 pl-1 text-xs border border-blue-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        defaultValue={columnLimits[header] || 0}
                                        autoFocus
                                        onBlur={(e) => {
                                          const newVal = parseInt(e.target.value);
                                          if (!isNaN(newVal) && newVal > 0) {
                                            const newLimits = { ...columnLimits, [header]: newVal };
                                            setColumnLimits(newLimits);
                                            // Trigger re-analysis
                                            const newIssues = detectDataIssues(processedData, newLimits);
                                            setIssues(newIssues);
                                          }
                                          setEditingLength(null);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') e.currentTarget.blur();
                                        }}
                                      />
                                    ) : (
                                      <span
                                        className="ml-1 cursor-pointer hover:text-blue-600 hover:underline decoration-dashed"
                                        onClick={() => setEditingLength(header)}
                                        title="클릭하여 최대 길이 제한 설정"
                                      >
                                        {columnLimits[header] || 'Auto'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentIndices.map((originalIdx, i) => {
                          const row = processedData[originalIdx];
                          const originalRow = data[originalIdx];
                          if (!row) return null; // Should not happen

                          return (
                            <TableRow key={originalIdx} className="hover:bg-blue-50/30 transition-colors">
                              {headers.map((header) => {
                                const isLocked = lockedColumns.includes(header);
                                const processedVal = row[header]?.toString() || '';
                                const originalVal = originalRow ? (originalRow[header]?.toString() || '') : '';
                                const isModified = originalVal !== processedVal;

                                return (
                                  <TableCell
                                    key={`${originalIdx}-${header}`}
                                    className="whitespace-nowrap text-slate-600 py-3 relative group overflow-visible cursor-cell"
                                    onDoubleClick={() => {
                                      if (isLocked) return;
                                      setEditingCell({ rowIdx: originalIdx, col: header });
                                    }}
                                  >
                                    <div className="flex items-center gap-1.5 min-h-[20px]">
                                      {editingCell?.rowIdx === originalIdx && editingCell?.col === header ? (
                                        <input
                                          type="text"
                                          className="w-full min-w-[100px] h-8 px-2 text-sm border border-blue-400 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                          defaultValue={processedVal}
                                          autoFocus
                                          onBlur={(e) => handleCellSave(originalIdx, header, e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') e.currentTarget.blur();
                                            if (e.key === 'Escape') setEditingCell(null);
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      ) : (
                                        <div className="flex items-center gap-1.5 w-full">
                                          {isModified && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
                                          )}
                                          <span className={cn("select-none", isModified && "text-blue-700 font-medium", !isModified && isLocked && "text-slate-400 italic")}>
                                            {isLocked && <Lock size={12} className="inline mr-1 text-red-300" />}
                                            {processedVal}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {isModified && (
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-[11px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] whitespace-nowrap border border-slate-700">
                                        <div className="text-slate-400 mb-0.5 font-bold uppercase tracking-tighter">Original</div>
                                        <div className="font-medium line-through decoration-slate-500 decoration-1">{originalVal || '(empty)'}</div>
                                        {/* Tooltip arrow */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                                      </div>
                                    )}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                      총 <span className="font-bold text-slate-700">{filterIssue?.affectedRows ? filterIssue.affectedRows.length : processedData.length}</span>행 중
                      <span className="font-bold text-slate-700"> {totalCount === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + rowsPerPage, totalCount)}</span>행 표시
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 px-3"
                      >
                        이전
                      </Button>
                      <div className="text-sm font-medium px-4">
                        {currentPage} / {totalPages} 페이지
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 px-3"
                      >
                        다음
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <TableBodyIcon />
                  </div>
                  <p>데이터를 업로드하면 미리보기가 여기에 표시됩니다.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* AdSense Test Ad Area */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px] text-slate-400">
          <span className="text-xs font-bold uppercase tracking-widest mb-2">Advertisement (Test Mode)</span>
          <ins className="adsbygoogle"
            style={{ display: 'block', width: '100%', textAlign: 'center' }}
            data-ad-client="ca-pub-0000000000000000"
            data-ad-slot="0000000000"
            data-ad-format="auto"
            data-full-width-responsive="true"
            data-adtest="on"></ins>
          <p className="text-[10px] mt-2 italic text-slate-400">
            * 'data-adtest="on"' 속성이 적용된 테스트용 광고 영역입니다. (상용 서버 배포 시 실제 광고로 교체)
          </p>
        </div>
      </div>

      <footer className="mt-auto border-t border-slate-200 bg-slate-50/50 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-blue-600 fill-blue-600/10" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                데이터세탁소
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              AI 기술을 활용하여 복잡한 세일즈/마케팅 데이터를<br />
              단 몇 초 만에 완벽하게 정제해 드립니다.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">서비스 기능</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>자연어 명령어 정제</li>
              <li>글로벌 날짜 형식 통일</li>
              <li>데이터 무결성 진단</li>
              <li>자동 매핑 및 치환</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">고객 지원</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setTermsModalOpen(true)}>
                <AlertCircle size={14} className="text-slate-400" />
                이용 약관 및 정책
              </li>
              <li className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setHelpModalOpen(true)}>
                <Bot size={14} className="text-slate-400" />
                도움말 센터
              </li>
              <li className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setGuideModalOpen(true)}>
                <FileUp size={14} className="text-slate-400" />
                제작 가이드
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">연락처</h4>
            <address className="not-italic space-y-2 text-sm text-slate-600">
              <p>Email: pentiumman@naver.com</p>
              <p className="flex items-center gap-1.5 cursor-pointer text-blue-600 hover:text-blue-700 font-bold group transition-colors" onClick={() => setDonateModalOpen(true)}>
                <Sparkles size={14} className="group-hover:animate-pulse" />
                개발자 도와주기
              </p>
              <a
                href="https://github.com/neverloselkb/DataLaundry"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-blue-600 transition-colors"
              >
                <Github size={14} className="text-slate-400" />
                GitHub 프로필
              </a>
              <p className="pt-2 text-[11px] text-slate-400 font-medium">
                © 2026 데이터세탁소. All rights reserved.
              </p>
            </address>
          </div>
        </div>
      </footer>

      {/* Support the Developer Modal Overlay */}
      {donateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden">
            <CardHeader className="text-center pb-2 bg-gradient-to-b from-blue-50 to-white">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="text-blue-600 h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">개발자 도와주기</CardTitle>
              <CardDescription className="text-slate-500 mt-2 px-4">
                데이터세탁소가 업무에 도움이 되셨나요?<br />
                보내주시는 따뜻한 후원은 지속적인 서비스 개선과 운영에 큰 힘이 됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center p-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <img
                    src="/kakaopay-qr.png"
                    alt="KakaoPay QR Code"
                    className="w-64 h-auto rounded-lg"
                  />
                </div>
              </div>
              <div className="mt-8 text-center space-y-2">
                <p className="text-sm font-medium text-slate-700">카카오페이로 따뜻한 마음 전하기</p>
                <p className="text-xs text-slate-400">QR 코드를 스캔하면 바로 후원하실 수 있습니다.</p>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 p-4 flex justify-center">
              <Button onClick={() => setDonateModalOpen(false)} className="bg-slate-900 hover:bg-slate-800 text-white w-full py-6 text-lg font-bold">
                커피 한 잔 후원하고 닫기 ☕
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Production Guide Modal Overlay */}
      {guideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileUp size={20} className="text-blue-600" />
                  데이터세탁소 제작 가이드
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setGuideModalOpen(false)} className="h-8 w-8 p-0 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </Button>
              </div>
              <CardDescription>
                최상의 정제 결과를 얻기 위한 데이터 준비 및 기술적 원칙을 소개합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto p-6 space-y-8 text-sm leading-relaxed text-slate-700">
              <section>
                <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                  ⚙️ 기술적 제작 원칙
                </h5>
                <p>데이터세탁소는 1인 개발자의 집념으로 **'속도, 보안, 정확도'**라는 세 가지 핵심 가치를 지키기 위해 설계되었습니다.</p>
                <ul className="mt-3 space-y-2 list-none text-xs">
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">✔</span>
                    <span>**Client-Only Logic**: 민감한 데이터가 외부 서버로 나가지 않도록 100% 브라우저 내 연산 로직(Web Worker)을 고집합니다.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">✔</span>
                    <span>**Pattern-First Engine**: 단순 치환을 넘어 정규식 패턴 매칭 엔진을 탑재하여 수천 가지 변수를 처리합니다.</span>
                  </li>
                </ul>
              </section>

              <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                  📋 데이터 준비 가이드 (Best Practice)
                </h5>
                <div className="space-y-4">
                  <div>
                    <div className="font-semibold text-slate-900 text-xs mb-1">헤더(Header) 최적화</div>
                    <p className="text-[11px] text-slate-500">첫 번째 행은 반드시 컬럼명(헤더)이어야 합니다. 중복된 컬럼명은 AI 인식률을 떨어뜨리므로 가급적 고유한 이름을 사용해 주세요.</p>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs mb-1">인코딩 및 용량</div>
                    <p className="text-[11px] text-slate-500">UTF-8 인코딩을 권장하지만, 한글이 깨질 경우 EUC-KR 파일을 일반 텍스트로 복사하여 붙여넣거나 .xlsx 형식으로 업로드해 보세요.</p>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs mb-1">특수문자 처리</div>
                    <p className="text-[11px] text-slate-500">셀 내부에 줄바꿈이나 탭 기호가 많을 경우 정제 과정에서 데이터가 밀릴 수 있습니다. 업로드 전 불필요한 공백을 제거하면 가장 완벽한 결과가 나옵니다.</p>
                  </div>
                </div>
              </section>

              <section>
                <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                  💡 제작자의 팁: 자연어의 힘
                </h5>
                <p className="text-xs">
                  단순한 버튼 클릭도 강력하지만, 프롬프트 창에 **"`고객명`에서 (주) 포함된 건 다 지워줘"** 처럼 구체적으로 입력해 보세요.
                  데이터세탁소의 엔진은 단순 키워드가 아닌 사용자의 의도를 분석하도록 설계되었습니다.
                </p>
                <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100 italic text-[11px] text-indigo-700">
                  "데이터 정제는 기술이 아니라 예술입니다. 여러분의 소중한 데이터가 빛날 수 있도록 엔진을 매일 다듬고 있습니다."
                </div>
              </section>
            </CardContent>
            <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4 flex justify-end">
              <Button onClick={() => setGuideModalOpen(false)} className="bg-slate-900 hover:bg-slate-800 text-white px-8">
                확인했습니다
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Help Center Modal Overlay */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Bot size={20} className="text-blue-600" />
                  데이터세탁소 도움말 센터
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setHelpModalOpen(false)} className="h-8 w-8 p-0 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </Button>
              </div>
              <CardDescription>
                서비스의 핵심 기능과 사용 팁을 확인해 보세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto p-6 space-y-8 text-sm leading-relaxed text-slate-700">
              <section>
                <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                  <Bot size={18} className="text-blue-600" /> 빠른 시작 가이드
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-900 mb-1">1. 파일 업로드</div>
                    <p className="text-xs text-slate-500">정제할 CSV 또는 Excel 파일을 업로드하거나 화면에 끌어다 놓으세요.</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-900 mb-1">2. 정제 시작</div>
                    <p className="text-xs text-slate-500">빠른 실행 옵션을 체크하거나 프롬프트 창에 원하는 명령어를 입력하세요.</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-900 mb-1">3. 실시간 미리보기</div>
                    <p className="text-xs text-slate-500">AI가 정제한 결과를 실시간으로 확인하고 필요시 셀을 더블클릭해 직접 수정하세요.</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-900 mb-1">4. 결과 다운로드</div>
                    <p className="text-xs text-slate-500">정제가 완료되면 엑셀 파일로 다운로드하여 업무에 즉시 활용하세요.</p>
                  </div>
                </div>
              </section>

              <section>
                <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                  <Sparkles size={18} className="text-blue-600" /> 자연어 명령어 가이드
                </h5>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/30 rounded-lg border border-blue-100/50">
                    <div className="font-semibold text-blue-900 mb-1">데이터 치환/매핑</div>
                    <p className="text-xs text-blue-800">"`주소` 컬럼의 '서울시'를 '서울특별시'로 변경해줘"</p>
                  </div>
                  <div className="p-3 bg-blue-50/30 rounded-lg border border-blue-100/50">
                    <div className="font-semibold text-blue-900 mb-1">빈칸 처리</div>
                    <p className="text-xs text-blue-800">"`비고` 컬럼의 데이터가 '없음'이면 빈칸으로 만들어줘"</p>
                  </div>
                  <div className="p-3 bg-blue-50/30 rounded-lg border border-blue-100/50">
                    <div className="font-semibold text-blue-900 mb-1">패턴(와일드카드) 활용</div>
                    <p className="text-xs text-blue-800">"`금액` 컬럼에서 `[%d]원` 형식은 빈칸으로 변경"</p>
                    <ul className="mt-2 text-[11px] text-blue-700/70 list-disc list-inside">
                      <li><strong>%d</strong>: 임의의 숫자 (예: 123, 10, 5)</li>
                      <li><strong>%s</strong>: 임의의 문자열 (예: 안녕하세요, 가나다)</li>
                      <li><strong>%Nd</strong>: N자리의 숫자 (예: %3d {"->"} 532, 100)</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                  <AlertCircle size={18} className="text-blue-600" /> 자주 묻는 질문 (FAQ)
                </h5>
                <div className="space-y-4">
                  <div>
                    <div className="font-bold text-slate-900 mb-1 text-xs">Q. 내 데이터는 어디에 저장되나요?</div>
                    <p className="text-xs text-slate-600">본 서비스는 100% 로컬 브라우저 처리를 원칙으로 합니다. 데이터는 서버로 절대 전송되지 않으며, 귀하의 PC 안에서만 안전하게 정제됩니다.</p>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 mb-1 text-xs">Q. 큰 파일도 처리 가능한가요?</div>
                    <p className="text-xs text-slate-600">네, 수만 행의 데이터도 Web Worker 기술을 통해 UI 멈춤 없이 빠르게 처리할 수 있습니다. 다만 기기 사양에 따라 속도 차이가 있을 수 있습니다.</p>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 mb-1 text-xs">Q. 정제가 제대로 되지 않을 때는?</div>
                    <p className="text-xs text-slate-600">명령어에 사용한 컬럼명이 업로드한 파일의 헤더와 정확히 일치하는지 확인해 주세요. 따옴표를 사용하여 컬럼명을 명시하면 인식률이 높아집니다.</p>
                  </div>
                </div>
              </section>
            </CardContent>
            <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4 flex justify-end">
              <Button onClick={() => setHelpModalOpen(false)} className="bg-slate-900 hover:bg-slate-800 text-white px-8">
                닫기
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Terms Modal Overlay */}
      {termsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertCircle size={20} className="text-blue-600" />
                  이용약관 및 개인정보 처리방침
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setTermsModalOpen(false)} className="h-8 w-8 p-0 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </Button>
              </div>
              <CardDescription>
                데이터세탁소 서비스를 이용하시기 전 반드시 확인해 주세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto p-6 space-y-6 text-sm leading-relaxed text-slate-700">
              <section>
                <h5 className="font-bold text-slate-900 mb-2">1. 서비스의 성격</h5>
                <p>본 서비스는 개인 개발자가 데이터 정제 편의를 위해 개발하고 운영하는 1인 프로젝트입니다. 기업 규모의 공식적인 서비스를 제공하기보다는 사용자의 업무 효율을 돕기 위한 도구적 성격이 강합니다.</p>
              </section>

              <section className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <h5 className="font-bold text-blue-900 mb-2 flex items-center gap-1">
                  <Sparkles size={14} /> 2. 데이터 보안 (서버 저장 없음)
                </h5>
                <p className="text-blue-800">본 서비스의 가장 큰 특징은 <strong>사용자의 데이터를 서버로 전송하거나 저장하지 않는다는 것</strong>입니다. 모든 데이터 정제 로직은 귀하의 웹 브라우저 메모리 내(Web Worker)에서만 실행됩니다. 개발자를 포함한 그 누구도 귀하가 업로드한 파일을 열람하거나 수집할 수 없습니다.</p>
              </section>

              <section>
                <h5 className="font-bold text-slate-900 mb-2">3. 책임의 한계</h5>
                <p>데이터 정제 결과는 AI 모델과 정규식 로직에 따라 생성되며, 100%의 정확성을 보장하지 않습니다. 정제 과정 중 발생할 수 있는 데이터의 손실, 변형, 오인으로 인한 어떠한 손해에 대해서도 1인 개발자인 운영자는 법적/경제적 책임을 지지 않습니다. <strong>중요 데이터는 반드시 사전에 원본을 백업하시기 바랍니다.</strong></p>
              </section>

              <section>
                <h5 className="font-bold text-slate-900 mb-2">4. 서비스 이용 및 권한</h5>
                <p>누구나 자유롭게 서비스를 이용할 수 있습니다. 단, 본 서비스의 소스코드나 로직을 허가 없이 상업적으로 재판매하거나 크롤링 등을 통해 서비스를 마비시키는 행위는 금지합니다.</p>
              </section>

              <section>
                <h5 className="font-bold text-slate-900 mb-2">5. 연락처 및 피드백</h5>
                <p>서비스 개선 제안이나 버그 리포트는 아래 이메일로 보내주시면 감사하겠습니다. (1인 개발 특성상 답변이 다소 늦어질 수 있는 점 양해 부탁드립니다.)</p>
                <p className="mt-2 font-medium">Email: pentiumman@naver.com</p>
              </section>
            </CardContent>
            <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4 flex justify-end">
              <Button onClick={() => setTermsModalOpen(false)} className="bg-slate-900 hover:bg-slate-800 text-white px-8">
                확인했습니다
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Fix Modal Overlay */}
      {fixModalOpen && targetFixIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <Card className="w-[400px] shadow-lg border-slate-200 animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw size={18} className="text-blue-600" />
                데이터 일괄 수정
              </CardTitle>
              <CardDescription>
                '{targetFixIssue.column}' 컬럼의 길이 초과 데이터 <strong>{targetFixIssue.affectedRows?.length}건</strong>을 일괄 변경합니다.
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
                <p className="text-[11px] text-slate-500 mt-1">
                  * 입력하신 값으로 해당 데이터들이 모두 치환됩니다.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 bg-slate-50/50 p-4">
              <Button variant="ghost" onClick={() => setFixModalOpen(false)}>취소</Button>
              <Button onClick={handleApplyFix} className="bg-blue-600 hover:bg-blue-700 text-white">
                <RefreshCw size={14} className="mr-1" /> 일괄 적용
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

function CardBodyDownloader({ handleDownload, rowCount }: { handleDownload: () => void, rowCount: number }) {
  return (
    <div className="p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-medium text-green-700">작업 완료!</div>
        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">{rowCount} rows</div>
      </div>
      <Button onClick={handleDownload} variant="outline" className="w-full border-green-200 hover:bg-green-50 hover:text-green-700 text-green-600 transition-colors">
        <Download size={16} className="mr-2" />
        결과 파일 다운로드
      </Button>
    </div>
  )
}

function TableBodyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-table-2 text-slate-300"><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-4" /><path d="M9 3v18" /><path d="M3 9h18" /><path d="M3 15h18" /></svg>
  )
}
