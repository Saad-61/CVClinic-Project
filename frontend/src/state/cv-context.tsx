import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AnalyzeResponse } from "../types/cv";
import { clearStoredReport } from "../lib/storage";

type CvState = {
  file: File | null;
  filename: string;
  preview: string;
  report: AnalyzeResponse | null;
  createdAt: string | null;
  analysisRequestId: number | null;
  targetRole: string;
};

type CvActions = {
  setFile: (file: File | null) => void;
  setPreview: (preview: string, filename?: string) => void;
  setReport: (report: AnalyzeResponse, filename: string, createdAt: string) => void;
  queueAnalysis: () => boolean;
  clearPendingAnalysis: () => void;
  startOver: () => void;
  setTargetRole: (role: string) => void;
};

const CvContext = createContext<(CvState & CvActions) | null>(null);

export function CvProvider({ children }: { children: React.ReactNode }) {
  const [file, setFileState] = useState<File | null>(null);
  const [filename, setFilename] = useState("");
  const [preview, setPreviewState] = useState("");
  const [report, setReportState] = useState<AnalyzeResponse | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [analysisRequestId, setAnalysisRequestId] = useState<number | null>(null);
  const [targetRole, setTargetRoleState] = useState("");

  const setFile = useCallback((next: File | null) => {
    setFileState(next);
    setFilename(next?.name ?? "");
    setPreviewState("");
    setReportState(null);
    setCreatedAt(null);
    setAnalysisRequestId(null);
    setTargetRoleState("");
  }, []);

  const setPreview = useCallback((text: string, name?: string) => {
    if (name) setFilename(name);
    setPreviewState(text);
  }, []);

  const setReport = useCallback((nextReport: AnalyzeResponse, name: string, at: string) => {
    setReportState(nextReport);
    setFilename(name);
    setCreatedAt(at);
    setAnalysisRequestId(null);
  }, []);

  const queueAnalysis = useCallback(() => {
    if (!file) return false;
    setAnalysisRequestId(Date.now());
    return true;
  }, [file]);

  const clearPendingAnalysis = useCallback(() => {
    setAnalysisRequestId(null);
  }, []);

  const startOver = useCallback(() => {
    setFileState(null);
    setFilename("");
    setPreviewState("");
    setReportState(null);
    setCreatedAt(null);
    setAnalysisRequestId(null);
    setTargetRoleState("");
    clearStoredReport();
  }, []);

  const setTargetRole = useCallback((role: string) => {
    setTargetRoleState(role);
  }, []);

  const value = useMemo(
    () => ({
      file,
      filename,
      preview,
      report,
      createdAt,
      analysisRequestId,
      targetRole,
      setFile,
      setPreview,
      setReport,
      queueAnalysis,
      clearPendingAnalysis,
      startOver,
      setTargetRole,
    }),
    [
      file,
      filename,
      preview,
      report,
      createdAt,
      analysisRequestId,
      targetRole,
      setFile,
      setPreview,
      setReport,
      queueAnalysis,
      clearPendingAnalysis,
      startOver,
      setTargetRole,
    ],
  );

  return <CvContext.Provider value={value}>{children}</CvContext.Provider>;
}

export function useCv() {
  const ctx = useContext(CvContext);
  if (!ctx) throw new Error("useCv must be used within CvProvider");
  return ctx;
}
