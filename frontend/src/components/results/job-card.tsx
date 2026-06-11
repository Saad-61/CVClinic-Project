import { useState } from "react";
import { ExternalLink, MapPin, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { generateCoverLetter } from "../../api/cv";
import { CopyButton } from "../copy-button";
import { Button } from "../ui/button";
import type { MatchedJob } from "../../types/cv";

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

  const barColor =
    pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-rose-500";
  const textColor =
    pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-white leading-snug">{job.title}</div>
          {job.company_name && (
            <div className="mt-0.5 text-xs text-slate-600">{job.company_name}</div>
          )}
          {(job.location || job.source) && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
              )}
              {job.source && (
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-slate-800">
                  {job.source}
                </span>
              )}
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
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
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
              className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20"
            >
              {s}
            </span>
          ))}
        </div>
      ) : null}

      {!compact && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {job.url ? (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-full border border-transparent bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:bg-[#904cc9] transition-colors"
            >
              Apply <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          {showScore && cvText ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={coverLoading || !!coverLetter}
              className="border-zinc-800 text-[#af6eeb] hover:bg-[#9e59d9]/10 hover:text-white hover:border-[#9e59d9]"
              onClick={async () => {
                if (coverLetter) return;
                setCoverError(null);
                setCoverLoading(true);
                try {
                  const response = await generateCoverLetter({
                    cv_text: cvText,
                    job: {
                      title: job.title,
                      description: job.description,
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
              {coverLetter ? "Letter drafted" : "Draft cover letter"}
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
        <div className="mt-3 rounded-xl border border-[#9e59d9]/30 bg-gradient-to-br from-[#9e59d9]/10 to-[#B6ABFF]/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#B6ABFF]" />
              <div className="text-sm font-semibold text-zinc-100">Cover Letter Draft</div>
            </div>
            <CopyButton value={coverLetter} label="Copy" />
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white">
            {coverLetter}
          </p>
          {coverNote ? (
            <p className="mt-2 text-xs text-slate-600">
              <span className="font-semibold">Note:</span> {coverNote}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
