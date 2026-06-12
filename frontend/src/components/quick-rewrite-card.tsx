import { Braces, FilePenLine, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateFixRewrite } from "../api/cv";
import type {
  GenerateFixRewriteResponse,
  QuickRewriteCandidate,
} from "../types/cv";
import { CopyButton } from "./copy-button";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { diffWords } from "../lib/diff";

type RewriteState = {
  plain?: GenerateFixRewriteResponse;
  latex?: GenerateFixRewriteResponse;
};

function extractSectionBlock(cvText: string, section: string, maxLines = 20) {
  const lines = cvText.split(/\r?\n/);
  const terms = section.split("->").map(t => t.trim().toLowerCase()).filter(Boolean);
  if (terms.length === 0) return cvText.trim().slice(0, 800);

  const targetTerm = terms[terms.length - 1];
  let startIndex = -1;

  // 1. Look for a line containing/matching targetTerm with bullet or start check
  for (let idx = 0; idx < lines.length; idx++) {
    const lineClean = lines[idx].trim().toLowerCase();
    if (!lineClean) continue;
    if (
      lineClean === targetTerm ||
      lineClean.startsWith(`${targetTerm} `) ||
      lineClean.startsWith(`${targetTerm}:`) ||
      (lineClean.includes(targetTerm) && (lineClean.includes("•") || lineClean.includes("-") || lineClean.includes("*")))
    ) {
      startIndex = idx;
      break;
    }
  }

  // 2. Look for any line containing targetTerm
  if (startIndex === -1) {
    for (let idx = 0; idx < lines.length; idx++) {
      const lineClean = lines[idx].trim().toLowerCase();
      if (lineClean.includes(targetTerm)) {
        startIndex = idx;
        break;
      }
    }
  }

  // 3. Fall back to parent term if multiple parts
  if (startIndex === -1 && terms.length > 1) {
    const parentTerm = terms[0];
    for (let idx = 0; idx < lines.length; idx++) {
      const lineClean = lines[idx].trim().toLowerCase();
      if (
        lineClean === parentTerm ||
        lineClean.startsWith(`${parentTerm} `) ||
        lineClean.startsWith(`${parentTerm}:`)
      ) {
        startIndex = idx;
        break;
      }
    }
  }

  if (startIndex === -1) {
    return cvText.trim().slice(0, 800);
  }

  const block: string[] = [];
  const startIsBullet = /^[•\-*]/.test(lines[startIndex].trim());

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (block.length > 0) {
      if (startIsBullet && /^[•\-*]/.test(trimmed)) {
        break;
      }
      if (trimmed && trimmed === trimmed.toUpperCase() && trimmed.length <= 80) {
        break;
      }
      if (trimmed.endsWith(":") && trimmed.length <= 40) {
        break;
      }
    }
    block.push(line);
    if (block.length >= maxLines) break;
  }

  return block.join("\n").trim();
}

function renderDiffBefore(diffs: any[]) {
  return diffs.map((change, idx) => {
    if (change.added) return null;
    if (change.removed) {
      return (
        <span
          key={`before-${idx}`}
          className="bg-rose-950/40 text-rose-355 line-through px-0.5 rounded font-medium border-b border-rose-800/30"
        >
          {change.value}
        </span>
      );
    }
    return <span key={`before-${idx}`}>{change.value}</span>;
  });
}

function renderDiffAfter(diffs: any[]) {
  return diffs.map((change, idx) => {
    if (change.removed) return null;
    if (change.added) {
      return (
        <span
          key={`after-${idx}`}
          className="bg-emerald-950/45 text-emerald-300 font-medium px-0.5 rounded border-b border-emerald-800/30"
        >
          {change.value}
        </span>
      );
    }
    return <span key={`after-${idx}`}>{change.value}</span>;
  });
}

export function QuickRewriteCard({
  candidate,
  cvText,
}: {
  candidate: QuickRewriteCandidate;
  cvText: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState<"plain" | "latex">("plain");
  const [results, setResults] = useState<RewriteState>({});
  const [loadingFormat, setLoadingFormat] = useState<"plain" | "latex" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const current = useMemo(() => results[activeFormat], [activeFormat, results]);
  const sourceSection = useMemo(() => {
    let rawBlock = extractSectionBlock(cvText, candidate.section);
    const lines = rawBlock.split(/\r?\n/);
    if (lines.length > 1) {
      const firstLine = lines[0].trim();
      const firstLineLower = firstLine.toLowerCase();
      const sectionLower = candidate.section.toLowerCase();
      const parentSectionLower = candidate.section.split("->")[0].trim().toLowerCase();

      if (
        firstLineLower === sectionLower ||
        firstLineLower === parentSectionLower ||
        (firstLine === firstLine.toUpperCase() && firstLine.length <= 40)
      ) {
        const rewriteText = results[activeFormat]?.rewritten_text || "";
        if (rewriteText && !rewriteText.toLowerCase().includes(firstLineLower)) {
          rawBlock = lines.slice(1).join("\n").trim();
        }
      }
    }
    return rawBlock;
  }, [candidate.section, cvText, results, activeFormat]);

  const diffs = useMemo(() => {
    if (!current?.rewritten_text || !sourceSection) return [];
    return diffWords(sourceSection, current.rewritten_text);
  }, [sourceSection, current?.rewritten_text]);

  const requestFormat = async (format: "plain" | "latex") => {
    if (results[format]?.rewritten_text) {
      setActiveFormat(format);
      setOpen(true);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setError(null);
    setLoadingFormat(format);
    setActiveFormat(format);
    setOpen(true);

    try {
      const response = await generateFixRewrite(
        {
          cv_text: cvText,
          fix: {
            section: candidate.section,
            fix: candidate.fix,
            why: candidate.why,
            how: candidate.how,
          },
          output_format: format,
        },
        controller.signal,
      );

      setResults((currentResults) => ({
        ...currentResults,
        [format]: response,
      }));
    } catch (requestError) {
      if ((requestError as Error).name === "AbortError") return;
      setError((requestError as Error).message || "Failed to generate rewrite.");
    } finally {
      setLoadingFormat((currentLoading) => (currentLoading === format ? null : currentLoading));
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-white">{candidate.section}</div>
              <Badge variant={candidate.source === "cv_fix" ? "amber" : "slate"}>
                {candidate.source === "cv_fix" ? "From CV fix" : "Promoted from action"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-zinc-300">{candidate.fix}</p>
          </div>
          <Button type="button" onClick={() => requestFormat("plain")} disabled={loadingFormat !== null}>
            {loadingFormat === "plain" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FilePenLine className="h-4 w-4" />
            )}
            Generate rewrite
          </Button>
        </div>

        {candidate.why ? (
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-zinc-200">Why:</span> {candidate.why}
          </p>
        ) : null}
        {candidate.how ? (
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-zinc-200">Guidance:</span> {candidate.how}
          </p>
        ) : null}

        {sourceSection && !current?.rewritten_text ? (
          <div className="rounded-lg border border-border bg-muted p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Source section
            </div>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300">
              {sourceSection}
            </pre>
          </div>
        ) : null}

        {open ? (
          <div className="space-y-4 rounded-xl border border-border bg-muted/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={activeFormat === "plain" ? "default" : "outline"}
                  onClick={() => requestFormat("plain")}
                  disabled={loadingFormat !== null}
                >
                  Plain text
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={activeFormat === "latex" ? "default" : "outline"}
                  onClick={() => requestFormat("latex")}
                  disabled={loadingFormat !== null}
                >
                  <Braces className="h-4 w-4" />
                  LaTeX version
                </Button>
              </div>
              {current?.rewritten_text ? <CopyButton value={current.rewritten_text} /> : null}
            </div>

            {loadingFormat === activeFormat ? (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Drafting your {activeFormat === "latex" ? "LaTeX" : "plain text"} rewrite...
              </div>
            ) : null}

            {error ? <div className="text-sm text-rose-400">{error}</div> : null}

            {current?.rewritten_text && loadingFormat !== activeFormat ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before (Original) Panel */}
                  <div className="rounded-xl border border-rose-900/20 bg-zinc-950/40 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-400">
                      <span>Before (Original)</span>
                    </div>
                    <div className="h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300 font-mono bg-zinc-950/30 p-3 rounded-lg border border-border/40">
                      {renderDiffBefore(diffs)}
                    </div>
                  </div>

                  {/* After (Suggested Rewrite) */}
                  <div className="rounded-xl border border-emerald-900/20 bg-zinc-950/40 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-400">
                      <span>After (Suggested Rewrite)</span>
                    </div>
                    <div className="h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200 font-mono bg-zinc-950/30 p-3 rounded-lg border border-border/40">
                      {renderDiffAfter(diffs)}
                    </div>
                  </div>
                </div>

                {current.notes ? (
                  <p className="text-xs text-zinc-400 bg-zinc-950/20 border border-border/60 rounded-xl p-3.5 leading-relaxed">
                    <span className="font-semibold text-zinc-200">Paste note:</span>{" "}
                    {current.notes}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
