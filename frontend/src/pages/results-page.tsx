import {
  RotateCcw,
  LayoutGrid,
  Briefcase,
  ListTodo,
  GraduationCap,
  Wrench,
  ChevronRight,
  Key,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";
import { QuickRewriteCard } from "../components/quick-rewrite-card";
import { CopyButton } from "../components/copy-button";
import { ScoreRing } from "../components/results/score-ring";
import { JobCard } from "../components/results/job-card";
import { SkillCard } from "../components/results/skill-card";
import { ActionItem } from "../components/results/action-item";
import { ProjectImprovementCard } from "../components/results/project-improvement-card";
import { LearningRoadmap } from "../components/results/learning-roadmap";
import { NewProjectCard } from "../components/results/new-project-card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { formatDateTime, safeUrlLabel } from "../lib/utils";
import {
  buildQuickRewriteCandidates,
  priorityWeight,
} from "../lib/report-utils";
import { loadStoredReport } from "../lib/storage";
import { useCv } from "../state/cv-context";
import type { AnalyzeResponse, MatchedJob, StoredReport } from "../types/cv";

// ── Tab fade wrapper ──────────────────────────────────────────────────────────
function TabFade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      {children}
    </motion.div>
  );
}

// ── Hero stat tile ────────────────────────────────────────────────────────────
function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">
        {label}
      </div>
      <div
        className={`text-2xl font-bold tabular-nums leading-tight ${
          accent ?? "text-white"
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] text-slate-600 leading-tight truncate">{sub}</div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const navigate = useNavigate();
  const { report, filename, createdAt, startOver } = useCv();
  const [rawOpen, setRawOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [jobsView, setJobsView] = useState<"matched" | "all">("matched");
  const [actionsSubTab, setActionsSubTab] = useState<"actions" | "upgrades" | "new-projects">("actions");
  const [skillsSubTab, setSkillsSubTab] = useState<"detail" | "roadmap">("detail");


  const stored = useMemo<StoredReport | null>(() => loadStoredReport(), []);
  const effective: {
    report: AnalyzeResponse;
    filename: string;
    createdAt: string;
  } | null =
    report && createdAt
      ? { report, filename, createdAt }
      : stored
      ? { report: stored.report, filename: stored.filename, createdAt: stored.createdAt }
      : null;

  if (!effective) return <Navigate to="/" replace />;

  const analysis = effective.report.analysis || {};
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
    new Set(
      (allJobs.length ? allJobs : jobsSorted)
        .map((job) => job.source)
        .filter(Boolean)
    )
  );

  const isJdMode     = !!effective.report.is_jd_mode;
  const jdJobTitle   = effective.report.jd_job_title || "Target Role";

  // If in JD mode and somehow landed on the hidden Jobs tab, reset to overview
  useEffect(() => {
    if (isJdMode && activeTab === "jobs") setActiveTab("overview");
  }, [isJdMode, activeTab]);

  const createdLabel = formatDateTime(effective.createdAt);
  const rawJson = JSON.stringify(effective.report, null, 2);
  const cvText = effective.report.cv_text || "";
  const resumeScore = typeof effective.report.resume_score === "number"
    ? effective.report.resume_score
    : null;


  const bestMatchScore = jobsSorted[0]?.score
    ? `${Math.round(jobsSorted[0].score)}%`
    : "—";
  const highPrioritySkill =
    missingSkills.find((s) => String(s.priority).toUpperCase() === "HIGH")?.skill ??
    missingSkills[0]?.skill ??
    "—";

  const onStartOver = () => {
    startOver();
    navigate("/", { replace: true });
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
      {/* Centered navigation tabs right below header */}
      <div className="flex justify-center w-full">
        <TabsList className="grid bg-muted p-1.5 rounded-xl max-w-2xl w-full border border-border/50 shadow-sm gap-1"
          style={{ gridTemplateColumns: isJdMode ? "repeat(4, minmax(0, 1fr))" : "repeat(5, minmax(0, 1fr))" }}
        >
          <TabsTrigger value="overview" className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-purple-400 data-[state=active]:shadow-sm">
            <LayoutGrid className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          {!isJdMode && (
            <TabsTrigger value="jobs" className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-purple-400 data-[state=active]:shadow-sm">
              <Briefcase className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Jobs</span>
              <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700/50">
                {jobsSorted.length}
              </span>
            </TabsTrigger>
          )}
          <TabsTrigger value="actions" className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-purple-400 data-[state=active]:shadow-sm">
            <ListTodo className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Actions</span>
            <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700/50">
              {topActions.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-purple-400 data-[state=active]:shadow-sm">
            <GraduationCap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Skills</span>
            <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700/50">
              {missingSkills.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="cv-fixes" className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-purple-400 data-[state=active]:shadow-sm">
            <Wrench className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Fixes</span>
            <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700/50">
              {quickRewriteCandidates.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ── File Info Header ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Top row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">{effective.filename}</div>
            {createdLabel && (
              <div className="text-xs text-slate-500 mt-0.5">Analyzed {createdLabel}</div>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onStartOver}>
            <RotateCcw className="h-3.5 w-3.5" />
            Start over
          </Button>
        </div>

        {/* CV links */}
        {(effective.report.links?.length ?? 0) > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
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
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 transition-colors max-w-full"
                >
                  <span className="truncate">{safeUrlLabel(link)}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {analysis.error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {analysis.error}
          </div>
        )}
      </div>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          <TabFade>
            <div className="space-y-4 mt-4">
              {/* Score & Stats Block (now moved inside the Overview Tab) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  {resumeScore !== null && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 sm:border-r border-slate-100 sm:pr-5 text-center sm:text-left">
                      <ScoreRing score={resumeScore} />
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {isJdMode
                            ? "Analyzing for"
                            : effective.report.target_role ? "Selected Target Role" : "Inferred CV Profile"}
                        </div>
                        <div className="text-base font-bold text-purple-700 leading-tight max-w-[200px]">
                          {isJdMode
                            ? jdJobTitle
                            : effective.report.target_role || analysis.inferred_role || "Software Engineer"}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {isJdMode
                            ? "Custom job description"
                            : effective.report.target_role
                            ? "Specified before upload"
                            : "Analyzed from your resume"}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-3 flex-1">
                    <StatTile
                      label={isJdMode ? "Role analyzed" : "Jobs matched"}
                      value={isJdMode ? jdJobTitle : jobsSorted.length}
                      sub={isJdMode ? "Custom job description" : `${evaluatedCount} total evaluated`}
                    />
                    <StatTile
                      label="Best match"
                      value={bestMatchScore}
                      sub={jobsSorted[0]?.title ?? ""}
                      accent={
                        jobsSorted[0]?.score && jobsSorted[0].score > 50
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }
                    />
                    <StatTile
                      label="Skills gap"
                      value={missingSkills.length}
                      sub={`Top: ${highPrioritySkill}`}
                      accent={missingSkills.length > 0 ? "text-rose-400" : "text-emerald-400"}
                    />
                  </div>
                </div>
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-purple-600" />
                        Best Fit Roles
                      </CardTitle>
                      <CardDescription>Your top matches by score.</CardDescription>
                    </div>
                    {!isJdMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("jobs")}
                      className="text-purple-600 hover:text-purple-700 text-xs"
                    >
                      See all {jobsSorted.length} jobs{" "}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {jobsSorted.length ? (
                    jobsSorted.slice(0, 3).map((job) => (
                      <JobCard key={job.id} job={job} showScore compact />
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">No matches returned.</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4 text-purple-600" />
                        Your Next 3 Actions
                      </CardTitle>
                      <CardDescription>
                        Highest-impact changes to make this week.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveTab("actions");
                        window.scrollTo({ top: 0, behavior: "instant" });
                      }}
                      className="text-purple-600 hover:text-purple-700 text-xs"
                    >
                      Full plan <ChevronRight className="h-3.5 w-3.5" />
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

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-orange-500" />
                        Critical Skills Gap
                      </CardTitle>
                      <CardDescription>
                        Skills to add — sorted by market impact.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveTab("skills");
                        window.scrollTo({ top: 0, behavior: "instant" });
                      }}
                      className="text-purple-600 hover:text-purple-700 text-xs"
                    >
                      Full analysis <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {missingSkills.length ? (
                    <div className="flex flex-wrap gap-2">
                      {missingSkills.map((s, idx) => {
                        const p = String(s.priority || "").toUpperCase();
                        return (
                          <span
                            key={`ov-skill-${idx}`}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                              p === "HIGH"
                                ? "bg-rose-950/30 text-rose-300 border-rose-900/50"
                                : p === "MEDIUM"
                                ? "bg-amber-950/30 text-amber-300 border-amber-900/50"
                                : "bg-slate-800 text-slate-300 border-slate-700/50"
                            }`}
                          >
                            <span
                              className={`inline-block h-1.5 w-1.5 rounded-full ${
                                p === "HIGH"
                                  ? "bg-rose-500"
                                  : p === "MEDIUM"
                                  ? "bg-amber-500"
                                  : "bg-slate-500"
                              }`}
                            />
                            {s.skill}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      No missing skills returned.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabFade>
        </TabsContent>

        {/* ── Jobs Tab — hidden in JD mode ── */}
        {!isJdMode && (<TabsContent value="jobs">
          <TabFade>
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Job Matches</CardTitle>
                  <CardDescription>
                    {jobsSorted.length} matched · {evaluatedCount} total evaluated
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {effective.report.jooble_configured === false ? (
                    <div className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-4 text-sm">
                      <div className="flex items-start gap-3">
                        <Key className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        <div>
                          <div className="font-semibold text-amber-200">
                            Add Jooble for Pakistan-targeted jobs
                          </div>
                          <p className="mt-1 text-amber-300">
                            Currently showing remote jobs
                            {jobSources.length ? ` from ${jobSources.join(" + ")}` : ""}.
                            Set{" "}
                            <code className="rounded bg-amber-950/50 border border-amber-900/40 px-1 font-mono text-xs text-amber-300">
                              JOOBLE_API_KEY
                            </code>{" "}
                            in{" "}
                            <code className="rounded bg-amber-950/50 border border-amber-900/40 px-1 font-mono text-xs text-amber-300">
                              backend/.env
                            </code>{" "}
                            to get real Pakistan-based listings.
                          </p>
                          <a
                            href="https://jooble.org/api/about"
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-400 underline hover:text-amber-200"
                          >
                            Get free Jooble API key <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : effective.report.jooble_configured === true ? (
                    <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-3 text-sm">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
                        <div>
                          <div className="font-semibold text-emerald-200">
                            Searching all connected platforms
                          </div>
                          <p className="text-emerald-300 mt-0.5">
                            Sourcing and ranking jobs from: {jobSources.length ? jobSources.join(", ") : "Jooble, Remotive, Jobicy, Arbeitnow, Adzuna"}.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-emerald-950/30 border border-emerald-900/50 px-2.5 py-1 font-semibold text-emerald-300">
                      Above 50% = strong
                    </span>
                    <span className="rounded-full bg-amber-950/30 border border-amber-900/50 px-2.5 py-1 font-semibold text-amber-300">
                      40–50% = workable
                    </span>
                    <span className="rounded-full bg-rose-950/30 border border-rose-900/50 px-2.5 py-1 font-semibold text-rose-300">
                      Below 40% = weak
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={jobsView === "matched" ? "default" : "outline"}
                      onClick={() => setJobsView("matched")}
                    >
                      Matched ({jobsSorted.length})
                    </Button>
                    <Button
                      type="button"
                      size="sm"
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
                      <div className="col-span-2 text-sm text-slate-500">
                        No jobs returned.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabFade>
        </TabsContent>
        )}{/* end !isJdMode jobs tab */}

        {/* ── Actions Tab ── */}
        <TabsContent value="actions">
          <TabFade>
            <div className="space-y-4 mt-4">
              {/* Sub-tab pills for Actions */}
              <div className="flex flex-wrap gap-1.5 bg-muted p-1 rounded-xl w-fit border border-border/50 shadow-sm">
                <button
                  type="button"
                  onClick={() => setActionsSubTab("actions")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    actionsSubTab === "actions"
                      ? "bg-card text-purple-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-card/40"
                  }`}
                >
                  This Week's Actions
                </button>
                <button
                  type="button"
                  onClick={() => setActionsSubTab("upgrades")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    actionsSubTab === "upgrades"
                      ? "bg-card text-purple-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-card/40"
                  }`}
                >
                  Project Upgrades
                </button>
                <button
                  type="button"
                  onClick={() => setActionsSubTab("new-projects")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    actionsSubTab === "new-projects"
                      ? "bg-card text-purple-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-card/40"
                  }`}
                >
                  New Project Ideas
                </button>
              </div>

              {/* Tab Contents */}
              {actionsSubTab === "actions" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">This Week's Actions</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
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
              )}

              {actionsSubTab === "upgrades" && (
                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-2">
                      <Wrench className="mt-0.5 h-4 w-4 text-purple-600" />
                      <div>
                        <CardTitle className="text-base sm:text-lg">Project Upgrades</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Existing projects in your CV to upgrade with new tools and practices.
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
                      <div className="text-sm text-slate-500">
                        No project upgrades returned.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {actionsSubTab === "new-projects" && (
                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-2">
                      <Lightbulb className="mt-0.5 h-4 w-4 text-purple-600" />
                      <div>
                        <CardTitle className="text-base sm:text-lg">New Project Ideas</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Targeted starter projects to bridge your critical skill gaps and expand your portfolio.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {missingSkills.filter((s) => s.project_type === "new" && s.project_idea).length ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {missingSkills
                          .filter((s) => s.project_type === "new" && s.project_idea)
                          .map((skill, idx) => (
                            <NewProjectCard key={`npc-${idx}`} skill={skill} />
                          ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        No new project ideas needed for your current skill alignment.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabFade>
        </TabsContent>

        {/* ── Skills Gap Tab ── */}
        <TabsContent value="skills">
          <TabFade>
            <div className="space-y-4 mt-4">
              {/* Sub-tab pills for Skills */}
              <div className="flex flex-wrap gap-1.5 bg-muted p-1 rounded-xl w-fit border border-border/50 shadow-sm">
                <button
                  type="button"
                  onClick={() => setSkillsSubTab("detail")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    skillsSubTab === "detail"
                      ? "bg-card text-purple-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-card/40"
                  }`}
                >
                  Skills Gap Detail
                </button>
                <button
                  type="button"
                  onClick={() => setSkillsSubTab("roadmap")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    skillsSubTab === "roadmap"
                      ? "bg-card text-purple-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-card/40"
                  }`}
                >
                  Learning Roadmap
                </button>
              </div>

              {/* Tab Contents */}
              {skillsSubTab === "detail" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Skills Gap — Detail</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Detailed analysis of missing skills and practical project ideas to bridge the gap.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {missingSkills.length ? (
                      missingSkills.map((s, idx) => (
                        <SkillCard key={`sk-${idx}`} skill={s} idx={idx} jobs={jobsSorted} />
                      ))
                    ) : (
                      <div className="text-sm text-slate-500">
                        No missing skills returned.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {skillsSubTab === "roadmap" && (
                <LearningRoadmap skills={missingSkills} />
              )}
            </div>
          </TabFade>
        </TabsContent>

        {/* ── CV Fixes Tab ── */}
        <TabsContent value="cv-fixes">
          <TabFade>
            <div className="space-y-5 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>CV Quick Rewrites</CardTitle>
                  <CardDescription>
                    Generate and paste directly into your resume.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quickRewriteCandidates.length ? (
                    !cvText ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        This report was created before CV text was stored. Re-analyze to
                        generate rewrites.
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
                    <div className="text-sm text-slate-500">
                      No rewrite candidates found.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All CV Fixes</CardTitle>
                  <CardDescription>Every section flagged for improvement.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cvFixes.length ? (
                    cvFixes.map((fix, idx) => (
                      <div
                        key={`fix-${idx}`}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-semibold text-slate-900">
                            {fix.section}
                          </div>
                          <Badge variant="indigo" className="shrink-0">
                            Fix
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-sm text-slate-600">{fix.fix}</p>
                        {fix.why && (
                          <p className="mt-1 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">Why:</span>{" "}
                            {fix.why}
                          </p>
                        )}
                        {fix.how && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">How:</span>{" "}
                            {fix.how}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">No CV fixes returned.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabFade>
        </TabsContent>
      {/* ── Raw JSON — dev only ── */}
      <div className="mt-2 text-right">
        <button
          type="button"
          onClick={() => setRawOpen((v) => !v)}
          className="text-[10px] text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline transition-colors"
          aria-label="Toggle raw JSON output"
        >
          {rawOpen ? "Hide" : "View"} raw JSON
        </button>
        {rawOpen && (
          <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4 text-left">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-sm font-semibold text-slate-900">Raw response</div>
              <CopyButton value={rawJson} label="Copy" />
            </div>
            <pre className="max-h-[420px] overflow-auto whitespace-pre rounded-md bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
              {rawJson}
            </pre>
          </div>
        )}
      </div>
    </Tabs>
  );
}
