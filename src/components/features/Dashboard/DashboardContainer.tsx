"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { DataIssue, ColumnOptionType, CleaningPreset } from '@/types';
import { useDataFlow } from '@/hooks/useDataFlow';
import { useCleaningOptions, INITIAL_OPTIONS } from '@/hooks/useCleaningOptions';
import { useDashboardModals } from '@/hooks/useDashboardModals';
import { downloadData } from '@/lib/core/exporters';
import { checkNLPTargetAmbiguity } from '@/lib/core/processors';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Components
import { UploadSection } from '@/components/dashboard/UploadSection';
import { CleaningOptions } from '@/components/dashboard/CleaningOptions';
import { AnalysisReport } from '@/components/dashboard/AnalysisReport';
import { ResultSummary } from '@/components/dashboard/ResultSummary';
import { DataPreviewTable } from '@/components/dashboard/DataPreviewTable';
import { DownloadSection } from '@/components/dashboard/DownloadSection';
import { LoadingOverlay } from '@/components/processing/LoadingOverlay';
import { AdBanner } from '@/components/dashboard/AdBanner';

// ⚡ 모달 컴포넌트 Lazy Loading: 열기 전까지 코드를 로드하지 않음
import dynamic from 'next/dynamic';
const DonateModal = dynamic(() => import('@/components/dashboard/Modals').then(m => m.DonateModal), { ssr: false });
const GuideModal = dynamic(() => import('@/components/dashboard/Modals').then(m => m.GuideModal), { ssr: false });
const HelpModal = dynamic(() => import('@/components/dashboard/Modals').then(m => m.HelpModal), { ssr: false });
const TermsModal = dynamic(() => import('@/components/dashboard/Modals').then(m => m.TermsModal), { ssr: false });
const FixModal = dynamic(() => import('@/components/dashboard/Modals').then(m => m.FixModal), { ssr: false });
const FormatGuideModal = dynamic(() => import('@/components/dashboard/Modals').then(m => m.FormatGuideModal), { ssr: false });
const ConfirmModal = dynamic(() => import('@/components/dashboard/Modals').then(m => m.ConfirmModal), { ssr: false });
const AlertModal = dynamic(() => import('@/components/dashboard/Modals').then(m => m.AlertModal), { ssr: false });
import { Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardContainer() {
    // 1. Logic Hooks
    const {
        file, data, processedData, headers, isProcessing, progress, progressMessage,
        error, issues, stats, lockedColumns, columnLimits,
        setIssues, updateColumnLimit, handleFileSelect, startProcessing,
        updateCell, updateHeader, toggleLock, setError, resetData,
        detectedDateColumns, columnOptions, updateColumnOption, initialStats, applyProcessedToOriginal
    } = useDataFlow();

    const { options, setOptions, prompt, setPrompt } = useCleaningOptions();
    const modals = useDashboardModals();

    // 2. UI Local State
    const [showAllIssues, setShowAllIssues] = useState(false);
    const [filterIssue, setFilterIssue] = useState<DataIssue | null>(null);
    const [delayedShowLoading, setDelayedShowLoading] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);
    const prevIsProcessingRef = useRef(false);

    // 3. Effects
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isProcessing) {
            timer = setTimeout(() => setDelayedShowLoading(true), 3000);
        } else {
            setDelayedShowLoading(false);
        }
        return () => clearTimeout(timer);
    }, [isProcessing]);

    useEffect(() => {
        const justFinished = prevIsProcessingRef.current === true && isProcessing === false;
        if (justFinished && processedData.length > 0) {
            setTimeout(() => {
                previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
        prevIsProcessingRef.current = isProcessing;
    }, [isProcessing, processedData.length]);

    // 4. Handlers
    const handleApplyProcessed = useCallback(() => {
        applyProcessedToOriginal(() => {
            setOptions(INITIAL_OPTIONS);
            setPrompt("");
            modals.showAlert("결과 확정 완료", "정제된 데이터가 원본으로 확정되었습니다.\n모든 체크박스와 명령어도 초기화되었습니다. ✨", 'success');
        });
    }, [applyProcessedToOriginal, setOptions, setPrompt, modals]);

    const handleProcess = () => {
        const { isAmbiguous, hasAction } = checkNLPTargetAmbiguity(prompt, headers);
        if (isAmbiguous && hasAction) {
            modals.showConfirm(
                "전체 적용 확인",
                "특정 컬럼이 지정되지 않았습니다.\n모든 컬럼을 대상으로 정제를 진행하시겠습니까?",
                () => {
                    modals.closeConfirm();
                    startProcessing(prompt, options);
                }
            );
            return;
        }
        startProcessing(prompt, options);
    };

    // 왜 래퍼가 필요한가: updateColumnOption만 호출하면 state만 바뀌고
    // 실제 데이터 재처리가 트리거되지 않음. 설정 변경 → 즉시 재처리를 보장.
    const handleColumnOptionChange = useCallback((header: string, type: ColumnOptionType) => {
        updateColumnOption(header, type);
        // 변경된 columnOptions를 명시적으로 전달하여 즉시 재처리
        const updatedColOptions = { ...columnOptions, [header]: type };
        // type이 null이면 해당 키 삭제 (해제)
        if (type === null) {
            delete updatedColOptions[header];
        }
        startProcessing(prompt, options, lockedColumns, columnLimits, updatedColOptions);
    }, [updateColumnOption, columnOptions, startProcessing, prompt, options, lockedColumns, columnLimits]);

    const handleDownload = () => {
        if (!file) return;
        const fileName = `cleaned_${file.name.replace(/\.[^/.]+$/, "")}.xlsx`;
        downloadData(processedData, fileName, data, options.highlightChanges);
    };

    const handleApplyPreset = useCallback((preset: CleaningPreset) => {
        setOptions(preset.options);
        setPrompt(preset.prompt);
        Object.entries(preset.columnOptions).forEach(([col, opt]) => {
            updateColumnOption(col, opt as ColumnOptionType);
        });
        startProcessing(preset.prompt, preset.options, lockedColumns, columnLimits, preset.columnOptions);
        modals.showAlert("프리셋 적용 완료", `'${preset.name}' 프리셋이 성공적으로 적용되었습니다. ✨`, 'success');
    }, [setOptions, setPrompt, updateColumnOption, startProcessing, lockedColumns, columnLimits, modals]);

    const handleApplySuggestion = useCallback((issue: DataIssue) => {
        if (issue.promptSuggestion) {
            setPrompt(prev => prev ? `${prev}, ${issue.promptSuggestion}` : issue.promptSuggestion!);
            modals.showAlert("제안 추가 완료", "프롬프트에 제안 내용이 추가되었습니다.\n'데이터 정제하기' 버튼을 눌러 적용해 보세요.", 'info');
            return;
        }
        if (issue.suggestion) {
            const mapping: Record<string, ColumnOptionType> = {
                removeWhitespace: 'trim', formatMobile: 'mobile', formatGeneralPhone: 'phone',
                formatDate: 'date', formatDateTime: 'datetime', formatNumber: 'amount',
                cleanEmail: 'emailClean', formatZip: 'zip', cleanGarbage: 'garbage',
                cleanAmount: 'amount', cleanName: 'nameClean', formatBizNum: 'bizNum',
                formatCorpNum: 'corpNum', formatUrl: 'url', maskPersonalData: 'rrn',
                maskAccount: 'accountMask', maskCard: 'cardMask', maskName: 'nameMask',
                maskEmail: 'emailMask', maskAddress: 'addressMask', maskPhoneMid: 'phoneMidMask',
                categoryAge: 'ageCategory', truncateDate: 'dateTruncate', restoreExponential: 'exponentialRestore',
                extractBuilding: 'buildingExtract', normalizeSKU: 'skuNormalize', unifyUnit: 'unitUnify',
                standardizeCurrency: 'currencyStandardize', cleanCompanyName: 'companyClean', removePosition: 'positionRemove',
                extractDong: 'dongExtract', cleanAreaUnit: 'area', cleanSnsId: 'snsId', formatHashtag: 'hashtag',
                formatTaxDate: 'date', formatAccountingNum: 'amount'
            };
            const firstOptionKey = Object.keys(issue.suggestion)[0];
            const targetOption = mapping[firstOptionKey];

            if (targetOption) {
                updateColumnOption(issue.column, targetOption);
                const updatedColOptions = { ...columnOptions, [issue.column]: targetOption };
                startProcessing(prompt, options, lockedColumns, columnLimits, updatedColOptions);
                modals.showAlert("자동 정제 적용", `'${issue.column}' 컬럼에 최적화된 정제 설정이 적용되었습니다. ✨`, 'success');
            } else {
                const newOptions = { ...options, ...issue.suggestion };
                setOptions(newOptions);
                startProcessing(prompt, newOptions);
            }
        }
    }, [options, prompt, setOptions, setPrompt, startProcessing, updateColumnOption, columnOptions, lockedColumns, columnLimits, modals]);

    const handleApplyFix = () => {
        if (!modals.targetFixIssue || !modals.targetFixIssue.affectedRows) return;
        modals.targetFixIssue.affectedRows.forEach(rowIdx => {
            updateCell(rowIdx, modals.targetFixIssue!.column, modals.replacementValue);
        });
        modals.closeFixModal();
    };

    // Drag & Drop
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
    };
    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
    };

    return (
        <div className="bg-[var(--laundry-bg)] text-[var(--laundry-text)] font-sans selection:bg-[var(--laundry-accent)] selection:text-[var(--laundry-bg)] p-4 max-w-7xl mx-auto">
            {/* Layout */}
            <div className="flex justify-center items-start gap-4 px-4 2xl:gap-8">
                {/* [AD-2] */}
                <aside className="hidden min-[1440px]:flex sticky top-24 w-[140px] flex-col items-center shrink-0 py-4 ml-[-140px]">
                    <div className="card-industrial p-2 overflow-hidden flex flex-col items-center w-full">
                        <span className="text-[8px] text-[var(--laundry-subtle)] font-black mb-1.5 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">
                            <span className="bg-[var(--laundry-border)] text-[var(--laundry-muted)] px-1 rounded-sm mb-1">AD-2</span> Sponsored
                        </span>
                        <AdBanner slot="3333333333" format="vertical" isTest={true} className="w-full" height="500px" />
                    </div>
                </aside>

                {/* Quick Nav */}
                <div className="fixed bottom-12 right-12 flex flex-col gap-4 z-[100]">
                    <Button onClick={() => document.getElementById('section-options')?.scrollIntoView({ behavior: 'smooth' })} className="w-16 h-16 rounded-full bg-[var(--laundry-surface)] shadow-xl border-2 border-[var(--laundry-border)] hover:border-[var(--laundry-accent)] hover:bg-[var(--laundry-elevated)] transition-all group flex flex-col items-center justify-center gap-1 p-0 scale-100 hover:scale-110 active:scale-95" variant="outline">
                        <Zap size={22} className="text-[var(--laundry-accent)] group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-[var(--laundry-muted)]">정제설정</span>
                    </Button>
                    <Button onClick={() => document.getElementById('section-preview')?.scrollIntoView({ behavior: 'smooth' })} className="w-16 h-16 rounded-full bg-[var(--laundry-accent)] shadow-xl hover:bg-[var(--laundry-accent-hover)] transition-all group border-0 flex flex-col items-center justify-center gap-1 p-0 scale-100 hover:scale-110 active:scale-95">
                        <CheckCircle2 size={22} className="text-[var(--laundry-bg)] group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-[var(--laundry-bg)]">미리보기</span>
                    </Button>
                </div>

                {/* Main Content */}
                <div className="w-full max-w-7xl flex-shrink-1 px-4">
                    {/* [AD-1] */}
                    <div className="mt-4 flex-shrink-0">
                        <div className="card-industrial p-2 overflow-hidden flex flex-col items-center w-full" style={{ height: '94px', overflow: 'hidden' }}>
                            <span className="text-[8px] text-[var(--laundry-subtle)] font-black mb-1.5 uppercase tracking-[0.2em] flex items-center gap-1">
                                <span className="bg-[var(--laundry-border)] text-[var(--laundry-muted)] px-1 rounded-sm">AD-1</span> Sponsored
                            </span>
                            <AdBanner slot="5555555555" format="horizontal" isTest={true} className="w-full" />
                        </div>
                    </div>

                    <main className="py-6 sm:py-8 space-y-10">
                        <section id="section-upload" className="animation-fade-in">
                            <UploadSection file={file} isDragging={false} error={error} onDragOver={handleDragOver} onDragLeave={() => { }} onDrop={handleDrop} onFileSelect={onFileSelect} />
                        </section>

                        <section id="section-options" className="animation-fade-in">
                            <ErrorBoundary>
                                <CleaningOptions
                                    options={options} setOptions={setOptions} prompt={prompt} setPrompt={setPrompt}
                                    isProcessing={isProcessing} progress={progress} progressMessage={progressMessage}
                                    onProcess={handleProcess} fileLoaded={!!file} detectedDateColumns={detectedDateColumns}
                                    columnOptions={columnOptions} onApplyPreset={handleApplyPreset}
                                />
                            </ErrorBoundary>
                        </section>

                        {file && (
                            <section id="section-report" className="animation-fade-in">
                                <AnalysisReport
                                    issues={issues} showAllIssues={showAllIssues} setShowAllIssues={setShowAllIssues}
                                    filterIssue={filterIssue} setFilterIssue={setFilterIssue}
                                    onApplySuggestion={handleApplySuggestion} onOpenFixModal={modals.openFixModal}
                                />
                            </section>
                        )}

                        <section id="section-preview" className="space-y-4" ref={previewRef}>
                            <h2 className="text-lg sm:text-xl font-bold text-[var(--laundry-text)] flex items-center gap-2 flex-wrap px-4">
                                <span className="w-1.5 h-5 sm:h-6 bg-[var(--laundry-accent)] rounded-full inline-block"></span> 데이터 미리보기
                                {file && (
                                    <>
                                        <span className="text-xs sm:text-sm font-normal text-[var(--laundry-muted)] ml-1 sm:ml-2">({file.name})</span>
                                        <span className="flex-1 sm:flex-none sm:ml-auto text-[10px] font-medium text-[var(--laundry-accent)] bg-[var(--laundry-accent-glow)] px-2 py-1 rounded border border-[var(--laundry-accent)]/20 flex items-center gap-1.5 animate-fade-in w-fit">더블클릭하여 셀 직접 수정 가능</span>
                                    </>
                                )}
                            </h2>
                            <div className="w-full overflow-hidden bg-[var(--laundry-surface)] rounded-lg border border-[var(--laundry-border)] flex flex-col">
                                <ErrorBoundary>
                                    <DataPreviewTable
                                        processedData={processedData} originalData={data} headers={headers} lockedColumns={lockedColumns}
                                        toggleLock={toggleLock} columnLimits={columnLimits} onLimitChange={updateColumnLimit}
                                        onHeaderRename={updateHeader} onCellUpdate={updateCell} filterIssue={filterIssue}
                                        columnOptions={columnOptions} onColumnOptionChange={handleColumnOptionChange} onReset={resetData} onApply={handleApplyProcessed}
                                    />
                                </ErrorBoundary>
                            </div>
                        </section>

                        {file && (
                            <div className="space-y-6">
                                <div id="section-stats" className="animation-fade-in">
                                    <ResultSummary stats={stats} initialStats={initialStats} issues={issues} processedData={processedData} setIssues={setIssues} />
                                </div>
                                <div id="section-download" className="animation-fade-in">
                                    <DownloadSection handleDownload={handleDownload} rowCount={processedData.length} />
                                </div>
                            </div>
                        )}

                        <div className="mt-8 mb-6 flex-shrink-0">
                            <div className="card-industrial p-2 overflow-hidden flex flex-col items-center w-full" style={{ height: '96px', overflow: 'hidden' }}>
                                <span className="text-[8px] text-[var(--laundry-subtle)] font-black mb-2 uppercase tracking-widest flex items-center gap-1">
                                    <span className="bg-[var(--laundry-border)] text-[var(--laundry-muted)] px-1 rounded-sm">AD-4</span> RECOMMENDED
                                </span>
                                <AdBanner slot="1111111111" format="horizontal" isTest={true} className="w-full" />
                            </div>
                        </div>
                    </main>
                </div>

                {/* [AD-3] */}
                <aside className="hidden min-[1440px]:flex sticky top-24 w-[140px] flex-col items-center shrink-0 py-4 mr-[-140px]">
                    <div className="card-industrial p-2 overflow-hidden flex flex-col items-center w-full">
                        <span className="text-[8px] text-[var(--laundry-subtle)] font-black mb-1.5 uppercase tracking-widest [writing-mode:vertical-lr]">
                            <span className="bg-[var(--laundry-border)] text-[var(--laundry-muted)] px-1 rounded-sm mb-1">AD-3</span> Recommended
                        </span>
                        <AdBanner slot="4444443333" format="vertical" isTest={true} className="w-full" height="500px" />
                    </div>
                </aside>
            </div>

            {/* Modals handled by Hook */}
            <DonateModal open={modals.donateModalOpen} onClose={() => modals.setDonateModalOpen(false)} />
            <GuideModal open={modals.guideModalOpen} onClose={() => modals.setGuideModalOpen(false)} />
            <HelpModal open={modals.helpModalOpen} onClose={() => modals.setHelpModalOpen(false)} />
            <TermsModal open={modals.termsModalOpen} onClose={() => modals.setTermsModalOpen(false)} />
            <FormatGuideModal open={modals.formatGuideModalOpen} onClose={() => modals.setFormatGuideModalOpen(false)} />
            <FixModal
                open={modals.fixModalOpen} onClose={modals.closeFixModal}
                targetIssue={modals.targetFixIssue} replacementValue={modals.replacementValue}
                setReplacementValue={modals.setReplacementValue} onApply={handleApplyFix}
            />
            <AlertModal
                open={modals.alertConfig.open} onClose={modals.closeAlert}
                title={modals.alertConfig.title} description={modals.alertConfig.description} type={modals.alertConfig.type as 'success' | 'info' | 'warning' | 'error'}
            />
            <ConfirmModal
                open={modals.confirmConfig.open} onClose={modals.closeConfirm} onConfirm={modals.confirmConfig.onConfirm}
                title={modals.confirmConfig.title} description={modals.confirmConfig.description}
            />
            <LoadingOverlay isVisible={delayedShowLoading} progress={progress} message={progressMessage} />
        </div>
    );
}
