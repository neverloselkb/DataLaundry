"use client";

import { useState, useCallback } from 'react';
import { DataIssue, DataRow } from '@/types';
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
    updateColumnOption
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

  // Issue Suggestion Application (Single Issue)
  const handleApplySuggestion = useCallback((issue: DataIssue) => {
    if (!issue.suggestion && !issue.promptSuggestion) return;

    // Apply suggestion via reprocessing
    if (issue.promptSuggestion) {
      // Append to prompt and re-process
      setPrompt(prev => prev ? `${prev}, ${issue.promptSuggestion}` : issue.promptSuggestion!);
      alert("프롬프트에 제안 내용이 추가되었습니다. '데이터 정제하기' 버튼을 눌러 적용해 보세요.");
    } else if (issue.suggestion) {
      // Create temp options for this specific fix if needed, or just warn user
      // Current design: Suggestion maps to options. 
      // If we want to auto-apply, we might need to update options and run process.
      const newOptions = { ...options, ...issue.suggestion };
      setOptions(newOptions);
      startProcessing(prompt, newOptions);
    }
  }, [options, prompt, setOptions, setPrompt, startProcessing]);

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
            />

            {file && (
              <>
                <ResultSummary
                  stats={stats}
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
              {file && <span className="text-sm font-normal text-slate-500 ml-2">({file.name})</span>}
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
    </div>
  );
}
