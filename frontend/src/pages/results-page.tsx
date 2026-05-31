import {
  ExternalLink,
  RotateCcw,
  Zap,
  Briefcase,
  Target,
  Wrench,
  ChevronRight,
  FileText,
  Loader2,
  Mail,
  MapPin,
  BookOpen,
  Key,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { QuickRewriteCard } from "../components/quick-rewrite-card";
import { generateCoverLetter } from "../api/cv";
import { CopyButton } from "../components/copy-button";
import { ScorePill } from "../components/score-pill";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { formatDateTime, safeUrlLabel, stripHtml } from "../lib/utils";
import { loadStoredReport } from "../lib/storage";
import { useCv } from "../state/cv-context";
import type {
  AnalyzeResponse,
  MatchedJob,
  MissingSkill,
  ProjectImprovement,
  QuickRewriteCandidate,
  StoredReport,
  TopAction,
} from "../types/cv";

function priorityWeight(priority: string) {
  const p = String(priority || "").toUpperCase();
  if (p === "HIGH") return 3;
  if (p === "MEDIUM") return 2;
  if (p === "LOW") return 1;
  return 0;
}

function sectionEmpty(text: string | undefined) {
  return !text || !text.trim();
}

function isInstantRewriteSection(section: string) {
  const normalized = section.trim().toLowerCase();
  if (!normalized) return false;

  const blocked = ["project", "portfolio", "demo", "github", "repository"];
  if (blocked.some((keyword) => normalized.includes(keyword))) return false;

  return [
    "summary",
    "objective",
    "skills",
    "profile",
    "contact",
    "header",
  ].some((keyword) => normalized.includes(keyword));
}

function buildQuickRewriteCandidates(report: AnalyzeResponse): QuickRewriteCandidate[] {
  const analysis = report.analysis || {};
  const candidates: QuickRewriteCandidate[] = [];
  for (const fix of analysis.cv_fixes ?? []) {
    const section = String(fix.section || "").trim();
    if (!section) continue;
    if (!isInstantRewriteSection(section)) continue;

    candidates.push({
      section,
      fix: String(fix.fix || "").trim(),
      why: String(fix.why || "").trim(),
      how: String(fix.how || "").trim(),
      source: "cv_fix",
    });
  }
  return candidates;
}

// ── Job Card ──────────────────────────────────────────────────────────────────
function JobCard({
  job,
  showScore,
  cvText,
}: {
  job: MatchedJob;
  showScore: boolean;
  cvText?: string;
}) {
  const score = job.score ?? 0;
  const pct = Math.min(Math.round(score), 100);
  const [coverLetter, setCoverLetter] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const barColor =
    pct > 50 ? "bg-green-500" : pct >= 40 ? "bg-amber-400" : "bg-rose-400";
  const textColor =
    pct > 50 ? "text-green-600" : pct >= 40 ? "text-amber-500" : "text-rose-500";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900">{job.title}</div>
          {job.company_name && (
            <div className="mt-0.5 text-xs text-slate-500">{job.company_name}</div>
          )}
          {(job.location || job.source) && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
              )}
              {job.source && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                  {job.source}
                </span>
              )}
            </div>
          )}
        </div>
        {showScore && (
          <span className={`shrink-0 text-xl font-bold ${textColor}`}>{pct}%</span>
        )}
      </div>

      {showScore && (
        <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
          <div
            className={`h-2 rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {job.matched_skills?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.matched_skills.slice(0, 6).map((s) => (
            <span
              key={s}
              className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 border border-purple-100"
            >
              {s}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
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
            className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
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
                setCoverError((error as Error).message || "Could not draft cover letter.");
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

      {coverError ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {coverError}
        </div>
      ) : null}

      {coverLetter ? (
        <div className="mt-3 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-purple-600" />
              <div className="text-sm font-semibold text-purple-900">Cover Letter Draft</div>
            </div>
            <CopyButton value={coverLetter} label="Copy" />
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {coverLetter}
          </p>
          {coverNote ? (
            <p className="mt-3 rounded-lg bg-white/70 border border-purple-100 px-3 py-2 text-xs text-slate-600">
              <span className="font-semibold text-purple-700">Note:</span> {coverNote}
            </p>
          ) : null}
        </div>
      ) : null}

      {job.description ? (
        <>
          <Separator className="my-3" />
          <details className="group">
            <summary className="cursor-pointer text-xs font-medium text-purple-700 group-open:underline">
              View description
            </summary>
            <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-600">
              {stripHtml(job.description).slice(0, 600)}…
            </p>
          </details>
        </>
      ) : null}
    </div>
  );
}

// ── Learning Roadmap ──────────────────────────────────────────────────────────
function LearningRoadmap({ skills }: { skills: MissingSkill[] }) {
  if (!skills.length) return null;

  // Group by priority
  const high = skills.filter((s) => String(s.priority).toUpperCase() === "HIGH");
  const medium = skills.filter((s) => String(s.priority).toUpperCase() === "MEDIUM");
  const low = skills.filter((s) => String(s.priority).toUpperCase() === "LOW");
  const phases: { label: string; color: string; bg: string; border: string; dot: string; items: MissingSkill[] }[] = [
    { label: "Phase 1 — High Priority", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", items: high },
    { label: "Phase 2 — Medium Priority", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", items: medium },
    { label: "Phase 3 — Lower Priority", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400", items: low },
  ].filter((p) => p.items.length > 0);

  if (!phases.length) return null;

  return (
    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-700 shadow-sm">
          <BookOpen className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="font-bold text-purple-900 text-base">Learning Roadmap</div>
          <div className="text-xs text-slate-500">Your personalised skill-building path, ordered by market impact</div>
        </div>
      </div>

      <div className="space-y-6">
        {phases.map((phase, phaseIdx) => (
          <div key={phase.label}>
            {/* Phase header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${phase.dot} text-white text-xs font-bold shadow-sm`}>
                {phaseIdx + 1}
              </div>
              <div className={`text-sm font-bold ${phase.color}`}>{phase.label}</div>
              {phaseIdx < phases.length - 1 && (
                <div className="ml-auto">
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
              )}
            </div>

            {/* Skills in this phase */}
            <div className="ml-3.5 border-l-2 border-dashed border-slate-200 pl-5 space-y-3">
              {phase.items.map((skill, idx) => {
                const isNew = String(skill.project_type || "").toLowerCase() === "new";
                return (
                  <div
                    key={`${phase.label}-${idx}`}
                    className={`relative rounded-xl border ${phase.border} ${phase.bg} p-3.5`}
                  >
                    {/* Connector dot */}
                    <div className={`absolute -left-[23px] top-4 h-3 w-3 rounded-full ${phase.dot} border-2 border-white shadow-sm`} />

                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="font-semibold text-slate-900 text-sm">{skill.skill}</div>
                      <div className="flex gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          isNew
                            ? "bg-violet-100 text-violet-700 border border-violet-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}>
                          {isNew ? "New project" : "Add to existing"}
                        </span>
                      </div>
                    </div>

                    {skill.why && (
                      <p className="mt-1.5 text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">Why: </span>{skill.why}
                      </p>
                    )}

                    {(skill.project || skill.project_idea) && (
                      <div className="mt-2 rounded-lg bg-white/80 border border-white px-3 py-2 text-xs text-slate-700">
                        {skill.project && (
                          <div><span className="font-semibold text-purple-700">Project: </span>{skill.project}</div>
                        )}
                        {skill.project_idea && (
                          <div className="mt-0.5"><span className="font-semibold text-slate-800">Idea: </span>{skill.project_idea}</div>
                        )}
                        {skill.implementation && (
                          <div className="mt-0.5"><span className="font-semibold text-slate-800">How: </span>{skill.implementation}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer legend */}
      <div className="mt-5 flex flex-wrap gap-3 border-t border-purple-100 pt-4 text-[10px] font-semibold uppercase tracking-wide">
        <span className="flex items-center gap-1 text-red-600"><Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" /> High priority</span>
        <span className="flex items-center gap-1 text-amber-600"><Circle className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> Medium priority</span>
        <span className="flex items-center gap-1 text-slate-500"><Circle className="h-2.5 w-2.5 fill-slate-400 text-slate-400" /> Lower priority</span>
        <span className="flex items-center gap-1 text-violet-700 ml-auto"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-violet-200 border border-violet-300" /> New project</span>
        <span className="flex items-center gap-1 text-amber-700"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-200 border border-amber-300" /> Existing project</span>
      </div>
    </div>
  );
}

// ── Skill Card ────────────────────────────────────────────────────────────────
function SkillCard({ skill, idx }: { skill: MissingSkill; idx: number }) {
  const isNew =
    String(skill.project_type || "").toLowerCase() === "new";
  const priority = String(skill.priority || "").toUpperCase();

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        isNew ? "border-l-4 border-l-violet-500" : "border-l-4 border-l-amber-500"
      } border-slate-200`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900">{skill.skill}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                priority === "HIGH"
                  ? "bg-red-50 text-red-600"
                  : priority === "MEDIUM"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {priority}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                isNew
                  ? "bg-violet-50 text-violet-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {isNew ? "New project" : "Add to existing"}
            </span>
          </div>
        </div>
        {skill.project ? (
          <span className="shrink-0 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
            {skill.project}
          </span>
        ) : null}
      </div>

      {skill.why || skill.project_idea ? (
        <div className="mt-3 space-y-1 text-xs text-slate-600">
          {skill.why && (
            <div><span className="font-semibold text-slate-800">Why:</span> {skill.why}</div>
          )}
          {skill.project_idea && (
            <div><span className="font-semibold text-slate-800">How:</span> {skill.project_idea}</div>
          )}
          {skill.implementation && (
            <div><span className="font-semibold text-slate-800">Where:</span> {skill.implementation}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ── Action Item ───────────────────────────────────────────────────────────────
function ActionItem({ action, idx }: { action: TopAction; idx: number }) {
  return (
    <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-700 text-sm font-bold text-white">
        {idx + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-slate-900">{action.action}</div>
        {!sectionEmpty(action.section) && (
          <div className="mt-0.5 text-xs text-slate-500">{action.section}</div>
        )}
        {action.why || action.how ? (
          <div className="mt-2 space-y-1 text-xs text-slate-600">
            {action.why && (
              <div><span className="font-semibold text-slate-800">Why:</span> {action.why}</div>
            )}
            {action.how && (
              <div><span className="font-semibold text-slate-800">How:</span> {action.how}</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProjectImprovementCard({ improvement }: { improvement: ProjectImprovement }) {
  return (
    <div className="rounded-xl border-l-4 border-l-green-500 border border-slate-200 bg-white p-4 shadow-sm">
      <div className="font-semibold text-slate-900">{improvement.project}</div>
      <div className="mt-2 space-y-1 text-xs text-slate-600">
        {improvement.current_issue && (
          <div><span className="font-semibold text-slate-800">Issue:</span> {improvement.current_issue}</div>
        )}
        {improvement.improvement && (
          <div><span className="font-semibold text-slate-800">Upgrade:</span> {improvement.improvement}</div>
        )}
        {improvement.impact && (
          <div><span className="font-semibold text-slate-800">Impact:</span> {improvement.impact}</div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const navigate = useNavigate();
  const { report, filename, createdAt, setReport, startOver } = useCv();
  const [rawOpen, setRawOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [jobsView, setJobsView] = useState<"matched" | "all">("matched");

  const stored = useMemo<StoredReport | null>(() => loadStoredReport(), []);
  const effective: { report: AnalyzeResponse; filename: string; createdAt: string } | null =
    report && createdAt
      ? { report, filename, createdAt }
      : stored
        ? { report: stored.report, filename: stored.filename, createdAt: stored.createdAt }
        : null;

  if (!effective) return <Navigate to="/" replace />;

  const analysis = effective.report.analysis || {};
  const jobMatches = analysis.job_matches ?? [];
  const missingSkills = (analysis.missing_skills ?? [])
    .slice()
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
  const cvFixes = analysis.cv_fixes ?? [];
  const projectImprovements = analysis.project_improvements ?? [];
  const quickRewriteCandidates = buildQuickRewriteCandidates(effective.report);
  const topActions = analysis.top_actions ?? [];

  const jobsSorted = useMemo<MatchedJob[]>(() => {
    const jobs = (effective.report.matched_jobs ?? []).slice();
    jobs.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return jobs;
  }, [effective.report.matched_jobs]);

  const allJobs = useMemo<MatchedJob[]>(
    () => (effective.report.all_jobs ?? []).slice(),
    [effective.report.all_jobs]
  );

  const jobsToShow = jobsView === "all" ? allJobs : jobsSorted;
  const evaluatedCount = allJobs.length || jobsSorted.length;
  const jobSources = Array.from(
    new Set((allJobs.length ? allJobs : jobsSorted).map((job) => job.source).filter(Boolean))
  );

  const createdLabel = formatDateTime(effective.createdAt);
  const rawJson = JSON.stringify(effective.report, null, 2);
  const cvText = effective.report.cv_text || "";
  const resumeScore = effective.report.resume_score ?? null;

  const onStartOver = () => {
    startOver();
    navigate("/", { replace: true });
  };

  return (
    <div className="space-y-5">
      {/* ── Header card ── */}
      <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Your CV Report</CardTitle>
                <CardDescription className="mt-1">
                  {effective.filename}
                  {createdLabel ? ` · ${createdLabel}` : ""}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {resumeScore !== null && (
                  <div className="flex flex-col items-start rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">Resume Score</span>
                      <ScorePill score={resumeScore} />
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500 leading-tight max-w-[200px]">
                      Based on skill count, project mentions &amp; links detected in your CV
                    </div>
                  </div>
                )}
                <Button type="button" variant="outline" onClick={onStartOver}>
                  <RotateCcw className="h-4 w-4" />
                  Start over
                </Button>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline">Raw JSON</Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {analysis.error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {analysis.error}
              </div>
            ) : null}
            <CollapsibleContent className="mt-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">Raw response</div>
                  <CopyButton value={rawJson} label="Copy" />
                </div>
                <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre rounded-md bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                  {rawJson}
                </pre>
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      {/* ── Hero: Top Actions Banner ── */}
      {topActions.length > 0 && (
        <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-purple-600" />
            <span className="font-bold text-purple-900 text-base">Top Actions — Do This Next</span>
          </div>
          <div className="space-y-2">
            {topActions.slice(0, 3).map((a, idx) => (
              <div key={`hero-${idx}`} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-700 text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <div>
                  <span className="font-semibold text-slate-800">{a.action}</span>
                  {!sectionEmpty(a.section) && (
                    <span className="ml-2 text-xs text-slate-500">· {a.section}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {topActions.length > 3 && (
            <button
              onClick={() => setActiveTab("actions")}
              className="mt-3 flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline"
            >
              See all {topActions.length} actions <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* ── Links from CV (compact) ── */}
      {(effective.report.links?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Links detected in CV
          </div>
          <div className="flex flex-wrap gap-2">
            {effective.report.links!.map((link) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {safeUrlLabel(link)} <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start gap-1">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" /> Jobs
            <span className="ml-1 rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-semibold text-purple-700">
              {jobsSorted.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Actions
            <span className="ml-1 rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-semibold text-purple-700">
              {topActions.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" /> Skills Gap
            <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700">
              {missingSkills.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="cv-fixes" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> CV Fixes
            <span className="ml-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-700">
              {quickRewriteCandidates.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Left: Actions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>Concrete next steps beyond your CV.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("actions")}>
                    All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {topActions.length ? (
                  topActions.slice(0, 3).map((a, idx) => (
                    <ActionItem key={`ov-act-${idx}`} action={a} idx={idx} />
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No actions returned.</div>
                )}
              </CardContent>
            </Card>

            {/* Right: Best Job Matches */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Best Matches</CardTitle>
                    <CardDescription>Top roles by match score.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("jobs")}>
                    See all
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {jobsSorted.length ? (
                  jobsSorted.slice(0, 3).map((job) => (
                    <JobCard key={job.id} job={job} showScore cvText={cvText} />
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No matches returned.</div>
                )}
              </CardContent>
            </Card>

            {/* Bottom left: Top missing skills */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Top Skills Gap</CardTitle>
                    <CardDescription>Highest-impact gaps to close next.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("skills")}>
                    See all
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {missingSkills.length ? (
                  missingSkills.slice(0, 2).map((s, idx) => (
                    <SkillCard key={`ov-sk-${idx}`} skill={s} idx={idx} />
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No missing skills returned.</div>
                )}
              </CardContent>
            </Card>

            {/* Bottom right: Quick rewrites */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quick Rewrites</CardTitle>
                    <CardDescription>Instant CV-only fixes ready to paste.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("cv-fixes")}>
                    Open
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickRewriteCandidates.length ? (
                  quickRewriteCandidates.slice(0, 2).map((c, idx) => (
                    <div
                      key={`ov-rw-${idx}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900">{c.section}</div>
                        <Badge variant="indigo" className="shrink-0">Rewrite-ready</Badge>
                      </div>
                      <p className="mt-1.5 text-sm text-slate-600">{c.fix}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No rewrites returned.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Jobs Tab ── */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Job Matches</CardTitle>
              <CardDescription>
                {jobsSorted.length} matched · {evaluatedCount} total evaluated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dynamic Jooble status callout */}
              {effective.report.jooble_configured === false ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Key className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <div className="font-semibold text-amber-900">Add Jooble for Pakistan-targeted jobs</div>
                      <p className="mt-1 text-amber-800">
                        Currently showing remote jobs
                        {jobSources.length ? ` from ${jobSources.join(" + ")}` : ""}.
                        Set <code className="rounded bg-amber-100 px-1 font-mono text-xs">JOOBLE_API_KEY</code> in{" "}
                        <code className="rounded bg-amber-100 px-1 font-mono text-xs">backend/.env</code>{" "}
                        to get real Pakistan-based listings from Jooble.
                      </p>
                      <a
                        href="https://jooble.org/api/about"
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 underline hover:text-amber-900"
                      >
                        Get free Jooble API key <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : effective.report.jooble_configured === true ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-800">Jooble connected</span>
                    <span className="text-green-700">
                      — Pakistan-targeted jobs included
                      {jobSources.length ? ` (sources: ${jobSources.join(", ")})` : ""}.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">Current job pool: remote-first boards</div>
                  <p className="mt-1">
                    {jobSources.length ? `Sources: ${jobSources.join(" + ")}.` : ""} Set{" "}
                    <code className="rounded bg-indigo-100 px-1 font-mono text-xs">JOOBLE_API_KEY</code>{" "}
                    for Pakistan-targeted jobs.
                  </p>
                </div>
              )}

              {/* Score legend */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-green-50 border border-green-200 px-2.5 py-1 font-semibold text-green-700">Above 50% = strong</span>
                <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 font-semibold text-amber-700">40–50% = workable</span>
                <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 font-semibold text-rose-700">Below 40% = weak</span>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button" size="sm"
                  variant={jobsView === "matched" ? "default" : "outline"}
                  onClick={() => setJobsView("matched")}
                >
                  Matched ({jobsSorted.length})
                </Button>
                <Button
                  type="button" size="sm"
                  variant={jobsView === "all" ? "default" : "outline"}
                  onClick={() => setJobsView("all")}
                >
                  All ({allJobs.length})
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {jobsToShow.length ? (
                  jobsToShow.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      showScore={jobsView === "matched"}
                      cvText={jobsView === "matched" ? cvText : undefined}
                    />
                  ))
                ) : (
                  <div className="col-span-2 text-sm text-slate-500">No jobs returned.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Actions Tab ── */}
        <TabsContent value="actions">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Action Plan</CardTitle>
                <CardDescription>
                  Work to do before you claim it on the CV. CV wording changes live in CV Fixes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topActions.length ? (
                  topActions.map((action, idx) => (
                    <ActionItem key={`act-${idx}`} action={action} idx={idx} />
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No action plan returned.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start gap-2">
                  <Wrench className="mt-0.5 h-4 w-4 text-green-600" />
                  <div>
                    <CardTitle>Project Upgrades</CardTitle>
                    <CardDescription>
                      Existing projects to improve, then mention after you implement them.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectImprovements.length ? (
                  projectImprovements.map((improvement, idx) => (
                    <ProjectImprovementCard key={`pi-${idx}`} improvement={improvement} />
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No project upgrades returned.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Skills Gap Tab ── */}
        <TabsContent value="skills">
          <div className="space-y-5">
            {/* Detailed skill cards */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Gap — Detail</CardTitle>
                <CardDescription>
                  <span className="mr-4 inline-flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-amber-500" />
                    Add to existing project
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-violet-500" />
                    Build new project
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {missingSkills.length ? (
                  missingSkills.map((s, idx) => (
                    <SkillCard key={`sk-${idx}`} skill={s} idx={idx} />
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No missing skills returned.</div>
                )}
              </CardContent>
            </Card>

            {/* Learning Roadmap — shown below the detailed cards */}
            <LearningRoadmap skills={missingSkills} />
          </div>
        </TabsContent>

        {/* ── CV Fixes Tab ── */}
        <TabsContent value="cv-fixes">
          <div className="space-y-5">
            {/* CV Quick Rewrites */}
            <Card>
              <CardHeader>
                <CardTitle>CV Quick Rewrites</CardTitle>
                <CardDescription>Generate and paste directly into your resume.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickRewriteCandidates.length ? (
                  !cvText ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      This report was created before CV text was stored. Re-analyze to generate rewrites.
                    </div>
                  ) : (
                    quickRewriteCandidates.map((candidate, index) => (
                      <QuickRewriteCard
                        key={`${candidate.section}-${candidate.source}-${index}`}
                        candidate={candidate}
                        cvText={cvText}
                      />
                    ))
                  )
                ) : (
                  <div className="text-sm text-slate-500">No CV improvements returned.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strategic CV Fixes</CardTitle>
                <CardDescription>
                  Advice for wording, grouping, and proof links. Use Quick Rewrites only for instant paste-ready text.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {cvFixes.length ? (
                  cvFixes.map((fix, idx) => (
                    <div key={`fix-${idx}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold text-slate-900">{fix.section}</div>
                        {isInstantRewriteSection(fix.section) ? (
                          <Badge variant="indigo">Rewrite-ready</Badge>
                        ) : (
                          <Badge variant="slate">Do after proof exists</Badge>
                        )}
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        {fix.fix && (
                          <div><span className="font-semibold text-slate-800">Fix:</span> {fix.fix}</div>
                        )}
                        {fix.why && (
                          <div><span className="font-semibold text-slate-800">Why:</span> {fix.why}</div>
                        )}
                        {fix.how && (
                          <div><span className="font-semibold text-slate-800">How:</span> {fix.how}</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No CV fixes returned.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {!report && stored ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Loaded report from this session.
          <Button
            type="button" variant="link"
            className="ml-2 h-auto p-0 text-indigo-700"
            onClick={() => setReport(stored.report, stored.filename, stored.createdAt)}
          >
            Keep in app state
          </Button>
        </div>
      ) : null}
    </div>
  );
}
