import { useState, useEffect, useRef } from 'react';
import { Save, Trash2, Clock, Info, Shield, BarChart3, Building2, Wand2, X, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CleaningPreset, ProcessingOptions, ColumnSpecificOptions } from '@/types';
import { cn } from '@/lib/utils';

interface PresetModalProps {
    isOpen: boolean;
    onClose: () => void;
    presets: CleaningPreset[];
    onApply: (preset: CleaningPreset) => void;
    onSave: (name: string, description: string) => void;
    onDelete: (id: string) => void;
    onExport: () => void;
    onImport: (file: File) => void;
}

export function PresetModal({ isOpen, onClose, presets, onApply, onSave, onDelete, onExport, onImport }: PresetModalProps) {
    const [mode, setMode] = useState<'list' | 'save'>('list');
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImport(file);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // 배경 스크롤 방지
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!newName.trim()) return;
        onSave(newName, newDesc);
        setNewName('');
        setNewDesc('');
        setMode('list');
    };

    const getIcon = (id: string) => {
        if (id === 'sys-standard') return <Wand2 className="text-blue-500" />;
        if (id === 'sys-privacy') return <Shield className="text-emerald-500" />;
        if (id === 'sys-finance') return <BarChart3 className="text-amber-500" />;
        if (id === 'sys-business') return <Building2 className="text-indigo-500" />;
        return <Clock className="text-slate-400" />;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[var(--laundry-accent)]/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-[var(--laundry-surface)] rounded-2xl shadow-2xl border border-[var(--laundry-border)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                {/* Header */}
                <div className="p-6 bg-[var(--laundry-accent)] text-[var(--laundry-bg)] relative">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        {mode === 'list' ? '🔄 정제 프리셋 보관함' : '💾 새 프리셋 저장'}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                        {mode === 'list'
                            ? '자주 사용하는 세탁 코스를 선택하여 즉시 적용하세요.'
                            : '현재의 모든 정제 옵션과 자연어 요청을 프리셋으로 보관합니다.'}
                    </p>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 hover:bg-[var(--laundry-surface)]/10 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Toolbar: Export/Import (Visual Highlight) */}
                {mode === 'list' && (
                    <div className="bg-[var(--laundry-accent)] px-6 py-3 flex items-center justify-between shadow-inner">
                        <span className="text-xs font-black text-blue-100 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                            <Save size={12} />
                            Backup & Share
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--laundry-surface)]/20 hover:bg-[var(--laundry-surface)]/30 rounded-full text-[11px] font-bold text-[var(--laundry-bg)] transition-all border border-white/20"
                            >
                                <Upload size={14} />
                                가져오기
                            </button>
                            <button
                                onClick={onExport}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--laundry-accent)] hover:bg-blue-400 rounded-full text-[11px] font-bold text-[var(--laundry-bg)] transition-all border border-blue-400 shadow-sm"
                            >
                                <Download size={14} />
                                파일로 내보내기
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".laundry,.json"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[450px] overflow-y-auto bg-[var(--laundry-elevated)] scrollbar-thin">
                    {mode === 'list' ? (
                        <div className="space-y-6">
                            {/* 1. 사용자 전용 커스텀 코스 */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-4 h-[1px] bg-blue-200"></span>
                                    나만의 커스텀 코스
                                </h4>
                                {presets.filter(p => !p.isSystem).length === 0 ? (
                                    <div className="bg-[var(--laundry-surface)]/50 border border-dashed border-[var(--laundry-border)] rounded-xl p-6 text-center">
                                        <p className="text-xs text-slate-400">아직 저장된 커스텀 프리셋이 없습니다.</p>
                                    </div>
                                ) : (
                                    presets.filter(p => !p.isSystem).map((preset) => (
                                        <div
                                            key={preset.id}
                                            className="group bg-[var(--laundry-surface)] border-2 border-[var(--laundry-border)] rounded-xl p-4 hover:border-[var(--laundry-accent)] hover:shadow-xl transition-all cursor-pointer relative animate-in slide-in-from-bottom-2"
                                            onClick={() => {
                                                onApply(preset);
                                                onClose();
                                            }}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-[var(--laundry-accent-hover)] group-hover:text-[var(--laundry-bg)] transition-all duration-300">
                                                    {getIcon(preset.id)}
                                                </div>
                                                <div className="flex-1 min-w-0 pr-8">
                                                    <h4 className="font-black text-[var(--laundry-text)] truncate text-base">{preset.name}</h4>
                                                    <p className="text-xs text-[var(--laundry-subtle)] mt-1 line-clamp-2 leading-relaxed">
                                                        {preset.description || '이 코스에 대한 설명이 없습니다.'}
                                                    </p>
                                                    <div className="flex gap-2 mt-3">
                                                        <span className="text-[9px] bg-[var(--laundry-accent)] text-[var(--laundry-bg)] font-black px-2 py-0.5 rounded shadow-sm">CUSTOM</span>
                                                        <span className="text-[9px] bg-[var(--laundry-elevated)] text-[var(--laundry-subtle)] font-bold px-2 py-0.5 rounded border border-[var(--laundry-border)]">
                                                            {Object.values(preset.options).filter(Boolean).length}개 필터링 적용
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-red-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(preset.id);
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}

                                <button
                                    className="w-full border-dashed border-2 border-blue-200 rounded-xl py-6 bg-blue-50/30 hover:bg-[var(--laundry-accent-hover)] hover:border-blue-600 group transition-all duration-500 shadow-sm"
                                    onClick={() => setMode('save')}
                                >
                                    <div className="flex flex-col items-center gap-1.5">
                                        <Save size={24} className="text-blue-400 group-hover:text-[var(--laundry-bg)] transition-colors" />
                                        <span className="text-sm font-black text-blue-600 group-hover:text-[var(--laundry-bg)]">현재 설정을 고유 코스로 저장</span>
                                    </div>
                                </button>
                            </div>

                            {/* 2. 전문가 추천 시스템 코스 */}
                            <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-4 h-[1px] bg-[var(--laundry-border)]"></span>
                                    전문가 추천 코스
                                </h4>
                                {presets.filter(p => p.isSystem).map((preset) => (
                                    <div
                                        key={preset.id}
                                        className="group bg-[var(--laundry-surface)] border border-[var(--laundry-border)] rounded-xl p-4 hover:border-slate-800 hover:shadow-lg transition-all cursor-pointer relative"
                                        onClick={() => {
                                            onApply(preset);
                                            onClose();
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[var(--laundry-bg)] border border-[var(--laundry-border)] flex items-center justify-center shrink-0 group-hover:bg-[var(--laundry-accent)] group-hover:text-[var(--laundry-bg)] transition-colors">
                                                {getIcon(preset.id)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-[var(--laundry-muted)] truncate">{preset.name}</h4>
                                                <p className="text-[11px] text-[var(--laundry-subtle)] mt-1 line-clamp-1">
                                                    {preset.description}
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[9px] bg-[var(--laundry-elevated)] text-slate-400 font-bold px-1.5 py-0.5 rounded border border-[var(--laundry-border)] uppercase tracking-tighter">System</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 데이터 유지 안내 섹션 */}
                            <div className="mt-6 p-4 bg-[var(--laundry-elevated)]/80 rounded-xl border border-dashed border-[var(--laundry-border)] space-y-2">
                                <div className="flex items-center gap-1.5 text-[var(--laundry-subtle)] font-bold text-xs">
                                    <Info size={14} className="text-blue-500" />
                                    <span>데이터 보관 정책 안내</span>
                                </div>
                                <ul className="text-[11px] text-[var(--laundry-subtle)] space-y-1.5 leading-relaxed list-disc pl-4">
                                    <li>프리셋은 현재 사용 중인 <b>브라우저 내(LocalStorage)</b>에 안전하게 보관됩니다.</li>
                                    <li>브라우저 <b>캐시 및 사이트 데이터를 삭제</b>할 경우 프리셋도 함께 삭제될 수 있습니다.</li>
                                    <li>시크릿 모드에서 작성한 프리셋은 브라우저 <b>창을 닫는 즉시 소멸</b>됩니다.</li>
                                    <li>서버에 저장되지 않으므로, 다른 PC나 브라우저에서는 보이지 않습니다.</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[var(--laundry-muted)] font-bold text-sm">프리셋 이름</Label>
                                <Input
                                    id="name"
                                    placeholder="예: 월간 매출 보고서 정제"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="h-10"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc" className="text-[var(--laundry-muted)] font-bold text-sm">설명 (선택사항)</Label>
                                <Input
                                    id="desc"
                                    placeholder="이 코스가 무엇을 세탁하는지 적어주세요."
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex gap-2">
                                <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                                    체크박스 옵션, 자연어 요청, 컬럼별 설정이 모두 저장됩니다.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-[var(--laundry-elevated)] border-t border-[var(--laundry-border)] flex gap-2">
                    {mode === 'list' ? (
                        <button
                            onClick={onClose}
                            className="w-full h-10 rounded-lg bg-[var(--laundry-surface)] border border-[var(--laundry-border)] text-[var(--laundry-subtle)] font-bold text-sm hover:bg-[var(--laundry-bg)] transition-colors"
                        >
                            닫기
                        </button>
                    ) : (
                        <>
                            <button
                                className="flex-1 h-10 rounded-lg bg-[var(--laundry-surface)] border border-[var(--laundry-border)] text-[var(--laundry-subtle)] font-bold text-sm hover:bg-[var(--laundry-bg)] transition-colors"
                                onClick={() => setMode('list')}
                            >
                                취소
                            </button>
                            <button
                                className="flex-1 h-10 rounded-lg bg-[var(--laundry-accent)] text-[var(--laundry-bg)] font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                onClick={handleSave}
                                disabled={!newName.trim()}
                            >
                                저장하기
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
