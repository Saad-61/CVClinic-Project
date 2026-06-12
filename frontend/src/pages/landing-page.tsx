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
  Gauge,
} from "lucide-react";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { uploadCv } from "../api/cv";
import { FileDropzone } from "../components/file-dropzone";
import { Skeleton } from "../components/ui/skeleton";
import { useCv } from "../state/cv-context";
import { Combobox } from "../components/ui/combobox";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../components/ui/accordion";
import BlurText from "../components/animations/BlurText";
import ShinyText from "../components/animations/ShinyText";
import SpotlightCard from "../components/animations/SpotlightCard";
import { redactPiiText } from "../lib/utils";
import { Checkbox } from "../components/ui/checkbox";



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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredHowIndex, setHoveredHowIndex] = useState<number | null>(null);
  const {
    file,
    filename,
    preview,
    report,
    startOver,
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
    redactPii,
    setRedactPii,
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

  const comboboxOptions = [
    { value: "", label: "-- Defaults to best match --" },
    ...TARGET_ROLES.map((role) => ({ value: role, label: role })),
  ];

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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3.5 py-1.5 text-xs font-semibold text-zinc-300">
            <ShinyText text="CV Analysis · No account required" speed={4.5} baseColor="#b4b2aa" />
          </div>

          {/* Headline */}
          <h1 className="font-outfit mb-5 text-5xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-6xl xl:text-[4rem] flex flex-col gap-1">
            <BlurText text="Your CV," delay={0} />
            <BlurText text="finally matched" delay={0.15} />
            <span className="flex flex-wrap items-center gap-[0.25em]">
              <BlurText text="to" delay={0.3} />
              <BlurText text="real jobs." className="text-primary font-black" delay={0.35} />
            </span>
          </h1>


          <p className="mb-10 max-w-[440px] text-lg leading-relaxed text-slate-600">
            Upload your CV and get a complete diagnostic — match scores, skill gaps, and a ranked action plan based on live job listings.
          </p>

          {/* Prominent scroll indicator (desktop only) */}
          <div className="hidden lg:inline-flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-6 py-4">
            <div className="flex flex-col items-center gap-0.5">
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}>
                <ChevronDown className="h-6 w-6 text-primary" aria-hidden="true" />
              </motion.div>
              <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.05, repeat: Infinity, ease: 'easeInOut', delay: 0.12 }}>
                <ChevronDown className="h-5 w-5 text-primary" aria-hidden="true" />
              </motion.div>
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-100">Scroll to discover your gaps</div>
              <div className="text-xs text-zinc-400 mt-0.5">See what the analysis covers before you upload</div>
            </div>
          </div>

          {/* Mobile CTA */}
          <button
            onClick={() => uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 hover:shadow-md transition-all lg:hidden"
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
              <span className="text-primary font-black">You never find out why.</span>
            </h2>
            <p className="max-w-md text-slate-600 leading-relaxed">
              Most rejections have nothing to do with your qualifications — and everything to do with the gap between your CV and what the role actually needs.
            </p>
          </div>

          <motion.div
            variants={stagger}
            className="relative space-y-4"
          >
            {[
              {
                accentGlow: "rgba(214, 169, 67, 0.04)",
                title: "Applying blind",
                body: "You send the same CV to every listing without knowing which specific skills or framing are making you fall short.",
              },
              {
                accentGlow: "rgba(214, 169, 67, 0.04)",
                title: "No honest feedback",
                body: "Rejections give you nothing. Generic AI tools give you encouragement — not a real gap analysis against actual job requirements.",
              },
              {
                accentGlow: "rgba(214, 169, 67, 0.04)",
                title: "Effort without direction",
                body: "You have the experience. The problem is framing — and without a diagnostic, you can't fix what you can't see.",
              },
            ].map(({ accentGlow, title, body }, index) => {
              const isHovered = hoveredIndex === index;
              const isAnyHovered = hoveredIndex !== null;
              const isDimmed = isAnyHovered && !isHovered;

              return (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="relative flex gap-6 items-start p-4 rounded-xl transition-all duration-300 group cursor-default overflow-hidden"
                  style={{
                    background: isHovered
                      ? `radial-gradient(500px circle at center, ${accentGlow}, transparent 80%)`
                      : "transparent",
                  }}
                >
                  {/* Timeline bullet (Golden Node) */}
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                    {/* Outer Glow Ring */}
                    <div
                      className={`absolute rounded-full border border-primary/30 transition-all duration-500 pointer-events-none ${isHovered ? "w-8 h-8 opacity-100 scale-100" : "w-0 h-0 opacity-0 scale-50"
                        }`}
                    />
                    {/* Inner Golden Dot */}
                    <div
                      className={`rounded-full transition-all duration-300 ${isHovered
                        ? "w-4 h-4 bg-primary shadow-[0_0_12px_rgba(214,169,67,0.7)]"
                        : "w-3 h-3 bg-primary/35 border border-primary/50"
                        }`}
                    />
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 transition-all duration-300 pr-10 ${isDimmed ? "opacity-35 filter blur-[0.2px]" : "opacity-100"
                      }`}
                  >
                    <div className="flex items-center">
                      <h3
                        className={`font-semibold text-base transition-colors duration-300 ${isHovered ? "text-accent" : "text-slate-700"
                          }`}
                      >
                        {title}
                      </h3>
                    </div>
                    <p
                      className={`mt-1.5 text-sm leading-relaxed transition-colors duration-300 ${isHovered ? "text-slate-600" : "text-slate-500"
                        }`}
                    >
                      {body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
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
              <span className="text-primary font-black">not just a score.</span>
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
              className="col-span-2"
            >
              <div className="h-full p-2">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <Gauge className="h-4.5 w-4.5 text-primary shrink-0" aria-hidden="true" />
                    <span>Job Match Score</span>
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
                    { role: "React Developer", score: 81, colorBar: "bg-emerald-500", colorText: "text-emerald-700" },
                    { role: "Frontend Developer", score: 74, colorBar: "bg-amber-500", colorText: "text-amber-700" },
                    { role: "Full Stack Engineer", score: 58, colorBar: "bg-rose-500", colorText: "text-rose-500" },
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
              </div>
            </motion.div>

            {/* Skill Gaps */}
            <motion.div variants={fadeUp}>
              <div className="h-full p-2">
                <div className="flex items-center gap-2 text-slate-900 font-semibold mb-2">
                  <Search className="h-4.5 w-4.5 text-primary shrink-0" aria-hidden="true" />
                  <span>Skill Gaps</span>
                </div>
                <div className="text-xs leading-relaxed text-slate-500">
                  Missing skills turned into concrete projects you can show employers.
                </div>
              </div>
            </motion.div>

            {/* CV Fixes */}
            <motion.div variants={fadeUp}>
              <div className="h-full p-2">
                <div className="flex items-center gap-2 text-slate-900 font-semibold mb-2">
                  <FileText className="h-4.5 w-4.5 text-primary shrink-0" aria-hidden="true" />
                  <span>CV Fixes</span>
                </div>
                <div className="text-xs leading-relaxed text-slate-500">
                  Specific rewrites for underselling sections — actual edits, not vague advice.
                </div>
              </div>
            </motion.div>

            {/* Priority Action Plan */}
            <motion.div variants={fadeUp} className="col-span-2">
              <div className="h-full p-2">
                <div className="flex items-center gap-2 text-slate-900 font-semibold mb-3">
                  <TrendingUp className="h-4.5 w-4.5 text-primary shrink-0" aria-hidden="true" />
                  <span>Priority Action Plan</span>
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
                      className="inline-flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                    >
                      <span className="font-bold text-accent">#{i + 1}</span>
                      {action}
                    </span>
                  ))}
                </div>
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
              <span className="text-primary font-black">your answer.</span>
            </h2>
            <p className="max-w-md text-slate-600 leading-relaxed">
              Upload your CV and choose how you want to analyse it.
            </p>
          </div>

          <motion.div
            variants={stagger}
            className="relative space-y-4"
          >
            {/* Timeline Track Container */}
            <div className="absolute left-[23px] top-[40px] bottom-[40px] w-0.5 pointer-events-none">
              {/* Background Timeline Track */}
              <div className="w-full h-full bg-zinc-800/40" />

              {/* Glowing Active Progress Line */}
              <motion.div
                className="absolute top-0 left-0 w-full bg-primary origin-top shadow-[0_0_8px_rgba(214,169,67,0.5)]"
                animate={{
                  height: hoveredHowIndex !== null 
                    ? hoveredHowIndex === 0 ? "12%" : hoveredHowIndex === 1 ? "50%" : "100%"
                    : "12%"
                }}
                transition={{ type: "spring", stiffness: 90, damping: 15 }}
              />
            </div>

            {/* Step 1: Upload */}
            <motion.div
              variants={fadeUp}
              onMouseEnter={() => setHoveredHowIndex(0)}
              onMouseLeave={() => setHoveredHowIndex(null)}
              className="relative flex gap-6 items-start p-4 rounded-xl transition-all duration-300 group cursor-default overflow-hidden"
              style={{
                background: hoveredHowIndex === 0
                  ? "radial-gradient(500px circle at center, rgba(214, 169, 67, 0.04), transparent 80%)"
                  : "transparent",
              }}
            >
              {/* Large Background Step Number */}
              <div
                className={`font-outfit absolute right-6 bottom-2 text-7xl font-black transition-all duration-500 select-none pointer-events-none tracking-tight ${
                  hoveredHowIndex === 0
                    ? "text-primary/[0.15] translate-y-[-4px]"
                    : "text-slate-800/[0.04]"
                }`}
              >
                01
              </div>

              {/* Timeline bullet (Golden Node) */}
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                {/* Outer Glow Ring */}
                <div
                  className={`absolute rounded-full border border-primary/30 transition-all duration-500 pointer-events-none ${
                    hoveredHowIndex === 0 ? "w-8 h-8 opacity-100 scale-100" : "w-0 h-0 opacity-0 scale-50"
                  }`}
                />
                {/* Inner Golden Dot */}
                <div
                  className={`rounded-full transition-all duration-300 ${
                    hoveredHowIndex === 0
                      ? "w-4 h-4 bg-primary shadow-[0_0_12px_rgba(214,169,67,0.7)]"
                      : "w-3 h-3 bg-primary/35 border border-primary/50"
                  }`}
                />
              </div>

              {/* Content */}
              <div
                className={`flex-1 transition-all duration-300 pr-10 ${
                  hoveredHowIndex !== null && hoveredHowIndex !== 0 ? "opacity-35 filter blur-[0.2px]" : "opacity-100"
                }`}
              >
                <h3
                  className={`font-semibold text-base transition-colors duration-300 ${
                    hoveredHowIndex === 0 ? "text-accent" : "text-slate-700"
                  }`}
                >
                  Upload your CV
                </h3>
                <p
                  className={`mt-1.5 text-sm leading-relaxed transition-colors duration-300 ${
                    hoveredHowIndex === 0 ? "text-slate-600" : "text-slate-500"
                  }`}
                >
                  Drop a PDF or DOCX — up to 10 MB. We extract the text immediately. No account, no email required.
                </p>
              </div>
            </motion.div>

            {/* Step 2: Choose Mode */}
            <motion.div
              variants={fadeUp}
              onMouseEnter={() => setHoveredHowIndex(1)}
              onMouseLeave={() => setHoveredHowIndex(null)}
              className="relative flex gap-6 items-start p-4 rounded-xl transition-all duration-300 group cursor-default"
              style={{
                background: hoveredHowIndex === 1
                  ? "radial-gradient(500px circle at center, rgba(214, 169, 67, 0.04), transparent 80%)"
                  : "transparent",
              }}
            >
              {/* Large Background Step Number */}
              <div
                className={`font-outfit absolute right-6 top-2 text-7xl font-black transition-all duration-500 select-none pointer-events-none tracking-tight ${
                  hoveredHowIndex === 1
                    ? "text-primary/[0.15] translate-y-[-4px]"
                    : "text-slate-800/[0.04]"
                }`}
              >
                02
              </div>

              {/* Timeline bullet (Golden Node) */}
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                {/* Outer Glow Ring */}
                <div
                  className={`absolute rounded-full border border-primary/30 transition-all duration-500 pointer-events-none ${
                    hoveredHowIndex === 1 ? "w-8 h-8 opacity-100 scale-100" : "w-0 h-0 opacity-0 scale-50"
                  }`}
                />
                {/* Inner Golden Dot */}
                <div
                  className={`rounded-full transition-all duration-300 ${
                    hoveredHowIndex === 1
                      ? "w-4 h-4 bg-primary shadow-[0_0_12px_rgba(214,169,67,0.7)]"
                      : "w-3 h-3 bg-primary/35 border border-primary/50"
                  }`}
                />
              </div>

              {/* Content */}
              <div
                className={`flex-1 transition-all duration-300 ${
                  hoveredHowIndex !== null && hoveredHowIndex !== 1 ? "opacity-35 filter blur-[0.2px]" : "opacity-100"
                }`}
              >
                <h3
                  className={`font-semibold text-base transition-colors duration-300 ${
                    hoveredHowIndex === 1 ? "text-accent" : "text-slate-700"
                  }`}
                >
                  Choose your analysis mode
                </h3>
                <p
                  className={`mt-1.5 text-sm leading-relaxed transition-colors duration-300 ${
                    hoveredHowIndex === 1 ? "text-slate-600" : "text-slate-500"
                  }`}
                >
                  Select the analysis path that matches your current job application strategy.
                </p>

                {/* Mode A & B side-by-side inside timeline step 2 with partition */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 mt-4 relative items-stretch">
                  {/* Mode A — Best Matches */}
                  <div className="space-y-3 p-2">
                    <div className="flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      <span className="text-sm font-bold text-slate-900">Best Matches</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500">
                      We run your CV against our database of live job listings using RAG — and return ranked matches with a full score breakdown.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {["Ranked matches", "Skill gaps", "Action plan"].map(tag => (
                        <span key={tag} className="rounded border border-slate-800 bg-zinc-900/40 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Partition Divider (static highly-curved wavy golden line choice indicator) */}
                  <div className="flex sm:flex-col items-center justify-center py-2 sm:py-0 px-4 sm:px-2">
                    {/* Desktop Divider (Vertical Wave - Static & Thick) */}
                    <div className="hidden sm:flex flex-col items-center h-full relative justify-center py-1 w-10">
                      <svg className="w-10 h-full text-primary/60" viewBox="0 0 40 100" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M20 0 C 52 25, -12 75, 20 100"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeDasharray="4 4"
                        />
                      </svg>
                    </div>

                    {/* Mobile Divider (Horizontal Wave - Static & Thick) */}
                    <div className="flex sm:hidden items-center w-full py-2 justify-center">
                      <svg className="h-10 w-full text-primary/60" viewBox="0 0 100 40" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M0 20 C 25 52, 75 -12, 100 20"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeDasharray="4 4"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Mode B — Match a Job */}
                  <div className="space-y-3 p-2">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      <span className="text-sm font-bold text-slate-900">Match a Job</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500">
                      Found a role on LinkedIn or elsewhere? Paste the job description and we'll score your CV exclusively against that posting.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {["Role-specific", "Targeted gaps", "Custom advice"].map(tag => (
                        <span key={tag} className="rounded border border-slate-800 bg-zinc-900/40 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 3: Get action plan */}
            <motion.div
              variants={fadeUp}
              onMouseEnter={() => setHoveredHowIndex(2)}
              onMouseLeave={() => setHoveredHowIndex(null)}
              className="relative flex gap-6 items-start p-4 rounded-xl transition-all duration-300 group cursor-default overflow-hidden"
              style={{
                background: hoveredHowIndex === 2
                  ? "radial-gradient(500px circle at center, rgba(214, 169, 67, 0.04), transparent 80%)"
                  : "transparent",
              }}
            >
              {/* Large Background Step Number */}
              <div
                className={`font-outfit absolute right-6 bottom-2 text-7xl font-black transition-all duration-500 select-none pointer-events-none tracking-tight ${
                  hoveredHowIndex === 2
                    ? "text-primary/[0.15] translate-y-[-4px]"
                    : "text-slate-800/[0.04]"
                }`}
              >
                03
              </div>

              {/* Timeline bullet (Golden Node) */}
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                {/* Outer Glow Ring */}
                <div
                  className={`absolute rounded-full border border-primary/30 transition-all duration-500 pointer-events-none ${
                    hoveredHowIndex === 2 ? "w-8 h-8 opacity-100 scale-100" : "w-0 h-0 opacity-0 scale-50"
                  }`}
                />
                {/* Inner Golden Dot */}
                <div
                  className={`rounded-full transition-all duration-300 ${
                    hoveredHowIndex === 2
                      ? "w-4 h-4 bg-primary shadow-[0_0_12px_rgba(214,169,67,0.7)]"
                      : "w-3 h-3 bg-primary/35 border border-primary/50"
                  }`}
                />
              </div>

              {/* Content */}
              <div
                className={`flex-1 transition-all duration-300 pr-10 ${
                  hoveredHowIndex !== null && hoveredHowIndex !== 2 ? "opacity-35 filter blur-[0.2px]" : "opacity-100"
                }`}
              >
                <h3
                  className={`font-semibold text-base transition-colors duration-300 ${
                    hoveredHowIndex === 2 ? "text-accent" : "text-slate-700"
                  }`}
                >
                  Get your ranked action plan
                </h3>
                <p
                  className={`mt-1.5 text-sm leading-relaxed transition-colors duration-300 ${
                    hoveredHowIndex === 2 ? "text-slate-600" : "text-slate-500"
                  }`}
                >
                  Receive match scores, skill gaps, specific CV edits, and a ranked list of what to fix — tailored to whichever mode you chose.
                </p>
              </div>
            </motion.div>

          </motion.div>
        </motion.section>

        {/* ── FAQ SECTION ── */}
        <motion.section
          variants={fadeUp}
          className="space-y-7 pt-6"
        >
          <div className="space-y-2">
            <div className="section-label">FAQ</div>
            <h2 className="font-outfit text-4xl font-black text-slate-900 sm:text-5xl">
              Frequently Asked<br />
              <span className="text-primary font-black">Questions</span>
            </h2>
            <p className="max-w-md text-slate-600 leading-relaxed">
              Find quick answers to common questions about CVClinic and how it processes your CV.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full max-w-md">
            <AccordionItem value="matching-logic" className="border-slate-200">
              <AccordionTrigger className="text-base text-white hover:text-primary transition-colors">How does the matching logic work?</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-slate-400">
                We use advanced vector embeddings to capture the semantic meaning of your CV text (including experience, skills, and projects) and compare it directly to live job descriptions. This allows us to calculate an accurate overlap score based on real hiring requirements rather than simple keyword counting.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="privacy" className="border-slate-200">
              <AccordionTrigger className="text-base text-white hover:text-primary transition-colors">Is my resume data kept private?</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-slate-400">
                Yes, absolutely. We extract your resume text locally on your device before sending it for analysis. We process all data securely and do not store your documents permanently on our servers. You can also redact personal contact details like phone numbers and home addresses before uploading if you prefer.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="modes" className="border-slate-200">
              <AccordionTrigger className="text-base text-white hover:text-primary transition-colors">What is the difference between the two modes?</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-slate-400">
                <strong>Best Matches</strong> runs your CV against our entire curated database of open jobs to find the roles you fit best. <strong>Match a Job</strong> allows you to paste any specific job description from external sites (like LinkedIn) to evaluate your CV exclusively against that single role.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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

              {/* ── Mode toggle using Shadcn Tabs ── */}
              <Tabs
                value={analysisMode}
                onValueChange={(val) => setAnalysisMode(val as "best-matches" | "specific-role")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="best-matches" className="flex items-center justify-center gap-1.5 py-2">
                    <Search className="h-3.5 w-3.5" aria-hidden="true" />
                    Best Matches
                  </TabsTrigger>
                  <TabsTrigger value="specific-role" className="flex items-center justify-center gap-1.5 py-2">
                    <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                    Match a Job
                  </TabsTrigger>
                </TabsList>
              </Tabs>

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
                  <Combobox
                    options={comboboxOptions}
                    value={selectedRoleOption}
                    onChange={handleRoleOptionChange}
                    disabled={uploading}
                    placeholder="-- Defaults to best match --"
                    searchable={false}
                  />
                  {selectedRoleOption === "Other (specify below)" && (
                    <input
                      type="text"
                      value={customRoleText}
                      onChange={(e) => handleCustomRoleChange(e.target.value)}
                      placeholder="e.g. Senior iOS Engineer, Cloud Architect…"
                      disabled={uploading}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50 transition-colors"
                    />
                  )}
                </div>
              )}

              {/* ── Mode B: Specific Role — job title + JD textarea ── */}
              {analysisMode === "specific-role" && (
                <div className="space-y-3">
                  {/* Explanation pill */}
                  <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
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
                    <Input
                      id="jd-job-title"
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior React Developer at Stripe"
                      disabled={uploading}
                      className="w-full border-slate-200 h-auto py-2.5"
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
                      <span className={`text-xs tabular-nums ${jobDescription.length > JD_MAX * 0.9 ? "text-amber-600" : "text-slate-400"
                        }`}>
                        {jobDescription.length}/{JD_MAX}
                      </span>
                    </div>
                    <Textarea
                      id="jd-textarea"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value.slice(0, JD_MAX))}
                      placeholder="Paste the full job description here — responsibilities, requirements, preferred skills…"
                      rows={7}
                      disabled={uploading}
                      className={`w-full p-3 resize-none ${jobDescription.trim().length > 0 && jobDescription.trim().length < 30
                        ? "border-amber-300 bg-amber-50/30 focus-visible:ring-amber-300"
                        : "border-slate-200"
                        }`}
                    />
                    {jobDescription.trim().length > 0 && jobDescription.trim().length < 30 && (
                      <p className="mt-1 text-xs text-amber-600">Please paste a more complete job description (at least 30 characters).</p>
                    )}
                  </div>
                </div>
              )}

              {/* File dropzone or Loaded CV Card */}
              {report ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate max-w-[160px] sm:max-w-[200px]">
                          {filename || "Uploaded CV"}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Analysis Ready
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                    >
                      Change CV
                    </button>
                  </div>
                </div>
              ) : (
                <FileDropzone disabled={uploading} onFileSelected={onFileSelected} />
              )}

              {/* Preview panel */}
              {filename && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{filename}</div>
                      <div className="mt-0.5 text-xs text-slate-500">Extracted text preview</div>
                    </div>
                    {!report && (
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-650 hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        Change
                      </button>
                    )}
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
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-4 text-[11px] sm:text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                            Review before analyzing
                          </span>
                          {!report && (
                            <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] sm:text-[11px] font-bold text-primary hover:text-primary/80 transition-colors">
                              <Checkbox
                                checked={redactPii}
                                onCheckedChange={setRedactPii}
                              />
                              <span>Redact PII (Email/Phone)</span>
                            </label>
                          )}
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
                        className={`overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white border border-slate-200 p-3 text-xs leading-relaxed text-slate-600 transition-all ${previewExpanded ? "max-h-64" : "max-h-36"
                          }`}
                        aria-label="Extracted CV text preview"
                      >
                        {redactPii ? redactPiiText(preview) : preview}
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
                disabled={(!report && !file) || uploading || !jdIsValid}
                onClick={() => {
                  if (report) {
                    navigate("/results");
                  } else {
                    if (!queueAnalysis()) return;
                    navigate("/analyzing");
                  }
                }}
                className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-all hover:bg-primary/95 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {uploading
                  ? "Uploading…"
                  : report
                    ? "Review Analysis"
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
                className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs font-medium text-zinc-300 shadow-sm"
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
