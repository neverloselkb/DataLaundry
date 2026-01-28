"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { DataIssue, DataRow, ColumnOptionType, CleaningPreset } from '@/types';
import { useDataFlow } from '@/hooks/useDataFlow';
import { useCleaningOptions, INITIAL_OPTIONS } from '@/hooks/useCleaningOptions';
import { downloadData } from '@/lib/core/exporters';

// Components
import { Header } from '@/components/dashboard/Header';
import { Footer } from '@/components/dashboard/Footer';
import { UploadSection } from '@/components/dashboard/UploadSection';
import { CleaningOptions } from '@/components/dashboard/CleaningOptions';
import { AnalysisReport } from '@/components/dashboard/AnalysisReport';
import { ResultSummary } from '@/components/dashboard/ResultSummary';
import { DataPreviewTable } from '@/components/dashboard/DataPreviewTable';
import { DownloadSection } from '@/components/dashboard/DownloadSection';
import { DonateModal, GuideModal, HelpModal, TermsModal, FixModal, FormatGuideModal, ConfirmModal, AlertModal } from '@/components/dashboard/Modals';
import { LoadingOverlay } from '@/components/processing/LoadingOverlay';
import { AdBanner } from '@/components/dashboard/AdBanner';
import { Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkNLPTargetAmbiguity } from '@/lib/core/processors';

export default function DataCleanDashboard() {
  // 1. Custom Hooks
  const {
    file,
    data,
    processedData,
    headers,
    isProcessing,
    progress,
    progressMessage,
    // ... rest of hooks
    error,
    issues,
    stats,
    lockedColumns,
    columnLimits,
    setIssues,
    setColumnLimits,
    handleFileSelect,
    startProcessing,
    updateCell,
    updateHeader,
    toggleLock,
    updateColumnLimit,
    setError,
    resetData,
    detectedDateColumns,
    columnOptions,
    updateColumnOption,
    initialStats,
    applyProcessedToOriginal
  } = useDataFlow();

  const handleApplyProcessed = () => {
    applyProcessedToOriginal(() => {
      // 1. 기존 옵션 및 프롬프트 초기화 [Rule 9]
      setOptions(INITIAL_OPTIONS);
      setPrompt("");

      // 2. 성공 팝업 노출
      setAlertConfig({
        open: true,
        title: "결과 확정 완료",
        description: "정제된 데이터가 원본으로 확정되었습니다.\n모든 체크박스와 명령어도 초기화되었습니다. ✨",
        type: 'success'
      });
    });
  };

  const { options, setOptions, prompt, setPrompt } = useCleaningOptions();

  // 2. UI State (Modals & Filters)
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [filterIssue, setFilterIssue] = useState<DataIssue | null>(null);
  const [delayedShowLoading, setDelayedShowLoading] = useState(false); // [NEW]
  const previewRef = useRef<HTMLDivElement>(null); // [NEW]

  // 로딩 팝업 지연 노출 제어 (3초 이상 소요 시에만 표시)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isProcessing) {
      // 3초 후에도 여전히 처리 중이라면 팝업 표시
      timer = setTimeout(() => {
        setDelayedShowLoading(true);
      }, 3000);
    } else {
      // 처리가 완료되면 즉시 팝업 제거
      setDelayedShowLoading(false);
    }

    return () => clearTimeout(timer);
  }, [isProcessing]);

  const prevIsProcessingRef = useRef(false);

  // [New] 정제 완료 시 미리보기 섹션으로 자동 스크롤 및 광고 팝업 노출
  useEffect(() => {
    // isProcessing이 true였다가 false로 바뀌는 순간(정제 완료)을 정확히 감지
    const justFinished = prevIsProcessingRef.current === true && isProcessing === false;

    if (justFinished && processedData.length > 0) {
      // 1. 미리보기 섹션으로 스크롤 이동
      const scrollTimer = setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

      return () => {
        clearTimeout(scrollTimer);
      };
    }

    // 현재 상태를 ref에 저장하여 다음 렌더링 시 비교
    prevIsProcessingRef.current = isProcessing;
  }, [isProcessing, processedData.length]);

  // Modals State
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [formatGuideModalOpen, setFormatGuideModalOpen] = useState(false);



  // Fix Modal State
  const [fixModalOpen, setFixModalOpen] = useState(false);
  const [targetFixIssue, setTargetFixIssue] = useState<DataIssue | null>(null);
  const [replacementValue, setReplacementValue] = useState("");

  // Generic Alert/Confirm State [NEW]
  const [alertConfig, setAlertConfig] = useState<{ open: boolean; title: string; description: string; type?: 'success' | 'info' }>({
    open: false, title: "", description: ""
  });
  const [confirmConfig, setConfirmConfig] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({
    open: false, title: "", description: "", onConfirm: () => { }
  });

  // 3. Handlers
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleProcess = () => {
    // [New] 타겟 컬럼이 미지정된 경우 사용자 확인 로직 추가
    const { isAmbiguous, hasAction } = checkNLPTargetAmbiguity(prompt, headers);

    if (isAmbiguous && hasAction) {
      setConfirmConfig({
        open: true,
        title: "전체 적용 확인",
        description: "특정 컬럼이 지정되지 않았습니다.\n모든 컬럼을 대상으로 정제를 진행하시겠습니까?",
        onConfirm: () => {
          setConfirmConfig(prev => ({ ...prev, open: false }));
          startProcessing(prompt, options);
        }
      });
      return;
    }

    startProcessing(prompt, options);
  };

  const handleDownload = () => {
    if (!file) return;
    const fileName = `cleaned_${file.name.replace(/\.[^/.]+$/, "")}.xlsx`;
    downloadData(processedData, fileName, data, options.highlightChanges);
  };

  // Issue Suggestion Application (Single Issue) - Targeted to Column
  const handleApplySuggestion = useCallback((issue: DataIssue) => {
    if (!issue.suggestion && !issue.promptSuggestion) return;

    if (issue.promptSuggestion) {
      setPrompt(prev => prev ? `${prev}, ${issue.promptSuggestion}` : issue.promptSuggestion!);
      setAlertConfig({
        open: true,
        title: "제안 추가 완료",
        description: "프롬프트에 제안 내용이 추가되었습니다.\n'데이터 정제하기' 버튼을 눌러 적용해 보세요.",
        type: 'info'
      });
      return;
    }

    if (issue.suggestion) {
      // 전역 옵션 키를 컬럼전용 옵션 타입으로 매핑
      const mapping: Record<string, ColumnOptionType> = {
        removeWhitespace: 'trim',
        formatMobile: 'mobile',
        formatGeneralPhone: 'phone',
        formatDate: 'date',
        formatDateTime: 'datetime',
        formatNumber: 'amount',
        cleanEmail: 'emailClean',
        formatZip: 'zip',
        cleanGarbage: 'garbage',
        cleanAmount: 'amount',
        cleanName: 'nameClean',
        formatBizNum: 'bizNum',
        formatCorpNum: 'corpNum',
        formatUrl: 'url',
        maskPersonalData: 'rrn',
        maskAccount: 'accountMask',
        maskCard: 'cardMask',
        maskName: 'nameMask',
        maskEmail: 'emailMask',
        maskAddress: 'addressMask',
        maskPhoneMid: 'phoneMidMask',
        categoryAge: 'ageCategory',
        truncateDate: 'dateTruncate',
        restoreExponential: 'exponentialRestore',
        extractBuilding: 'buildingExtract',
        normalizeSKU: 'skuNormalize',
        unifyUnit: 'unitUnify',
        standardizeCurrency: 'currencyStandardize',
        cleanCompanyName: 'companyClean',
        removePosition: 'positionRemove',
        extractDong: 'dongExtract',
        cleanAreaUnit: 'area',
        cleanSnsId: 'snsId',
        formatHashtag: 'hashtag',
        formatTaxDate: 'date', // 예외적 매핑
        formatAccountingNum: 'amount' // 예외적 매핑
      };

      // 첫 번째 발견된 제안 옵션을 해당 컬럼의 전용 옵션으로 적용
      const firstOptionKey = Object.keys(issue.suggestion)[0];
      const targetOption = mapping[firstOptionKey];

      if (targetOption) {
        updateColumnOption(issue.column, targetOption);

        // 즉시 반영을 위해 현재 상태를 기반으로 업데이트된 옵션 객체 생성 후 전달
        const updatedColOptions = { ...columnOptions, [issue.column]: targetOption };
        startProcessing(prompt, options, lockedColumns, columnLimits, updatedColOptions);

        setAlertConfig({
          open: true,
          title: "자동 정제 적용",
          description: `'${issue.column}' 컬럼에 최적화된 정제 설정이 적용되었습니다. ✨`,
          type: 'success'
        });
      } else {
        // 매핑 실패 시 기존처럼 전역 옵션 시도 (폴백)
        const newOptions = { ...options, ...issue.suggestion };
        setOptions(newOptions);
        startProcessing(prompt, newOptions);
      }
    }
  }, [options, prompt, setOptions, setPrompt, startProcessing, updateColumnOption, columnOptions, lockedColumns, columnLimits]);

  // Handle Preset Application
  const handleApplyPreset = useCallback((preset: CleaningPreset) => {
    // 1. 상태 업데이트
    setOptions(preset.options);
    setPrompt(preset.prompt);

    // 2. 컬럼별 옵션 업데이트 (프리셋에 저장된 값으로 대체)
    Object.entries(preset.columnOptions).forEach(([col, opt]) => {
      updateColumnOption(col, opt as ColumnOptionType);
    });

    // 3. 즉시 정제 시작 (상태가 아직 반영 안되었을 수 있으므로 직접 전달)
    startProcessing(preset.prompt, preset.options, lockedColumns, columnLimits, preset.columnOptions);

    setAlertConfig({
      open: true,
      title: "프리셋 적용 완료",
      description: `'${preset.name}' 프리셋이 성공적으로 적용되었습니다. ✨`,
      type: 'success'
    });
  }, [setOptions, setPrompt, updateColumnOption, startProcessing, lockedColumns, columnLimits]);

  // Bulk Fix Handler (Max Length, etc.)
  const handleOpenFixModal = (issue: DataIssue) => {
    setTargetFixIssue(issue);
    setReplacementValue("");
    setFixModalOpen(true);
  };

  const handleApplyFix = () => {
    if (!targetFixIssue || !targetFixIssue.affectedRows) return;

    const { column, affectedRows } = targetFixIssue;

    // Update affected cells locally
    affectedRows.forEach(rowIdx => {
      updateCell(rowIdx, column, replacementValue);
    });

    // Close modal and clear fix state
    setFixModalOpen(false);
    setTargetFixIssue(null);
    setReplacementValue("");

    // Re-detect issues handled by useDataFlow or effect if needed?
    // Since updateCell updates processedData, and useDataFlow doesn't auto-detect issues on every cell edit (performance),
    // we might need to manually trigger detection or just let the user see the updated table.
    // Ideally, ResultSummary has a refresh button.
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      <Header onOpenGuide={() => setFormatGuideModalOpen(true)} />

      {/* Main Layout Wrapper: Flex container to center content and float ads */}
      <div className="flex justify-center items-start gap-4 px-4 2xl:gap-8">

        {/* [AD-2] Left Hugging Ad - Vertical Sidebar */}
        <aside className="hidden min-[1440px]:flex sticky top-24 w-[140px] flex-col items-center shrink-0 py-4 ml-[-140px]">
          <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm overflow-hidden flex flex-col items-center w-full">
            <span className="text-[8px] text-blue-600 font-black mb-1.5 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">
              <span className="bg-blue-600 text-white px-1 rounded-sm mb-1">AD-2</span> Sponsored
            </span>
            <AdBanner slot="3333333333" format="vertical" isTest={true} className="w-full" height="500px" />
          </div>
        </aside>

        {/* Floating Quick Navigation Sidebar (Sticky on screen) */}
        <div className="fixed bottom-12 right-12 flex flex-col gap-4 z-[100]">
          <Button
            onClick={() => document.getElementById('section-options')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-16 h-16 rounded-full bg-white shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)] border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50 transition-all group flex flex-col items-center justify-center gap-1 p-0 scale-100 hover:scale-110 active:scale-95"
            variant="outline"
          >
            <Zap size={22} className="text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black text-slate-600">정제설정</span>
          </Button>
          <Button
            onClick={() => document.getElementById('section-preview')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-16 h-16 rounded-full bg-blue-600 shadow-[0_20px_50px_rgba(37,_99,_235,_0.4)] hover:bg-blue-700 transition-all group border-0 flex flex-col items-center justify-center gap-1 p-0 scale-100 hover:scale-110 active:scale-95"
          >
            <CheckCircle2 size={22} className="text-white group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black text-white">미리보기</span>
          </Button>
        </div>

        {/* Center Content Section (Fixed max-width) */}
        <div className="w-full max-w-7xl flex-shrink-1 px-4">
          {/* Top Wide Ad - AD-1 */}
          <div className="mt-4 flex-shrink-0">
            <div
              className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm overflow-hidden flex flex-col items-center w-full"
              style={{ height: '94px', overflow: 'hidden' }}
            >
              <span className="text-[8px] text-blue-600 font-black mb-1.5 uppercase tracking-[0.2em] flex items-center gap-1">
                <span className="bg-blue-600 text-white px-1 rounded-sm">AD-1</span> Sponsored
              </span>
              <AdBanner slot="5555555555" format="horizontal" isTest={true} className="w-full" />
            </div>
          </div>

          <main className="py-6 sm:py-8 space-y-10">
            {/* 1. Data Upload (Top, Full Width) */}
            <section id="section-upload" className="animation-fade-in">
              <UploadSection
                file={file}
                isDragging={false}
                error={error}
                onDragOver={handleDragOver}
                onDragLeave={() => { }}
                onDrop={handleDrop}
                onFileSelect={onFileSelect}
              />
            </section>

            {/* 2. Cleaning Options (Full Width, Multi-column inside) */}
            <section id="section-options" className="animation-fade-in">
              <CleaningOptions
                options={options}
                setOptions={setOptions}
                prompt={prompt}
                setPrompt={setPrompt}
                isProcessing={isProcessing}
                progress={progress}
                progressMessage={progressMessage}
                onProcess={handleProcess}
                fileLoaded={!!file}
                detectedDateColumns={detectedDateColumns}
                columnOptions={columnOptions}
                onApplyPreset={handleApplyPreset}
              />
            </section>

            {/* 3. Analysis Report (Immediately below options) */}
            {file && (
              <section id="section-report" className="animation-fade-in">
                <AnalysisReport
                  issues={issues}
                  showAllIssues={showAllIssues}
                  setShowAllIssues={setShowAllIssues}
                  filterIssue={filterIssue}
                  setFilterIssue={setFilterIssue}
                  onApplySuggestion={handleApplySuggestion}
                  onOpenFixModal={handleOpenFixModal}
                />
              </section>
            )}

            {/* 4. Data Preview (Main Area) */}
            <section id="section-preview" className="space-y-4" ref={previewRef}>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 flex-wrap px-4">
                <span className="w-1.5 h-5 sm:h-6 bg-blue-600 rounded-full inline-block"></span>
                데이터 미리보기
                {file && (
                  <>
                    <span className="text-xs sm:text-sm font-normal text-slate-500 ml-1 sm:ml-2">({file.name})</span>
                    <span className="flex-1 sm:flex-none sm:ml-auto text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1.5 animate-fade-in shadow-sm w-fit">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      더블클릭하여 셀 직접 수정 가능
                    </span>
                  </>
                )}
              </h2>

              <div className="w-full overflow-hidden bg-white rounded-xl border border-slate-200 shadow-xl ring-1 ring-slate-200/50 flex flex-col">
                <DataPreviewTable
                  processedData={processedData}
                  originalData={data}
                  headers={headers}
                  lockedColumns={lockedColumns}
                  toggleLock={toggleLock}
                  columnLimits={columnLimits}
                  onLimitChange={updateColumnLimit}
                  onHeaderRename={updateHeader}
                  onCellUpdate={updateCell}
                  filterIssue={filterIssue}
                  columnOptions={columnOptions}
                  onColumnOptionChange={updateColumnOption}
                  onReset={resetData}
                  onApply={handleApplyProcessed}
                />
              </div>
            </section>

            {/* 5. Result Summary & 6. Download (Below Preview, Single row each) */}
            {file && (
              <div className="space-y-6">
                <div id="section-stats" className="animation-fade-in">
                  <ResultSummary
                    stats={stats}
                    initialStats={initialStats}
                    issues={issues}
                    processedData={processedData}
                    setIssues={setIssues}
                  />
                </div>

                <div id="section-download" className="animation-fade-in">
                  <DownloadSection
                    handleDownload={handleDownload}
                    rowCount={processedData.length}
                  />
                </div>
              </div>
            )}

            {/* Bottom Banner Ad - AD-4 */}
            <div className="mt-8 mb-6 flex-shrink-0">
              <div
                className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm overflow-hidden flex flex-col items-center w-full"
                style={{ height: '96px', overflow: 'hidden' }}
              >
                <span className="text-[8px] text-blue-600 font-black mb-2 uppercase tracking-widest flex items-center gap-1">
                  <span className="bg-blue-600 text-white px-1 rounded-sm">AD-4</span> RECOMMENDED
                </span>
                <AdBanner slot="1111111111" format="horizontal" isTest={true} className="w-full" />
              </div>
            </div>
          </main>
        </div>

        {/* [AD-3] Right Hugging Ad - Vertical Sidebar */}
        <aside className="hidden min-[1440px]:flex sticky top-24 w-[140px] flex-col items-center shrink-0 py-4 mr-[-140px]">
          <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm overflow-hidden flex flex-col items-center w-full">
            <span className="text-[8px] text-blue-600 font-black mb-1.5 uppercase tracking-widest [writing-mode:vertical-lr]">
              <span className="bg-blue-600 text-white px-1 rounded-sm mb-1">AD-3</span> Recommended
            </span>
            <AdBanner slot="4444443333" format="vertical" isTest={true} className="w-full" height="500px" />
          </div>
        </aside>
      </div>

      <Footer
        setTermsModalOpen={setTermsModalOpen}
        setHelpModalOpen={setHelpModalOpen}
        setGuideModalOpen={setGuideModalOpen}
        setDonateModalOpen={setDonateModalOpen}
        setFormatGuideModalOpen={setFormatGuideModalOpen}
      />

      {/* Modals */}
      <DonateModal open={donateModalOpen} onClose={() => setDonateModalOpen(false)} />
      <GuideModal open={guideModalOpen} onClose={() => setGuideModalOpen(false)} />
      <HelpModal open={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
      <TermsModal open={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
      <FormatGuideModal open={formatGuideModalOpen} onClose={() => setFormatGuideModalOpen(false)} />

      <FixModal
        open={fixModalOpen}
        onClose={() => setFixModalOpen(false)}
        targetIssue={targetFixIssue}
        replacementValue={replacementValue}
        setReplacementValue={setReplacementValue}
        onApply={handleApplyFix}
      />

      {/* Full Screen Loading Overlay */}
      <LoadingOverlay
        isVisible={delayedShowLoading}
        progress={progress}
        message={progressMessage}
      />

      {/* Alert & Confirm Modals */}
      <AlertModal
        open={alertConfig.open}
        onClose={() => setAlertConfig(prev => ({ ...prev, open: false }))}
        title={alertConfig.title}
        description={alertConfig.description}
        type={alertConfig.type}
      />
      <ConfirmModal
        open={confirmConfig.open}
        onClose={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        description={confirmConfig.description}
      />
    </div>
  );
}
