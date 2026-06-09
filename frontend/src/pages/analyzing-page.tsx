import { Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeCv } from "../api/cv";
import { Button } from "../components/ui/button";
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
    <div className="mx-auto max-w-lg py-10">
      {/* Premium glowing card wrapper */}
      <div className="relative rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-8 shadow-2xl overflow-hidden">
        {/* Decorative background glow behind the card content */}
        <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-[#9e59d9]/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-[#B6ABFF]/05 blur-2xl pointer-events-none" />

        <div className="relative space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="section-label">System Active</div>
              <h2 className="font-outfit text-2xl font-black text-white">Analyzing your CV</h2>
              <div className="text-xs text-slate-400 font-medium truncate max-w-[220px]">
                File: {filename || file?.name}
              </div>
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
              className="border-zinc-800 text-slate-400 hover:text-white hover:border-[#9e59d9]"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          </div>

          <div className="h-px bg-border/60" />

          {error ? (
            <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-5 text-sm space-y-4">
              <p className="text-rose-200 leading-relaxed font-medium">{error}</p>
              <Button
                type="button"
                variant="default"
                onClick={() => navigate("/", { replace: true })}
                className="w-full bg-[#9e59d9] hover:bg-[#8346b9] text-white"
              >
                Back to upload
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-8">
              {/* Spinner wrapper with pulse animation and gradient ring */}
              <div className="relative flex items-center justify-center">
                <div className="absolute h-20 w-20 rounded-full border border-[#9e59d9]/25 animate-ping duration-1000" />
                <div className="absolute h-16 w-16 rounded-full bg-gradient-to-tr from-[#9e59d9]/20 to-[#B6ABFF]/10 blur" />
                <Loader2 className="h-12 w-12 animate-spin text-[#af6eeb] relative z-10" />
              </div>

              {/* Progress tip card */}
              <div className="w-full max-w-sm rounded-xl bg-zinc-900/40 border border-border/50 px-5 py-4 min-h-[80px] flex items-center justify-center">
                <p className="text-sm font-semibold text-zinc-200 transition-all duration-300 leading-relaxed">
                  {LOADING_TIPS[tipIndex]}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
