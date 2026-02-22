import { useState, useCallback, useMemo } from 'react';
import { DataIssue } from '@/types';

type AlertType = 'success' | 'info' | 'error' | 'warning';

interface AlertConfig {
    open: boolean;
    title: string;
    description: string;
    type?: AlertType;
}

interface ConfirmConfig {
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
}

export function useDashboardModals() {
    // Info Modals
    const [donateModalOpen, setDonateModalOpen] = useState(false);
    const [guideModalOpen, setGuideModalOpen] = useState(false);
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const [termsModalOpen, setTermsModalOpen] = useState(false);
    const [formatGuideModalOpen, setFormatGuideModalOpen] = useState(false);

    // Fix Modal
    const [fixModalOpen, setFixModalOpen] = useState(false);
    const [targetFixIssue, setTargetFixIssue] = useState<DataIssue | null>(null);
    const [replacementValue, setReplacementValue] = useState("");

    // Alert & Confirm
    const [alertConfig, setAlertConfig] = useState<AlertConfig>({
        open: false, title: "", description: "", type: 'info'
    });
    const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({
        open: false, title: "", description: "", onConfirm: () => { }
    });

    // Actions - Wrapped in useCallback for stability
    const openFixModal = useCallback((issue: DataIssue) => {
        setTargetFixIssue(issue);
        setReplacementValue("");
        setFixModalOpen(true);
    }, []);

    const closeFixModal = useCallback(() => {
        setFixModalOpen(false);
        setTargetFixIssue(null);
        setReplacementValue("");
    }, []);

    const showAlert = useCallback((title: string, description: string, type: AlertType = 'info') => {
        setAlertConfig({ open: true, title, description, type });
    }, []);

    const showConfirm = useCallback((title: string, description: string, onConfirm: () => void) => {
        setConfirmConfig({ open: true, title, description, onConfirm });
    }, []);

    const closeAlert = useCallback(() => setAlertConfig(prev => ({ ...prev, open: false })), []);
    const closeConfirm = useCallback(() => setConfirmConfig(prev => ({ ...prev, open: false })), []);

    // Memoize the return object
    return useMemo(() => ({
        // States
        donateModalOpen, setDonateModalOpen,
        guideModalOpen, setGuideModalOpen,
        helpModalOpen, setHelpModalOpen,
        termsModalOpen, setTermsModalOpen,
        formatGuideModalOpen, setFormatGuideModalOpen,
        fixModalOpen, setFixModalOpen,
        targetFixIssue, setTargetFixIssue,
        replacementValue, setReplacementValue,
        alertConfig, setAlertConfig,
        confirmConfig, setConfirmConfig,

        // Helpers
        openFixModal,
        closeFixModal,
        showAlert,
        showConfirm,
        closeAlert,
        closeConfirm
    }), [
        donateModalOpen, guideModalOpen, helpModalOpen, termsModalOpen, formatGuideModalOpen,
        fixModalOpen, targetFixIssue, replacementValue, alertConfig, confirmConfig,
        openFixModal, closeFixModal, showAlert, showConfirm, closeAlert, closeConfirm
    ]);
}
