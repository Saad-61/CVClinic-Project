import type { MissingSkill } from "../../types/cv";

interface SkillCardProps {
  skill: MissingSkill;
  idx: number;
}

export function SkillCard({ skill }: SkillCardProps) {
  const isNew = String(skill.project_type || "").toLowerCase() === "new";
  const priority = String(skill.priority || "").toUpperCase();

  const getBorderColor = (p: string) => {
    switch (p) {
      case "HIGH":
        return "border-l-8 border-l-red-500/80";
      case "MEDIUM":
        return "border-l-8 border-l-amber-500/80";
      default:
        return "border-l-8 border-l-slate-400/80";
    }
  };

  const borderColor = getBorderColor(priority);

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${borderColor} border-slate-200`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900">{skill.skill}</div>
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
            <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {isNew ? "New project" : "Add to existing"}
            </span>
          </div>
        </div>
        {skill.project ? (
          <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
            {skill.project}
          </span>
        ) : null}
      </div>

      {skill.why || skill.project_idea ? (
        <div className="mt-3 space-y-1 text-[13px] text-slate-600">
          {skill.why && (
            <div>
              <span className="font-semibold text-slate-800">Why:</span> {skill.why}
            </div>
          )}
          {skill.project_idea && (
            <div>
              <span className="font-semibold text-slate-800">How:</span>{" "}
              {skill.project_idea}
            </div>
          )}
          {skill.implementation && (
            <div>
              <span className="font-semibold text-slate-800">Where:</span>{" "}
              {skill.implementation}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
