"use client";

import { useState, useCallback, useEffect } from 'react';
import { DataIssue, DataRow, ColumnOptionType, CleaningPreset } from '@/types';
import { useDataFlow } from '@/hooks/useDataFlow';
import { useCleaningOptions } from '@/hooks/useCleaningOptions';
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
import { DonateModal, GuideModal, HelpModal, TermsModal, FixModal, FormatGuideModal } from '@/components/dashboard/Modals';
import { LoadingOverlay } from '@/components/processing/LoadingOverlay';

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
    initialStats
  } = useDataFlow();

  const { options, setOptions, prompt, setPrompt } = useCleaningOptions();

  // 2. UI State (Modals & Filters)
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [filterIssue, setFilterIssue] = useState<DataIssue | null>(null);

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
      alert("프롬프트에 제안 내용이 추가되었습니다. '데이터 정제하기' 버튼을 눌러 적용해 보세요.");
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

        alert(`'${issue.column}' 컬럼에 해당 정제 설정이 적용되었습니다. ✨`);
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

    alert(`'${preset.name}' 프리셋이 성공적으로 적용되었습니다. ✨`);
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

      <main className="container mx-auto px-4 py-8 max-w-7xl">
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

            <CleaningOptions
              options={options}
              setOptions={setOptions}
              prompt={prompt}
              setPrompt={setPrompt}
              isProcessing={isProcessing}
              progress={progress}
              progressMessage={progressMessage}
              onProcess={handleProcess}
              onReset={resetData}
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

          {/* Right Panel: Data Preview */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
              데이터 미리보기
              {file && (
                <>
                  <span className="text-sm font-normal text-slate-500 ml-2">({file.name})</span>
                  <span className="ml-auto text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1.5 animate-fade-in shadow-sm">
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
            />

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

        {/* AdSense Test Area */}
        <div className="mt-8">
          <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px] text-slate-400">
            <span className="text-xs font-bold uppercase tracking-widest mb-2">Advertisement (Test Mode)</span>
            {/* AdSense code would go here */}
            <p className="text-[10px] mt-2 italic text-slate-400">
              * 'data-adtest="on"' 속성이 적용된 테스트용 광고 영역입니다.
            </p>
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
        isVisible={isProcessing}
        progress={progress}
        message={progressMessage}
      />
    </div>
  );
}
