import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AnalyzeResponse } from "../types/cv";
import { clearStoredReport } from "../lib/storage";

export type AnalysisMode = "best-matches" | "specific-role";

type CvState = {
  file: File | null;
  filename: string;
  preview: string;
  report: AnalyzeResponse | null;
  createdAt: string | null;
  analysisRequestId: number | null;
  targetRole: string;
  analysisMode: AnalysisMode;
  jobDescription: string;
  jobTitle: string;
};

type CvActions = {
  setFile: (file: File | null) => void;
  setPreview: (preview: string, filename?: string) => void;
  setReport: (report: AnalyzeResponse, filename: string, createdAt: string) => void;
  queueAnalysis: () => boolean;
  clearPendingAnalysis: () => void;
  startOver: () => void;
  setTargetRole: (role: string) => void;
  setAnalysisMode: (mode: AnalysisMode) => void;
  setJobDescription: (jd: string) => void;
  setJobTitle: (title: string) => void;
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
  const [analysisMode, setAnalysisModeState] = useState<AnalysisMode>("best-matches");
  const [jobDescription, setJobDescriptionState] = useState("");
  const [jobTitle, setJobTitleState] = useState("");

  const setFile = useCallback((next: File | null) => {
    setFileState(next);
    setFilename(next?.name ?? "");
    setPreviewState("");
    setReportState(null);
    setCreatedAt(null);
    setAnalysisRequestId(null);
    // Don't reset mode/JD fields when a file changes — user may want to re-upload
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
    setAnalysisModeState("best-matches");
    setJobDescriptionState("");
    setJobTitleState("");
    clearStoredReport();
  }, []);

  const setTargetRole = useCallback((role: string) => {
    setTargetRoleState(role);
  }, []);

  const setAnalysisMode = useCallback((mode: AnalysisMode) => {
    setAnalysisModeState(mode);
  }, []);

  const setJobDescription = useCallback((jd: string) => {
    setJobDescriptionState(jd);
  }, []);

  const setJobTitle = useCallback((title: string) => {
    setJobTitleState(title);
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
      analysisMode,
      jobDescription,
      jobTitle,
      setFile,
      setPreview,
      setReport,
      queueAnalysis,
      clearPendingAnalysis,
      startOver,
      setTargetRole,
      setAnalysisMode,
      setJobDescription,
      setJobTitle,
    }),
    [
      file,
      filename,
      preview,
      report,
      createdAt,
      analysisRequestId,
      targetRole,
      analysisMode,
      jobDescription,
      jobTitle,
      setFile,
      setPreview,
      setReport,
      queueAnalysis,
      clearPendingAnalysis,
      startOver,
      setTargetRole,
      setAnalysisMode,
      setJobDescription,
      setJobTitle,
    ],
  );

  return <CvContext.Provider value={value}>{children}</CvContext.Provider>;
}

export function useCv() {
  const ctx = useContext(CvContext);
  if (!ctx) throw new Error("useCv must be used within CvProvider");
  return ctx;
}
