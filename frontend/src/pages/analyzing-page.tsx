import { XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeCv } from "../api/cv";
import { Button } from "../components/ui/button";
import { saveStoredReport } from "../lib/storage";
import { useCv } from "../state/cv-context";
import BlurText from "../components/animations/BlurText";
import { AnimatePresence, motion } from "framer-motion";
import { redactPiiText } from "../lib/utils";

const LOADING_TIPS_DEFAULT = [
  "Extracting layout and text sections from your CV...",
  "Searching and retrieving matches from live job listings...",
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
  const {
    analysisRequestId,
    clearPendingAnalysis,
    file,
    filename,
    setReport,
    targetRole,
    jobDescription,
    jobTitle,
    analysisMode,
    preview,
    redactPii
  } = useCv();
  const controllerRef = useRef<AbortController | null>(null);
  const startedRequestRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const LOADING_TIPS = analysisMode === "specific-role" ? LOADING_TIPS_JD : LOADING_TIPS_DEFAULT;

  // Rotate loading tips every 4 seconds
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 4000);
    return () => clearInterval(tipTimer);
  }, [LOADING_TIPS]);

  // Increment progress bar continuously to simulate loading activity
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        if (prev >= 99) return 99;
        if (prev >= 95) {
          return prev + 1;
        }
        const step = prev > 70 ? Math.random() * 0.8 + 0.1 : Math.random() * 2 + 0.5;
        const nextVal = prev + step;
        if (nextVal >= 95) return 95;
        return nextVal;
      });
    }, 400);
    return () => clearInterval(progressTimer);
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
    const cvPayloadText = redactPii ? redactPiiText(preview) : undefined;

    analyzeCv(file, targetRole, controller.signal, jobDescription || undefined, jobTitle || undefined, cvPayloadText)
      .then((report) => {
        setProgress(100);
        setTimeout(() => {
          setReport(report, filename || file.name, createdAt);
          saveStoredReport({ filename: filename || file.name, createdAt, report });
          navigate("/results", { replace: true });
        }, 600);
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        clearPendingAnalysis();
        setError((e as Error).message || "Failed to analyze CV.");
      });

    return () => {
      if (startedRequestRef.current === analysisRequestId) {
        // Let background request finish
      } else {
        controller.abort();
      }
    };
  }, [analysisRequestId, clearPendingAnalysis, file, filename, navigate, setReport, targetRole, jobDescription, jobTitle, redactPii, preview]);

  return (
    <div className="relative min-h-[calc(100vh-10rem)] w-full flex items-center justify-center py-6">
      
      {/* Loading Card Overlay */}
      <div className="relative z-10 w-full max-w-lg bg-card/85 border border-border/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="space-y-8">
          
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="font-outfit text-2xl font-black text-white">
                <BlurText text="Analyzing your CV" delay={0.1} />
              </h2>
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
              className="border-zinc-850 text-slate-400 hover:text-white hover:border-primary/50 transition-colors"
            >
              <XCircle className="h-4 w-4 mr-1.5 shrink-0" />
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
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold"
              >
                Back to upload
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 px-2 text-center space-y-8">
              
              {/* Custom Document Scanner Graphic */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-24 h-32 border border-primary/20 rounded-xl bg-zinc-950/60 flex flex-col gap-2.5 p-3.5 overflow-hidden shadow-[0_0_20px_rgba(214,169,67,0.05)] select-none">
                  {/* Scanner laser bar */}
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_rgba(214,169,67,0.8)]"
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  />
                  {/* CV layout lines */}
                  <div className="w-1/3 h-2.5 bg-primary/25 rounded-md" />
                  <div className="w-full h-1.5 bg-zinc-800/80 rounded" />
                  <div className="w-5/6 h-1.5 bg-zinc-800/80 rounded" />
                  <div className="w-11/12 h-1.5 bg-zinc-800/80 rounded" />
                  <div className="w-3/4 h-1.5 bg-zinc-800/80 rounded" />
                  <div className="w-1/2 h-1.5 bg-zinc-850 rounded" />
                  <div className="w-5/6 h-1.5 bg-zinc-800/80 rounded" />
                  <div className="w-full h-1.5 bg-zinc-800/80 rounded" />
                </div>
              </div>

              {/* Dynamic Fluid Progress Bar */}
              <div className="w-full space-y-2.5">
                <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>Progress</span>
                  <span className="tabular-nums font-bold text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-950/70 border border-zinc-850">
                  <motion.div
                    className="relative h-full bg-primary rounded-full overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.25)_50%,transparent_100%)] animate-progress-shimmer" />
                  </motion.div>
                </div>
              </div>

              {/* Progress tip card with Framer Motion transitions */}
              <div className="w-full rounded-xl bg-zinc-950/40 border border-border/50 px-5 py-4 min-h-[90px] flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={tipIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="text-sm font-semibold text-zinc-200 leading-relaxed"
                  >
                    {LOADING_TIPS[tipIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
              
            </div>
          )}
          
        </div>
      </div>

    </div>
  );
}
