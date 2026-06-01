import type { AnalyzeResponse, QuickRewriteCandidate } from "../types/cv";

export function priorityWeight(priority: string): number {
  const p = String(priority || "").toUpperCase();
  if (p === "HIGH") return 3;
  if (p === "MEDIUM") return 2;
  if (p === "LOW") return 1;
  return 0;
}

export function sectionEmpty(text: string | undefined): boolean {
  return !text || !text.trim();
}

export function isInstantRewriteSection(section: string): boolean {
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

export function buildQuickRewriteCandidates(
  report: AnalyzeResponse
): QuickRewriteCandidate[] {
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
