import {
  ChevronDown,
  ChevronUp,
  FileText,
  Briefcase,
  ListTodo,
  FileCheck,
} from "lucide-react";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { uploadCv } from "../api/cv";
import { FileDropzone } from "../components/file-dropzone";
import { SectionHeader } from "../components/section-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
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

export default function LandingPage() {
  const navigate = useNavigate();
  const { file, filename, preview, setFile, setPreview, queueAnalysis, targetRole, setTargetRole } = useCv();
  const [uploading, setUploading] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

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
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* ── Left column ── */}
      <div className="space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-6 shadow-sm sm:p-8">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-purple-100 via-violet-50 to-fuchsia-50 opacity-80" />
          <div className="relative space-y-4">
            <Badge variant="indigo" className="w-fit">
              CV Analyzer
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Turn your CV into a job-fit report
              </h1>
              <p className="text-base leading-relaxed text-slate-600 max-w-md">
                Upload once — get match scores, skill gaps, and a prioritised action
                plan in seconds.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/80 bg-white/90 p-3.5">
                <Briefcase className="h-4 w-4 text-purple-600" aria-hidden="true" />
                <div className="mt-2.5 text-sm font-semibold text-slate-900">
                  Job-fit scores
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Instant match % against real roles.
                </div>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/90 p-3.5">
                <ListTodo className="h-4 w-4 text-purple-600" aria-hidden="true" />
                <div className="mt-2.5 text-sm font-semibold text-slate-900">
                  Next actions
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Concrete steps, not vague tips.
                </div>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/90 p-3.5">
                <FileCheck className="h-4 w-4 text-purple-600" aria-hidden="true" />
                <div className="mt-2.5 text-sm font-semibold text-slate-900">
                  Clean output
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Prioritised, not a wall of text.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <SectionHeader title="How it works" description="Three steps, no setup." />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { step: "01", title: "Upload", body: "PDF or DOCX, up to 10 MB." },
              { step: "02", title: "Preview", body: "Confirm the extracted text." },
              { step: "03", title: "Analyze", body: "Get scores, gaps, actions." },
            ].map(({ step, title, body }) => (
              <div key={step} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium text-slate-400">Step {step}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{title}</div>
                <div className="mt-0.5 text-xs text-slate-500">{body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* What you get + Score guide */}
        <div className="grid gap-4 md:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <SectionHeader title="What you'll get" description="A report built for action." />
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {[
                { title: "Match score", body: "How closely your CV overlaps with a role." },
                { title: "Skill gaps", body: "Missing areas turned into project ideas." },
                { title: "CV fixes", body: "Specific edits for underselling sections." },
                { title: "Top actions", body: "The fastest changes to improve your profile." },
              ].map(({ title, body }) => (
                <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="text-sm font-semibold text-slate-900">{title}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <SectionHeader
              title="Reading scores"
              description="Match signals, not hiring probabilities."
            />
            <div className="mt-4 space-y-2.5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                <div className="text-sm font-semibold text-emerald-900">Above 50</div>
                <div className="mt-0.5 text-xs text-emerald-700">
                  Strong overlap with the role.
                </div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <div className="text-sm font-semibold text-amber-900">40 – 50</div>
                <div className="mt-0.5 text-xs text-amber-700">
                  Partial fit. Missing key proof or skills.
                </div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5">
                <div className="text-sm font-semibold text-rose-900">Below 40</div>
                <div className="mt-0.5 text-xs text-rose-700">
                  Lower overlap. Useful to explore.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right column: Upload card ── */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Upload your CV</CardTitle>
              <CardDescription>
                We'll show the extracted text first, then run the full analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="target-role-select" className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Target Career Role (Optional)
                </label>
                <select
                  id="target-role-select"
                  value={selectedRoleOption}
                  onChange={(e) => handleRoleOptionChange(e.target.value)}
                  disabled={uploading}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                >
                  <option value="">-- Select Target Role (Defaults to best match) --</option>
                  {TARGET_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>

                {selectedRoleOption === "Other (specify below)" && (
                  <input
                    type="text"
                    value={customRoleText}
                    onChange={(e) => handleCustomRoleChange(e.target.value)}
                    placeholder="e.g. Senior iOS Engineer, Cloud Architect..."
                    disabled={uploading}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  />
                )}
              </div>

              <FileDropzone disabled={uploading} onFileSelected={onFileSelected} />

              {filename ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {filename}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Extracted text preview.
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      Change file
                    </Button>
                  </div>

                  <Separator className="my-4" />

                  {uploading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : preview ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <FileText className="h-4 w-4" aria-hidden="true" />
                          Scroll to review before analysis.
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewExpanded((c) => !c)}
                        >
                          {previewExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4" /> Collapse
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" /> Expand
                            </>
                          )}
                        </Button>
                      </div>
                      <pre
                        className={`overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 ${
                          previewExpanded ? "max-h-[32rem]" : "max-h-64"
                        }`}
                        aria-label="Extracted CV text preview"
                      >
                        {preview}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      No preview yet. Re-upload if needed.
                    </div>
                  )}

                  {error ? (
                    <div className="mt-3 text-sm text-rose-700">{error}</div>
                  ) : null}
                </div>
              ) : null}

              <Button
                type="button"
                className="w-full"
                disabled={!file || uploading}
                onClick={() => {
                  if (!queueAnalysis()) return;
                  navigate("/analyzing");
                }}
              >
                Analyze CV
              </Button>

              <p className="text-xs leading-relaxed text-slate-400">
                Your file is sent to the backend for analysis. Use a redacted CV if
                you'd prefer not to share personal data.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
