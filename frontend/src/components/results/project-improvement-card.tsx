import type { ProjectImprovement } from "../../types/cv";

interface ProjectImprovementCardProps {
  improvement: ProjectImprovement;
}

export function ProjectImprovementCard({ improvement }: ProjectImprovementCardProps) {
  return (
    <div className="rounded-xl border-l-8 border-l-green-500 border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-bold text-slate-900">{improvement.project}</div>
      <div className="mt-2 space-y-1.5 text-[13px] text-slate-600">
        {improvement.current_issue && (
          <div>
            <span className="font-semibold text-slate-800">Issue:</span>{" "}
            {improvement.current_issue}
          </div>
        )}
        {improvement.improvement && (
          <div>
            <span className="font-semibold text-slate-800">Upgrade:</span>{" "}
            {improvement.improvement}
          </div>
        )}
        {improvement.impact && (
          <div>
            <span className="font-semibold text-slate-800">Impact:</span>{" "}
            {improvement.impact}
          </div>
        )}
      </div>
    </div>
  );
}
