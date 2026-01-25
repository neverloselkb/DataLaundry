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
import { checkNLPTargetAmbiguity } from '@/lib/core/processors'; // [NEW]

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

  // [New] 정제 완료 시 미리보기 섹션으로 자동 스크롤
  useEffect(() => {
    // isProcessing이 true였다가 false로 바뀌는 순간을 감지
    // (완료 메시지 팝업 등이 뜰 시간이나 렌더링 시간을 고려해 아주 짧은 지연시간 추가 가능)
    if (!isProcessing && processedData.length > 0) {
      const timer = setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300); // 렌더링 완료 후 부드럽게 이동
      return () => clearTimeout(timer);
    }
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

      {/* Top Wide Ad - AD-1 (전체 높이 94px 고정으로 출렁임 제거) */}
      <div className="container mx-auto px-2 sm:px-4 mt-4 max-w-7xl flex-shrink-0">
        <div
          className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm overflow-hidden flex flex-col items-center w-full flex-shrink-0"
          style={{ height: '94px', overflow: 'hidden' }}
        >
          <span className="text-[8px] text-blue-600 font-black mb-1.5 uppercase tracking-[0.2em] flex items-center gap-1">
            <span className="bg-blue-600 text-white px-1 rounded-sm">AD-1</span> Sponsored
          </span>
          <AdBanner slot="5555555555" format="horizontal" isTest={true} className="w-full" />
        </div>
      </div>

      <main className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Panel: Upload & Controls */}
          <div className="space-y-6 lg:col-span-1">
            <UploadSection
              file={file}
              isDragging={false} // Drag state handling logic moved to simpler version or can add state
              error={error}
              onDragOver={handleDragOver}
              onDragLeave={() => { }}
              onDrop={handleDrop}
              onFileSelect={onFileSelect}
            />

            {/* Ad Slot - AD-2 (전체 높이 102px 고정) */}
            <div
              className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm overflow-hidden animate-fade-in flex-shrink-0"
              style={{ height: '102px', overflow: 'hidden' }}
            >
              <span className="text-[9px] text-blue-600 font-black block mb-1 uppercase tracking-tighter flex items-center gap-1">
                <span className="bg-blue-600 text-white px-1 rounded-sm">AD-2</span> 데이터 세탁 후원 광고
              </span>
              <AdBanner slot="3333333333" format="horizontal" isTest={true} className="w-full" />
            </div>

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

            {file && (
              <>
                <ResultSummary
                  stats={stats}
                  initialStats={initialStats}
                  issues={issues}
                  processedData={processedData}
                  setIssues={setIssues}
                />

                <DownloadSection
                  handleDownload={handleDownload}
                  rowCount={processedData.length}
                />
              </>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4" ref={previewRef}>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 flex-wrap">
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

            {/* Ad Slot - AD-3 (전체 높이 110px 고정) */}
            <div
              className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm overflow-hidden animate-fade-in flex-shrink-0"
              style={{ height: '110px', overflow: 'hidden' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-blue-600 font-black uppercase tracking-widest flex items-center gap-1">
                  <span className="bg-blue-600 text-white px-1 rounded-sm text-[7px]">AD-3</span> Recommended Tool
                </span>
                <span className="text-[8px] text-slate-300">AD</span>
              </div>
              <AdBanner slot="4444443333" format="horizontal" isTest={true} className="w-full" />
            </div>

            {file && (
              <div className="mt-8 animation-fade-in">
                {/* Detailed Analysis Report */}
                <AnalysisReport
                  issues={issues}
                  showAllIssues={showAllIssues}
                  setShowAllIssues={setShowAllIssues}
                  filterIssue={filterIssue}
                  setFilterIssue={setFilterIssue}
                  onApplySuggestion={handleApplySuggestion}
                  onOpenFixModal={handleOpenFixModal}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Banner Ad - AD-4 (전체 높이 96px 고정) */}
        <div className="mt-8 mb-6 max-w-7xl mx-auto px-4 flex-shrink-0">
          <div
            className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm overflow-hidden flex flex-col items-center flex-shrink-0"
            style={{ height: '96px', overflow: 'hidden' }}
          >
            <span className="text-[8px] text-blue-600 font-black mb-2 uppercase tracking-widest flex items-center gap-1">
              <span className="bg-blue-600 text-white px-1 rounded-sm">AD-4</span> RECOMMENDED
            </span>
            <AdBanner slot="1111111111" format="horizontal" isTest={true} className="w-full" />
          </div>
        </div>
      </main>

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
      {/* Alert & Confirm Modals [NEW] */}
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
