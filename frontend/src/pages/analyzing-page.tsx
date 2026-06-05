import { Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeCv } from "../api/cv";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { saveStoredReport } from "../lib/storage";
import { useCv } from "../state/cv-context";

const LOADING_TIPS_DEFAULT = [
  "Extracting layout and text sections from your CV...",
  "Searching and retrieving matching from live job listings...",
  "Scoring skill alignment and calculating match scores...",
  "Generating missing skill project ideas and action items..."
];

const LOADING_TIPS_JD = [
  "Extracting layout and text sections from your CV...",
  "Embedding your CV and the job description for comparison...",
  "Computing match score against your target role...",
  "Generating role-specific skill gaps and action items..."
];

export default function AnalyzingPage() {
  const navigate = useNavigate();
  const { analysisRequestId, clearPendingAnalysis, file, filename, setReport, targetRole, jobDescription, jobTitle, analysisMode } =
    useCv();
  const controllerRef = useRef<AbortController | null>(null);
  const startedRequestRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const LOADING_TIPS = analysisMode === "specific-role" ? LOADING_TIPS_JD : LOADING_TIPS_DEFAULT;

  // Rotate loading tips every 3 seconds - separated to prevent double-render clear bugs
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 4000);
    return () => clearInterval(tipTimer);
  }, []);

  useEffect(() => {
    if (!file || !analysisRequestId) {
      navigate("/", { replace: true });
      return;
    }

    if (startedRequestRef.current === analysisRequestId) return;
    startedRequestRef.current = analysisRequestId;

    const controller = new AbortController();
    controllerRef.current = controller;
    setError(null);

    const createdAt = new Date().toISOString();

    analyzeCv(file, targetRole, controller.signal, jobDescription || undefined, jobTitle || undefined)
      .then((report) => {
        setReport(report, filename || file.name, createdAt);
        saveStoredReport({ filename: filename || file.name, createdAt, report });
        navigate("/results", { replace: true });
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        clearPendingAnalysis();
        setError((e as Error).message || "Failed to analyze CV.");
      });

    return () => {
      // Only abort if this isn't the active request (navigating away mid-analysis)
      if (startedRequestRef.current === analysisRequestId) {
        // Don't abort — let the request finish in background
      } else {
        controller.abort();
      }
    };
  }, [analysisRequestId, clearPendingAnalysis, file, filename, navigate, setReport, targetRole, jobDescription, jobTitle]);

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Analyzing your CV</CardTitle>
              <CardDescription className="mt-1">
                <span className="text-slate-500 font-medium text-xs truncate max-w-[240px] block">
                  File: {filename || file?.name}
                </span>
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                controllerRef.current?.abort();
                clearPendingAnalysis();
                navigate("/", { replace: true });
              }}
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pb-6">
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm">
              <p className="text-rose-800">{error}</p>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => navigate("/", { replace: true })}
                >
                  Back to upload
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <div className="space-y-1.5 max-w-xs">
                <p className="text-sm font-semibold text-slate-800 transition-all duration-300 min-h-[40px] flex items-center justify-center">
                  {LOADING_TIPS[tipIndex]}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
