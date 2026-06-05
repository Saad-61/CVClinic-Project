export type UploadPreviewResponse = {
  filename: string;
  preview: string;
};

export type MatchedJob = {
  id: number | string;
  title: string;
  description: string;
  url?: string;
  company_name?: string;
  location?: string;
  source?: string;
  score?: number;
  overlap?: number;
  matched_skills?: string[];
  priority?: number;
};

export type AnalysisJobMatch = {
  title: string;
  score: number;
  reason: string;
  evidence: string;
  gap: string;
};

export type MissingSkill = {
  skill: string;
  priority: "HIGH" | "MEDIUM" | "LOW" | string;
  why: string;
  project_type: "existing" | "new" | string;
  project: string;
  project_idea: string;
  implementation: string;
  evidence: string;
};

export type ProjectImprovement = {
  project: string;
  current_issue: string;
  improvement: string;
  impact: string;
};

export type CvFix = {
  section: string;
  fix: string;
  why: string;
  how: string;
};

export type QuickRewriteCandidate = {
  section: string;
  fix: string;
  why: string;
  how: string;
  source: "cv_fix" | "top_action";
};

export type TopAction = {
  action: string;
  section: string;
  why: string;
  how: string;
};

export type ConfidenceMap = Partial<
  Record<
    "job_matches" | "missing_skills" | "project_improvements" | "cv_fixes" | "top_actions",
    "high" | "medium" | "low" | string
  >
>;

export type Analysis = {
  inferred_role?: string;
  job_matches?: AnalysisJobMatch[];
  missing_skills?: MissingSkill[];
  project_improvements?: ProjectImprovement[];
  cv_fixes?: CvFix[];
  top_actions?: TopAction[];
  confidence?: ConfidenceMap;
  error?: string;
};

export type AnalyzeResponse = {
  matched_jobs: MatchedJob[];
  all_jobs?: MatchedJob[];
  links: string[];
  analysis: Analysis;
  cv_text: string;
  resume_score?: number;
  jooble_configured?: boolean;
  target_role?: string;
  is_jd_mode?: boolean;
  jd_job_title?: string;
};

export type StoredReport = {
  filename: string;
  createdAt: string;
  report: AnalyzeResponse;
};

export type GenerateFixRewriteRequest = {
  cv_text: string;
  fix: Pick<CvFix, "section" | "fix" | "why" | "how">;
  output_format: "plain" | "latex";
};

export type GenerateFixRewriteResponse = {
  section: string;
  format: "plain" | "latex" | string;
  rewritten_text: string;
  notes?: string;
};

export type GenerateCoverLetterRequest = {
  cv_text: string;
  job: Pick<
    MatchedJob,
    | "title"
    | "description"
    | "company_name"
    | "location"
    | "source"
    | "url"
    | "matched_skills"
    | "score"
  >;
  tone?: "professional" | "friendly" | "confident" | string;
};

export type GenerateCoverLetterResponse = {
  job_title: string;
  company_name?: string;
  cover_letter: string;
  notes?: string;
};
