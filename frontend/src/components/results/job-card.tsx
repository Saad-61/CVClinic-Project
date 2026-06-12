import { useState } from "react";
import { ExternalLink, MapPin, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { generateCoverLetter } from "../../api/cv";
import { CopyButton } from "../copy-button";
import { Button } from "../ui/button";
import type { MatchedJob } from "../../types/cv";
import SpotlightCard from "../animations/SpotlightCard";
import { Sheet } from "../ui/sheet";
import { AnimatePresence, motion } from "framer-motion";

interface JobCardProps {
  job: MatchedJob;
  showScore: boolean;
  cvText?: string;
  compact?: boolean;
}


export function JobCard({ job, showScore, cvText, compact = false }: JobCardProps) {
  const score = job.score ?? 0;
  const pct = Math.min(Math.round(score), 100);
  const [coverLetter, setCoverLetter] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const barColor =
    pct >= 50 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500";
  const textColor =
    pct >= 50 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-rose-400";

  return (
    <SpotlightCard className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-white leading-snug">{job.title}</div>
          {job.company_name && (
            <div className="mt-0.5 text-xs text-slate-650">{job.company_name}</div>
          )}
          {(job.location || job.source) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
              )}
              {job.source && (() => {
                const s = job.source.toLowerCase();
                let style = "bg-primary/10 text-primary border-primary/20";
                if (s.includes("jooble")) style = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                else if (s.includes("linkedin")) style = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                else if (s.includes("remotive")) style = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                else if (s.includes("jobicy")) style = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                else if (s.includes("adzuna")) style = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                else if (s.includes("arbeitnow")) style = "bg-teal-500/10 text-teal-400 border-teal-500/20";
                
                return (
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${style}`}>
                    {job.source}
                  </span>
                );
              })()}
            </div>
          )}
        </div>
        {showScore && (
          <span className={`shrink-0 text-xl font-bold tabular-nums ${textColor}`}>
            {pct}%
          </span>
        )}
      </div>

      {showScore && (
        <div className="mt-2.5 h-1.5 w-full rounded-full bg-muted">
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        </div>
      )}

      {!compact && job.matched_skills?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.matched_skills.slice(0, 6).map((s) => (
            <span
              key={s}
              className="rounded-md bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-zinc-300 border border-zinc-800"
            >
              {s}
            </span>
          ))}
        </div>
      ) : null}

      {!compact && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {job.url ? (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-full border border-transparent bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Apply <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          {showScore && cvText ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={coverLoading}
              className="border-zinc-800 text-primary hover:bg-primary/10 hover:text-white hover:border-primary"
              onClick={async () => {
                if (coverLetter) {
                  setIsSheetOpen(true);
                  return;
                }
                setCoverError(null);
                setCoverLoading(true);
                try {
                  const response = await generateCoverLetter({
                    cv_text: cvText,
                    job: {
                      title: job.title,
                      description: job.description || "",
                      company_name: job.company_name,
                      location: job.location,
                      source: job.source,
                      url: job.url,
                      matched_skills: job.matched_skills,
                      score: job.score,
                    },
                    tone: "professional",
                  });
                  setCoverLetter(response.cover_letter);
                  setCoverNote(response.notes || "");
                  setIsSheetOpen(true);
                } catch (error) {
                  setCoverError(
                    (error as Error).message || "Could not draft cover letter."
                  );
                } finally {
                  setCoverLoading(false);
                }
              }}
            >
              {coverLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : coverLetter ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              {coverLetter ? "View cover letter" : "Draft cover letter"}
            </Button>
          ) : null}
        </div>
      )}



      {!compact && coverError ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {coverError}
        </div>
      ) : null}

      {!compact && coverLetter ? (
        <Sheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          title="Cover Letter Draft"
        >
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between gap-3 bg-zinc-900 border border-border/80 rounded-xl p-3.5">
              <div className="text-sm font-semibold text-zinc-300">Target Role: {job.title}</div>
              <CopyButton value={coverLetter} label="Copy Letter" />
            </div>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-100 font-sans bg-zinc-950/40 border border-border p-4 rounded-xl">
              {coverLetter}
            </pre>
            {coverNote ? (
              <div className="text-xs text-slate-600 bg-zinc-900 border border-border/60 rounded-xl p-3">
                <span className="font-semibold text-zinc-400">Editor's Note:</span> {coverNote}
              </div>
            ) : null}
          </div>
        </Sheet>
      ) : null}
    </SpotlightCard>
  );
}
