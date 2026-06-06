import { BookOpen } from "lucide-react";
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
      color: "text-rose-400",
      bg: "bg-slate-200",
      border: "border-border",
      dot: "bg-rose-500",
      items: high,
    },
    {
      label: "Phase 2 — Medium Priority",
      color: "text-amber-400",
      bg: "bg-slate-200",
      border: "border-border",
      dot: "bg-amber-500",
      items: medium,
    },
    {
      label: "Phase 3 — Lower Priority",
      color: "text-slate-300",
      bg: "bg-slate-200",
      border: "border-border",
      dot: "bg-slate-500",
      items: low,
    },
  ].filter((p) => p.items.length > 0);

  if (!phases.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-700 shadow-sm">
          <BookOpen className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="font-bold text-white text-base">Learning Roadmap</div>
          <div className="text-xs text-slate-600">
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
            </div>

            <div className="ml-3.5 border-l-2 border-dashed border-slate-800 pl-5 space-y-3">
              {phase.items.map((skill, idx) => {
                const isNew =
                  String(skill.project_type || "").toLowerCase() === "new";
                return (
                  <div
                    key={`${phase.label}-${idx}`}
                    className={`relative rounded-xl border ${phase.border} ${phase.bg} p-3.5`}
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="font-semibold text-white text-sm">
                        {skill.skill}
                      </div>
                      <div className="flex gap-1.5">
                        <span
                          className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-black border border-slate-700/20 shadow-sm uppercase tracking-wide"
                        >
                          {isNew ? "New project" : "Add to existing"}
                        </span>
                      </div>
                    </div>

                    {skill.why && (
                      <p className="mt-1.5 text-sm text-white">
                        <span className="font-bold text-slate-200">Why: </span>
                        {skill.why}
                      </p>
                    )}

                    {(skill.project || skill.project_idea) && (
                      <div className="mt-2 rounded-lg bg-slate-100 border border-slate-700/20 px-3 py-2 text-sm text-white">
                        {skill.project && (
                          <div>
                            <span className={`font-bold ${phase.color}`}>
                              Project:{" "}
                            </span>
                            {skill.project}
                          </div>
                        )}
                        {skill.project_idea && (
                          <div className="mt-0.5">
                            <span className={`font-bold ${phase.color}`}>
                              Idea:{" "}
                            </span>
                            {skill.project_idea}
                          </div>
                        )}
                        {skill.implementation && (
                          <div className="mt-0.5">
                            <span className={`font-bold ${phase.color}`}>
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
