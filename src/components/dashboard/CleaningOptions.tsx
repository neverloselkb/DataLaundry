import { useState, useEffect, useMemo } from 'react';
import { Sparkles, Search, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ProcessingOptions, ColumnSpecificOptions } from '@/types';
import { ProcessingStatus } from './ProcessingStatus';
import { PresetModal } from './PresetModal';
import { usePresets } from '@/hooks/usePresets';
import { CLEANING_OPTIONS_SCHEMA, TIPS, OptionCategory } from '@/lib/constants';
import { CleaningPreset } from '@/types';

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
    detectedDateColumns?: number;
    columnOptions?: ColumnSpecificOptions;
    onApplyPreset: (preset: CleaningPreset) => void;
}

/**
 * 정제 옵션 및 요청 섹션 컴포넌트
 * 설정 기반(Configuration-Driven)으로 UI를 동적 생성하며, 탭과 검색 기능을 제공합니다.
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
    fileLoaded,
    detectedDateColumns = 0,
    columnOptions = {},
    onApplyPreset
}: CleaningOptionsProps) {
    const { presets, savePreset, deletePreset, exportPresets, importPresets } = usePresets();
    const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
    const [tipIndex, setTipIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<OptionCategory>('basic');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % TIPS.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    // 검색어에 따라 필터링된 옵션 목록 생성
    const filteredSchema = useMemo(() => {
        if (!searchQuery.trim()) return CLEANING_OPTIONS_SCHEMA;

        const query = searchQuery.toLowerCase();
        return CLEANING_OPTIONS_SCHEMA.map(category => ({
            ...category,
            items: category.items.filter(item =>
                item.label.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query)
            )
        })).filter(category => category.items.length > 0);
    }, [searchQuery]);

    const handleQuickAction = (type: 'all' | 'none') => {
        const newOptions = { ...options };

        // 검색 중이면 보이는 것만, 아니면 현재 탭만, 혹은 전체?
        // 사용자 혼란 방지를 위해 '전체'는 정말 모든 옵션을 대상으로 함
        // 단, 탭별로 하려면 로직 수정 필요. 현재는 전체 대상으로 구현
        CLEANING_OPTIONS_SCHEMA.flatMap(c => c.items).forEach(item => {
            newOptions[item.id] = type === 'all';
        });

        setOptions(newOptions);
    };

    // 옵션 변경 핸들러
    const toggleOption = (id: keyof ProcessingOptions, checked: boolean) => {
        setOptions(prev => ({ ...prev, [id]: checked }));
    };


    // 현재 보여줄 카테고리 (검색 중일 때는 탭 무시하고 펼쳐 보임)
    const displayCategories = searchQuery.trim()
        ? filteredSchema
        : filteredSchema.filter(c => c.id === activeTab);

    return (
        <div className={cn("card-industrial transition-opacity flex flex-col", !fileLoaded && "opacity-50 pointer-events-none")}>
            <div className="px-5 py-3 border-b border-[var(--laundry-border)]">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-[var(--laundry-accent)] text-[var(--laundry-bg)] rounded flex items-center justify-center text-[10px] font-bold">2</span>
                            <span className="section-label">정제 요청</span>
                        </div>
                        <p className="text-xs text-[var(--laundry-muted)] mt-1">
                            어떻게 데이터를 정리할까요?
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-[var(--laundry-accent)] hover:text-[var(--laundry-accent-hover)] hover:bg-[var(--laundry-accent-glow)] border border-[var(--laundry-border)] px-3 rounded font-bold"
                        onClick={() => setIsPresetModalOpen(true)}
                    >
                        <Zap size={14} className="fill-[var(--laundry-accent)]" />
                        프리셋
                    </Button>
                </div>

            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                {/* Search & Quick Actions */}
                <div className="flex flex-col gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-[var(--laundry-subtle)]" />
                        <Input
                            placeholder="옵션 검색 (예: 전화번호, 공백)"
                            className="pl-8 h-9 text-sm bg-[var(--laundry-bg)] border-[var(--laundry-border)] text-[var(--laundry-text)] placeholder:text-[var(--laundry-subtle)]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button className="text-xs text-[var(--laundry-muted)] hover:text-[var(--laundry-accent)] hover:underline" onClick={() => handleQuickAction('none')}>전체 선택 해제</button>
                    </div>
                </div>

                {/* Categories Tabs (검색 중이 아닐 때만 표시) */}
                {!searchQuery.trim() && (
                    <div className="flex gap-1 overflow-x-auto pb-2 border-b border-[var(--laundry-border)] no-scrollbar">
                        {CLEANING_OPTIONS_SCHEMA.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setActiveTab(category.id)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap transition-colors",
                                    activeTab === category.id
                                        ? "bg-[var(--laundry-accent)] text-[var(--laundry-bg)] glow-amber font-bold"
                                        : "bg-[var(--laundry-elevated)] text-[var(--laundry-muted)] hover:text-[var(--laundry-text)]"
                                )}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Options List */}
                <div className="space-y-6">
                    {displayCategories.length > 0 ? (
                        displayCategories.map(category => (
                            <div key={category.id} className="space-y-3 animation-fade-in">
                                {searchQuery.trim() && (
                                    <h4 className="text-xs font-bold text-[var(--laundry-accent)] uppercase tracking-wider">{category.label}</h4>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                    {category.items.map(item => {
                                        // 날짜/일시 전역 옵션 비활성화 로직
                                        const isDateOption = item.id === 'formatDate' || item.id === 'formatDateTime';
                                        const isDisabled = isDateOption && detectedDateColumns >= 2;

                                        // 하이라이트 옵션 안내 로직
                                        const isHighlightOption = item.id === 'highlightChanges';

                                        return (
                                            <div
                                                key={item.id}
                                                className={cn(
                                                    "flex items-start space-x-3 p-2 rounded transition-all",
                                                    options[item.id] ? "bg-[var(--laundry-accent-glow)] ring-1 ring-[var(--laundry-accent)]/30" : "hover:bg-[var(--laundry-elevated)]",
                                                    isDisabled && "opacity-50 pointer-events-none bg-[var(--laundry-bg)]"
                                                )}
                                            >
                                                <Checkbox
                                                    id={item.id}
                                                    checked={options[item.id]}
                                                    onCheckedChange={(c) => toggleOption(item.id, c as boolean)}
                                                    className={cn(
                                                        "mt-1",
                                                        options[item.id] ? "border-[var(--laundry-accent)] bg-[var(--laundry-accent)] focus-visible:ring-[var(--laundry-accent)] text-[var(--laundry-bg)]" : "border-[var(--laundry-border)]"
                                                    )}
                                                    disabled={isDisabled}
                                                />
                                                <div className="space-y-1 w-full">
                                                    <div className="flex items-center gap-2">
                                                        <label
                                                            htmlFor={item.id}
                                                            className="text-sm font-medium leading-none cursor-pointer block text-[var(--laundry-text)]"
                                                        >
                                                            {item.label}
                                                        </label>
                                                        {isDisabled && (
                                                            <div className="group relative">
                                                                <span className="text-[10px] bg-[var(--laundry-danger)]/20 text-[var(--laundry-danger)] px-1.5 py-0.5 rounded cursor-help font-bold">⚠️ 다중 감지됨</span>
                                                                <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-[var(--laundry-elevated)] text-[var(--laundry-text)] text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-[var(--laundry-border)]">
                                                                    여러 날짜 컬럼이 감지되었습니다. 상단 테이블 헤더의 ⚙️ 설정 메뉴에서 컬럼별로 형식을 지정해주세요.
                                                                </div>
                                                            </div>
                                                        )}
                                                        {isHighlightOption && (
                                                            <span className="text-[9px] bg-[var(--laundry-info)]/15 text-[var(--laundry-info)] px-1.5 py-0.5 rounded font-bold border border-[var(--laundry-info)]/20 uppercase tracking-tighter">Excel Only</span>
                                                        )}
                                                    </div>
                                                    {item.description && (
                                                        <p className="text-xs text-[var(--laundry-subtle)] leading-snug">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                    {isHighlightOption && options.highlightChanges && (
                                                        <div className="mt-1.5 p-1.5 bg-[var(--laundry-accent)]/10 rounded border border-[var(--laundry-accent)]/20 flex items-center gap-1.5 animate-in slide-in-from-top-1 fadeIn duration-200 w-fit -ml-8 mx-auto px-3 glow-amber">
                                                            <CheckCircle2 size={10} className="text-[var(--laundry-accent)] shrink-0" />
                                                            <span className="text-[10px] text-[var(--laundry-accent)] font-bold whitespace-nowrap">결과 파일이 엑셀 파일로 변경 되며 변경된 셀에 배경색이 칠해집니다.</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-[var(--laundry-subtle)] text-sm">
                            검색 결과가 없습니다.
                        </div>
                    )}
                </div>

                {/* Prompt Input (NLP Smart) */}
                <div className="space-y-2 pt-4 border-t border-[var(--laundry-border)]">
                    <Label htmlFor="prompt" className="flex items-center gap-2 text-[var(--laundry-accent)]">
                        <Zap size={14} className="text-[var(--laundry-accent)]" />
                        자연어 추가 요청
                    </Label>
                    <Textarea
                        id="prompt"
                        placeholder="예: 주소에서 시/도만 추출, 특수문자 제거, 숫자만 남겨줘, 한글만 남겨줘"
                        className="min-h-[80px] resize-none text-sm bg-[var(--laundry-bg)] border-[var(--laundry-border)] text-[var(--laundry-text)] placeholder:text-[var(--laundry-subtle)] focus-visible:ring-[var(--laundry-accent)]"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <p className="text-[10px] text-[var(--laundry-subtle)] text-right">
                        * 로컬 정용 정제 엔진이 패턴을 분석하여 처리합니다.
                    </p>
                </div>

                {/* Tips Carousel */}
                <div className="text-xs text-[var(--laundry-muted)] bg-[var(--laundry-bg)] p-3 rounded overflow-hidden relative h-[40px] flex items-center border border-[var(--laundry-border)]">
                    <span className="font-medium mr-2 shrink-0 text-[var(--laundry-accent)]">💡 Tip:</span>
                    <div className="relative flex-1 h-full">
                        {TIPS.map((tip, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "absolute left-0 top-1/2 -translate-y-1/2 w-full transition-all duration-500 ease-in-out truncate",
                                    tipIndex === idx ? "opacity-100 translate-y-[-50%]" : "opacity-0 translate-y-0 pointer-events-none"
                                )}
                            >
                                {tip}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <PresetModal
                isOpen={isPresetModalOpen}
                onClose={() => setIsPresetModalOpen(false)}
                presets={presets}
                onApply={onApplyPreset}
                onSave={(name, desc) => savePreset(name, desc, options, prompt, columnOptions)}
                onDelete={deletePreset}
                onExport={exportPresets}
                onImport={importPresets}
            />
            <div className="px-5 py-3 border-t border-[var(--laundry-border)] flex flex-col gap-2">
                {isProcessing ? (
                    <ProcessingStatus progress={progress} message={progressMessage} />
                ) : (
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <Button
                            className="flex-1 w-full bg-[var(--laundry-accent)] hover:bg-[var(--laundry-accent-hover)] text-[var(--laundry-bg)] gap-2 h-11 text-base font-bold transition-all order-1 sm:order-3 glow-amber"
                            onClick={onProcess}
                            disabled={!prompt && !Object.values(options).some(Boolean) && !Object.values(columnOptions).some(Boolean)}
                        >
                            <Sparkles size={18} />
                            데이터 정제 실행
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
