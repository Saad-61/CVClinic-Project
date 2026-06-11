import type { ProjectImprovement } from "../../types/cv";

interface ProjectImprovementCardProps {
  improvement: ProjectImprovement;
}

export function ProjectImprovementCard({ improvement }: ProjectImprovementCardProps) {
  return (
    <div className="rounded-xl border-l-4 border-l-primary border border-border bg-card p-5 shadow-sm">
      <div className="text-sm font-bold text-white">{improvement.project}</div>
      <div className="mt-2 space-y-1.5 text-[13px] text-white">
        {improvement.current_issue && (
          <div>
            <span className="font-bold text-primary">Issue:</span>{" "}
            {improvement.current_issue}
          </div>
        )}
        {improvement.improvement && (
          <div>
            <span className="font-bold text-primary">Upgrade:</span>{" "}
            {improvement.improvement}
          </div>
        )}
        {improvement.impact && (
          <div>
            <span className="font-bold text-primary">Impact:</span>{" "}
            {improvement.impact}
          </div>
        )}
      </div>
    </div>
  );
}
