import { BookOpen, ArrowRight, Circle } from "lucide-react";
import type { MissingSkill } from "../../types/cv";

interface LearningRoadmapProps {
  skills: MissingSkill[];
}

export function LearningRoadmap({ skills }: LearningRoadmapProps) {
  if (!skills.length) return null;

  const high = skills.filter((s) => String(s.priority).toUpperCase() === "HIGH");
  const medium = skills.filter((s) => String(s.priority).toUpperCase() === "MEDIUM");
  const low = skills.filter((s) => String(s.priority).toUpperCase() === "LOW");

  const phases: {
    label: string;
    color: string;
    bg: string;
    border: string;
    dot: string;
    items: MissingSkill[];
  }[] = [
    {
      label: "Phase 1 — High Priority",
      color: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
      dot: "bg-red-500",
      items: high,
    },
    {
      label: "Phase 2 — Medium Priority",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      dot: "bg-amber-500",
      items: medium,
    },
    {
      label: "Phase 3 — Lower Priority",
      color: "text-slate-600",
      bg: "bg-slate-50",
      border: "border-slate-200",
      dot: "bg-slate-400",
      items: low,
    },
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
          <div className="text-xs text-slate-500">
            Your personalised skill-building path, ordered by market impact
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {phases.map((phase, phaseIdx) => (
          <div key={phase.label}>
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${phase.dot} text-white text-xs font-bold shadow-sm`}
              >
                {phaseIdx + 1}
              </div>
              <div className={`text-sm font-bold ${phase.color}`}>{phase.label}</div>
              {phaseIdx < phases.length - 1 && (
                <div className="ml-auto">
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
              )}
            </div>

            <div className="ml-3.5 border-l-2 border-dashed border-slate-200 pl-5 space-y-3">
              {phase.items.map((skill, idx) => {
                const isNew =
                  String(skill.project_type || "").toLowerCase() === "new";
                return (
                  <div
                    key={`${phase.label}-${idx}`}
                    className={`relative rounded-xl border ${phase.border} ${phase.bg} p-3.5`}
                  >
                    <div
                      className={`absolute -left-[23px] top-4 h-3 w-3 rounded-full ${phase.dot} border-2 border-white shadow-sm`}
                    />
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="font-semibold text-slate-900 text-sm">
                        {skill.skill}
                      </div>
                      <div className="flex gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            isNew
                              ? "bg-violet-100 text-violet-700 border border-violet-200"
                              : "bg-amber-100 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isNew ? "New project" : "Add to existing"}
                        </span>
                      </div>
                    </div>

                    {skill.why && (
                      <p className="mt-1.5 text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">Why: </span>
                        {skill.why}
                      </p>
                    )}

                    {(skill.project || skill.project_idea) && (
                      <div className="mt-2 rounded-lg bg-white/80 border border-white px-3 py-2 text-xs text-slate-700">
                        {skill.project && (
                          <div>
                            <span className="font-semibold text-purple-700">
                              Project:{" "}
                            </span>
                            {skill.project}
                          </div>
                        )}
                        {skill.project_idea && (
                          <div className="mt-0.5">
                            <span className="font-semibold text-slate-800">
                              Idea:{" "}
                            </span>
                            {skill.project_idea}
                          </div>
                        )}
                        {skill.implementation && (
                          <div className="mt-0.5">
                            <span className="font-semibold text-slate-800">
                              How:{" "}
                            </span>
                            {skill.implementation}
                          </div>
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
    </div>
  );
}
