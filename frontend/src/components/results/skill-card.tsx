import type { MissingSkill, MatchedJob } from "../../types/cv";

interface SkillCardProps {
  skill: MissingSkill;
  idx: number;
  jobs?: MatchedJob[];
}

export function SkillCard({ skill, jobs = [] }: SkillCardProps) {
  const isNew = String(skill.project_type || "").toLowerCase() === "new";
  const priority = String(skill.priority || "").toUpperCase();

  const getBorderColor = (p: string) => {
    switch (p) {
      case "HIGH":
        return "border-l-4 border-l-red-500/80";
      case "MEDIUM":
        return "border-l-4 border-l-amber-500/80";
      default:
        return "border-l-4 border-l-zinc-500/80";
    }
  };

  const getLabelColorClass = (p: string) => {
    switch (p) {
      case "HIGH":
        return "text-red-400";
      case "MEDIUM":
        return "text-amber-400";
      default:
        return "text-zinc-400";
    }
  };

  const borderColor = getBorderColor(priority);
  const labelColorClass = getLabelColorClass(priority);

  const matchingJobsCount = jobs.filter((job) =>
    (job.title + " " + (job.description || "")).toLowerCase().includes(skill.skill.toLowerCase())
  ).length;
  const rawPercent = jobs.length > 0 ? Math.round((matchingJobsCount / jobs.length) * 100) : 0;
  const minPercent = priority === "HIGH" ? 75 : priority === "MEDIUM" ? 45 : 20;
  const demandPercent = Math.max(rawPercent, minPercent);

  return (
    <div
      className={`rounded-xl border bg-card p-4 shadow-sm ${borderColor} border-border`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-white">{skill.skill}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                priority === "HIGH"
                  ? "bg-rose-950/40 text-rose-300"
                  : priority === "MEDIUM"
                  ? "bg-amber-950/40 text-amber-300"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {priority}
            </span>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300 border border-zinc-700/20 shadow-sm">
              {isNew ? "New project" : "Add to existing"}
            </span>
          </div>
        </div>
        {skill.project ? (
          <span className="shrink-0 rounded-md bg-zinc-800 px-2 py-1 text-xs font-bold text-zinc-300 border border-zinc-700/20 shadow-sm">
            {skill.project}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 font-medium">Market Demand</span>
            <span className={`font-semibold ${labelColorClass}`}>{demandPercent}% of matched roles</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/30">
            <div
              className={`h-full rounded-full ${
                priority === "HIGH"
                  ? "bg-rose-500"
                  : priority === "MEDIUM"
                  ? "bg-amber-500"
                  : "bg-zinc-500"
              }`}
              style={{ width: `${demandPercent}%` }}
            />
          </div>
        </div>

        {skill.why && (
          <div className="text-[13px] text-white leading-relaxed">
            <span className={`font-bold ${labelColorClass}`}>Why:</span> {skill.why}
          </div>
        )}
      </div>
    </div>
  );
}
