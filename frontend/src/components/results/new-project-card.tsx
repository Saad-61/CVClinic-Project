import type { MissingSkill } from "../../types/cv";
import { Badge } from "../ui/badge";

interface NewProjectCardProps {
  skill: MissingSkill;
}

export function NewProjectCard({ skill }: NewProjectCardProps) {
  const getDifficulty = (priority: string) => {
    switch (String(priority).toUpperCase()) {
      case "HIGH":
        return { label: "Advanced", variant: "red" as const };
      case "MEDIUM":
        return { label: "Intermediate", variant: "indigo" as const };
      default:
        return { label: "Beginner", variant: "slate" as const };
    }
  };

  const difficulty = getDifficulty(skill.priority);

  return (
    <div className="rounded-xl border-l-8 border-l-purple-500 border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="indigo" className="font-semibold">
          {skill.skill}
        </Badge>
        <Badge variant={difficulty.variant} className="text-[10px] font-medium">
          {difficulty.label}
        </Badge>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 leading-tight">
          {skill.project || "Skill Starter Project"}
        </h4>
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
          {skill.project_idea}
        </p>
      </div>

      {skill.implementation && (
        <div className="rounded-lg bg-slate-50 p-3 text-xs border border-slate-100">
          <div className="font-semibold text-slate-800 mb-1">How to implement:</div>
          <p className="text-slate-600 leading-relaxed">{skill.implementation}</p>
        </div>
      )}
    </div>
  );
}
