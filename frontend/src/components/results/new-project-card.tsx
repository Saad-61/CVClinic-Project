import type { MissingSkill } from "../../types/cv";

interface NewProjectCardProps {
  skill: MissingSkill;
}

export function NewProjectCard({ skill }: NewProjectCardProps) {
  const getDifficulty = (priority: string) => {
    switch (String(priority).toUpperCase()) {
      case "HIGH":
        return { label: "Advanced", variant: "red" as const };
      case "MEDIUM":
        return { label: "Intermediate", variant: "amber" as const };
      default:
        return { label: "Beginner", variant: "slate" as const };
    }
  };

  const difficulty = getDifficulty(skill.priority);

  return (
    <div className="rounded-xl border-l-4 border-l-primary border border-border bg-card p-5 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border bg-zinc-900 border-zinc-800/80 px-2.5 py-0.5 text-xs font-semibold text-zinc-300">
          {skill.skill}
        </span>
        <span className={`rounded-full border bg-zinc-900 border-zinc-800/80 px-2.5 py-0.5 text-[10px] font-semibold ${
          difficulty.variant === "red"
            ? "text-rose-400"
            : difficulty.variant === "amber"
            ? "text-amber-400"
            : "text-zinc-400"
        }`}>
          {difficulty.label}
        </span>
      </div>

      <div>
        <h4 className="text-sm font-bold text-white leading-tight">
          {skill.project || "Skill Starter Project"}
        </h4>
        <p className="mt-1.5 text-xs text-white leading-relaxed">
          {skill.project_idea}
        </p>
      </div>

      {skill.implementation && (
        <div className="text-xs space-y-1">
          <div className="font-bold text-primary">How to implement:</div>
          <p className="text-white leading-relaxed">{skill.implementation}</p>
        </div>
      )}
    </div>
  );
}
