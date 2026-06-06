import {
  ChevronDown,
  ChevronUp,
  FileText,
  Target,
  Search,
  XCircle,
  Clock,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { uploadCv } from "../api/cv";
import { FileDropzone } from "../components/file-dropzone";
import { Skeleton } from "../components/ui/skeleton";
import { useCv } from "../state/cv-context";

const TARGET_ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile Developer",
  "DevOps / Cloud Engineer",
  "Data Scientist / ML Engineer",
  "Data Analyst",
  "Product Manager",
  "UI/UX Designer",
  "QA Engineer",
  "Other (specify below)",
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const {
    file,
    filename,
    preview,
    setFile,
    setPreview,
    queueAnalysis,
    targetRole,
    setTargetRole,
    analysisMode,
    setAnalysisMode,
    jobDescription,
    setJobDescription,
    jobTitle,
    setJobTitle,
  } = useCv();

  const JD_MAX = 4000;
  const jdIsValid = analysisMode === "specific-role" ? jobDescription.trim().length > 30 : true;

  const [uploading, setUploading] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  const [selectedRoleOption, setSelectedRoleOption] = useState(() => {
    if (!targetRole) return "";
    return TARGET_ROLES.includes(targetRole) ? targetRole : "Other (specify below)";
  });
  const [customRoleText, setCustomRoleText] = useState(() => {
    if (!targetRole) return "";
    return TARGET_ROLES.includes(targetRole) ? "" : targetRole;
  });

  const handleRoleOptionChange = (value: string) => {
    setSelectedRoleOption(value);
    if (value === "Other (specify below)") {
      setTargetRole(customRoleText);
    } else {
      setTargetRole(value);
    }
  };

  const handleCustomRoleChange = (value: string) => {
    setCustomRoleText(value);
    setTargetRole(value);
  };

  const onFileSelected = async (nextFile: File) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setError(null);
    setUploading(true);
    setPreviewExpanded(false);
    setFile(nextFile);

    try {
      const res = await uploadCv(nextFile, controller.signal);
      setPreview(res.preview, res.filename);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message || "Failed to preview CV.");
      setPreview("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] lg:gap-16 lg:items-start">

      {/* ─────────────── LEFT: Narrative Story ─────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.22,
              delayChildren: 0.1,
            }
          }
        }}
        className="space-y-24 pb-24"
      >

        {/* ── HERO ── */}
        <motion.section variants={fadeUp} className="py-10 sm:py-14">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-semibold text-purple-700">
            CV Analysis · No account required
          </div>

          {/* Headline */}
          <h1 className="font-outfit mb-5 text-5xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-6xl xl:text-[4rem]">
            Your CV,<br />
            finally matched<br />
            to{" "}
            <span className="text-purple-700">real jobs.</span>
          </h1>

          <p className="mb-10 max-w-[440px] text-lg leading-relaxed text-slate-600">
            Upload your CV and get a complete diagnostic — match scores, skill gaps, and a ranked action plan based on live job listings.
          </p>

          {/* Prominent scroll indicator (desktop only) */}
          <div className="hidden lg:inline-flex items-center gap-4 rounded-2xl border-2 border-purple-200 bg-purple-50 px-6 py-4">
            <div className="flex flex-col items-center gap-0.5">
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}>
                <ChevronDown className="h-6 w-6 text-purple-600" aria-hidden="true" />
              </motion.div>
              <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.05, repeat: Infinity, ease: 'easeInOut', delay: 0.12 }}>
                <ChevronDown className="h-5 w-5 text-purple-400" aria-hidden="true" />
              </motion.div>
            </div>
            <div>
              <div className="text-sm font-bold text-purple-800">Scroll to discover your gaps</div>
              <div className="text-xs text-purple-500 mt-0.5">See what the analysis covers before you upload</div>
            </div>
          </div>

          {/* Mobile CTA */}
          <button
            onClick={() => uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-purple-800 transition-colors lg:hidden"
          >
            Analyze My CV
          </button>
        </motion.section>

        {/* ── THE PROBLEM ── */}
        <motion.section
          variants={fadeUp}
          className="space-y-7"
        >
          <div className="space-y-2">
            <div className="section-label">The problem</div>
            <h2 className="font-outfit text-4xl font-black text-slate-900 sm:text-5xl">
              You apply. You wait.<br />
              <span className="text-slate-500 font-semibold">You never find out why.</span>
            </h2>
            <p className="max-w-md text-slate-600 leading-relaxed">
              Most rejections have nothing to do with your qualifications — and everything to do with the gap between your CV and what the role actually needs.
            </p>
          </div>

          <motion.div
            variants={stagger}
            className="grid gap-3"
          >
            {[
              {
                Icon: XCircle,
                iconColor: "text-rose-500",
                accentBorder: "border-l-rose-400",
                title: "Applying blind",
                body: "You send the same CV to every listing without knowing which specific skills or framing are making you fall short.",
              },
              {
                Icon: Search,
                iconColor: "text-amber-500",
                accentBorder: "border-l-amber-400",
                title: "No honest feedback",
                body: "Rejections give you nothing. Generic AI tools give you encouragement — not a real gap analysis against actual job requirements.",
              },
              {
                Icon: Clock,
                iconColor: "text-slate-400",
                accentBorder: "border-l-slate-300",
                title: "Effort without direction",
                body: "You have the experience. The problem is framing — and without a diagnostic, you can't fix what you can't see.",
              },
            ].map(({ Icon, iconColor, accentBorder, title, body }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                className={`rounded-xl border border-slate-200 border-l-4 ${accentBorder} bg-white p-5 shadow-sm`}
              >
                <div className="flex items-start gap-4">
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} aria-hidden="true" />
                  <div>
                    <div className="font-semibold text-slate-900">{title}</div>
                    <div className="mt-1 text-sm leading-relaxed text-slate-500">{body}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* ── WHAT YOU GET (Bento) ── */}
        <motion.section
          variants={fadeUp}
          className="space-y-7"
        >
          <div className="space-y-2">
            <div className="section-label">What you get</div>
            <h2 className="font-outfit text-4xl font-black text-slate-900 sm:text-5xl">
              A diagnostic report,<br />
              <span className="text-purple-700">not just a score.</span>
            </h2>
            <p className="max-w-md text-slate-600 leading-relaxed">
              CVClinic uses Retrieval-Augmented Generation to match your CV against live job listings — then builds a ranked plan of exactly what to change and why.
            </p>
          </div>

          <motion.div
            variants={stagger}
            className="grid grid-cols-2 gap-3"
          >
            {/* Job Match Score — large */}
            <motion.div
              variants={fadeUp}
              className="col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <Target className="h-4 w-4 text-purple-700" aria-hidden="true" />
                  </div>
                  <div className="font-semibold text-slate-900">Job Match Score</div>
                </div>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                  Example output
                </span>
              </div>
              <p className="mb-4 text-sm text-slate-500">
                Exact semantic overlap between your CV and real open roles — not a keyword count.
              </p>
              <div className="space-y-3">
                {[
                  { role: "React Developer", score: 81, colorBar: "bg-purple-600", colorText: "text-purple-700" },
                  { role: "Frontend Developer", score: 74, colorBar: "bg-emerald-500", colorText: "text-emerald-700" },
                  { role: "Full Stack Engineer", score: 58, colorBar: "bg-amber-400", colorText: "text-amber-700" },
                ].map(({ role, score, colorBar, colorText }) => (
                  <div key={role} className="flex items-center gap-3 text-sm">
                    <div className="w-36 shrink-0 text-slate-600">{role}</div>
                    <div className="flex-1 rounded-full bg-slate-100 h-2 overflow-hidden">
                      <motion.div
                        className={`h-2 rounded-full ${colorBar}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                      />
                    </div>
                    <div className={`w-9 text-right text-sm font-bold ${colorText}`}>{score}%</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Skill Gaps */}
            <motion.div variants={fadeUp} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="rounded-lg bg-amber-50 p-2 w-fit mb-3">
                <Search className="h-4 w-4 text-amber-600" aria-hidden="true" />
              </div>
              <div className="font-semibold text-slate-900 mb-1">Skill Gaps</div>
              <div className="text-xs leading-relaxed text-slate-500">
                Missing skills turned into concrete projects you can show employers.
              </div>
            </motion.div>

            {/* CV Fixes */}
            <motion.div variants={fadeUp} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="rounded-lg bg-sky-50 p-2 w-fit mb-3">
                <FileText className="h-4 w-4 text-sky-600" aria-hidden="true" />
              </div>
              <div className="font-semibold text-slate-900 mb-1">CV Fixes</div>
              <div className="text-xs leading-relaxed text-slate-500">
                Specific rewrites for underselling sections — actual edits, not vague advice.
              </div>
            </motion.div>

            {/* Priority Action Plan */}
            <motion.div variants={fadeUp} className="col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="rounded-lg bg-emerald-50 p-2 w-fit">
                  <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                </div>
                <div className="font-semibold text-slate-900">Priority Action Plan</div>
              </div>
              <p className="text-sm text-slate-500 mb-3">
                Ranked next steps ordered by market impact — know what to fix first, not a wall of bullet points.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Add TypeScript projects",
                  "Quantify impact metrics",
                  "Certify AWS basics",
                  "Show CI/CD experience",
                ].map((action, i) => (
                  <span
                    key={action}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                  >
                    <span className="font-bold text-emerald-600">#{i + 1}</span>
                    {action}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* ── HOW IT WORKS ── */}
        <motion.section
          variants={fadeUp}
          className="space-y-7"
        >
          <div className="space-y-2">
            <div className="section-label">How it works</div>
            <h2 className="font-outfit text-4xl font-black text-slate-900 sm:text-5xl">
              Two ways to get<br />
              <span className="text-purple-700">your answer.</span>
            </h2>
            <p className="max-w-md text-slate-600 leading-relaxed">
              Upload your CV and choose how you want to analyse it.
            </p>
          </div>

          <motion.div
            variants={stagger}
            className="space-y-3"
          >
            {/* Step 1 — shared */}
            <motion.div
              variants={fadeUp}
              className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-200 text-sm font-black text-purple-700 bg-purple-50">
                01
              </div>
              <div>
                <div className="font-semibold text-slate-900">Upload your CV</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-500">
                  Drop a PDF or DOCX — up to 10 MB. We extract the text immediately. No account, no email required.
                </div>
              </div>
            </motion.div>

            {/* Fork label */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 px-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">then choose</span>
              <div className="flex-1 h-px bg-slate-200" />
            </motion.div>

            {/* Mode A & B side-by-side */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Mode A — Best Matches */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-xs font-black text-slate-700 bg-slate-50">
                    02
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5 text-purple-600" aria-hidden="true" />
                    <span className="text-sm font-bold text-slate-900">Best Matches</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  We run your CV against our database of live job listings using RAG — and return ranked matches with a full score breakdown.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Ranked job matches", "Skill gap analysis", "Action plan"].map(tag => (
                    <span key={tag} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mode B — Match a Job */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-xs font-black text-slate-700 bg-slate-50">
                    02
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-purple-600" aria-hidden="true" />
                    <span className="text-sm font-bold text-slate-900">Match a Job</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  Found a role on LinkedIn or anywhere else? Paste the job description and we'll score your CV <strong>exclusively against that posting</strong> — nothing else.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Your JD, your rules", "Role-specific gaps", "Targeted advice"].map(tag => (
                    <span key={tag} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Step 3 — shared result */}
            <motion.div
              variants={fadeUp}
              className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 text-sm font-black text-emerald-700 bg-emerald-50">
                03
              </div>
              <div>
                <div className="font-semibold text-slate-900">Get your ranked action plan</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-500">
                  Receive match scores, skill gaps, specific CV edits, and a ranked list of what to fix — tailored to whichever mode you chose.
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

      </motion.div>{/* end left column */}

      {/* ─────────────── RIGHT: Sticky Upload Card ─────────────── */}
      <div
        ref={uploadRef}
        className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        >
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

            <div className="p-6 space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-medium text-slate-500">Ready to analyze</span>
                </div>
                <h2 className="font-outfit text-xl font-black text-slate-900">Analyze your CV</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Get your match score and action plan in seconds.
                </p>
              </div>

              <div className="h-px bg-slate-100" />

              {/* ── Mode toggle ── */}
              <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1">
                <button
                  type="button"
                  id="mode-best-matches"
                  onClick={() => setAnalysisMode("best-matches")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    analysisMode === "best-matches"
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                  Best Matches
                </button>
                <button
                  type="button"
                  id="mode-specific-role"
                  onClick={() => setAnalysisMode("specific-role")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    analysisMode === "specific-role"
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                  Match a Job
                </button>
              </div>

              {/* ── Mode A: Best Matches — target role dropdown ── */}
              {analysisMode === "best-matches" && (
                <div className="space-y-2">
                  <label
                    htmlFor="target-role-select"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    Target Role{" "}
                    <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span>
                  </label>
                  <select
                    id="target-role-select"
                    value={selectedRoleOption}
                    onChange={(e) => handleRoleOptionChange(e.target.value)}
                    disabled={uploading}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    <option value="">-- Defaults to best match --</option>
                    {TARGET_ROLES.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  {selectedRoleOption === "Other (specify below)" && (
                    <input
                      type="text"
                      value={customRoleText}
                      onChange={(e) => handleCustomRoleChange(e.target.value)}
                      placeholder="e.g. Senior iOS Engineer, Cloud Architect…"
                      disabled={uploading}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50 transition-colors"
                    />
                  )}
                </div>
              )}

              {/* ── Mode B: Specific Role — job title + JD textarea ── */}
              {analysisMode === "specific-role" && (
                <div className="space-y-3">
                  {/* Explanation pill */}
                  <div className="rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-xs text-purple-700">
                    Paste a job description and we'll score your CV exclusively against it — no other jobs included.
                  </div>

                  {/* Job title (optional) */}
                  <div>
                    <label
                      htmlFor="jd-job-title"
                      className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      Job Title{" "}
                      <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="jd-job-title"
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior React Developer at Stripe"
                      disabled={uploading}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50 transition-colors"
                    />
                  </div>

                  {/* Job description textarea */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label
                        htmlFor="jd-textarea"
                        className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                      >
                        Job Description <span className="text-rose-500">*</span>
                      </label>
                      <span className={`text-xs tabular-nums ${
                        jobDescription.length > JD_MAX * 0.9 ? "text-amber-600" : "text-slate-400"
                      }`}>
                        {jobDescription.length}/{JD_MAX}
                      </span>
                    </div>
                    <textarea
                      id="jd-textarea"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value.slice(0, JD_MAX))}
                      placeholder="Paste the full job description here — responsibilities, requirements, preferred skills…"
                      rows={7}
                      disabled={uploading}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 disabled:opacity-50 resize-none transition-colors ${
                        jobDescription.trim().length > 0 && jobDescription.trim().length < 30
                          ? "border-amber-300 focus:border-amber-400 focus:ring-amber-300 bg-amber-50/30"
                          : "border-slate-200 focus:border-purple-500 focus:ring-purple-500 bg-white"
                      }`}
                    />
                    {jobDescription.trim().length > 0 && jobDescription.trim().length < 30 && (
                      <p className="mt-1 text-xs text-amber-600">Please paste a more complete job description (at least 30 characters).</p>
                    )}
                  </div>
                </div>
              )}

              {/* File dropzone */}
              <FileDropzone disabled={uploading} onFileSelected={onFileSelected} />

              {/* Preview panel */}
              {filename && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{filename}</div>
                      <div className="mt-0.5 text-xs text-slate-500">Extracted text preview</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      Change
                    </button>
                  </div>

                  <div className="h-px bg-slate-200" />

                  {uploading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  ) : preview ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                          Review before analyzing
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewExpanded((c) => !c)}
                          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          {previewExpanded ? (
                            <><ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> Collapse</>
                          ) : (
                            <><ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> Expand</>
                          )}
                        </button>
                      </div>
                      <pre
                        className={`overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white border border-slate-200 p-3 text-xs leading-relaxed text-slate-600 transition-all ${
                          previewExpanded ? "max-h-64" : "max-h-36"
                        }`}
                        aria-label="Extracted CV text preview"
                      >
                        {preview}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">No preview yet.</div>
                  )}

                  {error && <div className="text-xs text-rose-600">{error}</div>}
                </div>
              )}

              {/* Analyze button */}
              <button
                type="button"
                id="analyze-cv-btn"
                disabled={!file || uploading || !jdIsValid}
                onClick={() => {
                  if (!queueAnalysis()) return;
                  navigate("/analyzing");
                }}
                className="w-full rounded-xl bg-purple-700 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-purple-800 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {uploading
                  ? "Uploading…"
                  : analysisMode === "specific-role"
                  ? "Analyze Against This Job"
                  : "Analyze CV"}
              </button>

              <p className="text-center text-xs text-slate-400">
                Processed securely. Use a redacted CV if you prefer not to share personal data.
              </p>
            </div>
          </div>

          {/* Feature pills below card */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {[
              { label: "Live job data" },
              { label: "AI-powered RAG" },
              { label: "Results in seconds" },
            ].map(({ label }) => (
              <span
                key={label}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm"
              >
                {label}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
