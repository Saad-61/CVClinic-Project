import type { MissingSkill, MatchedJob } from "../../types/cv";
import SpotlightCard from "../animations/SpotlightCard";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ExternalLink } from "lucide-react";
import { safeUrlLabel } from "../../lib/utils";

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

  const getSpotlightColor = (p: string) => {
    switch (p) {
      case "HIGH":
        return "rgba(244, 63, 94, 0.12)";
      case "MEDIUM":
        return "rgba(245, 158, 11, 0.12)";
      default:
        return "rgba(113, 113, 122, 0.12)";
    }
  };

  return (
    <SpotlightCard
      className={`rounded-xl border bg-card p-4 shadow-sm ${borderColor} border-border`}
      spotlightColor={getSpotlightColor(priority)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-white">{skill.skill}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-semibold bg-zinc-900 border-zinc-800/80 ${
                priority === "HIGH"
                  ? "text-rose-400"
                  : priority === "MEDIUM"
                  ? "text-amber-400"
                  : "text-zinc-400"
              }`}
            >
              {priority}
            </span>
            <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-zinc-300 border border-zinc-800/80 shadow-sm">
              {isNew ? "New project" : "Add to existing"}
            </span>
          </div>
        </div>
        {skill.project ? (
          <span className="shrink-0 rounded-md bg-zinc-900 px-2 py-1 text-xs font-bold text-zinc-300 border border-zinc-800/80 shadow-sm">
            {skill.project}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-zinc-400 font-medium cursor-help select-none hover:text-zinc-300 transition-colors">
                  Market Demand
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-950 border border-zinc-800 text-zinc-200 max-w-[200px] shadow-xl p-2 text-xs">
                Percentage of matched job listings that require this skill.
              </TooltipContent>
            </Tooltip>
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

        {/* Learn this skill resources */}
        {(() => {
          const list = skill.learn_at || [];
          const urls = list.length > 0 ? list : (() => {
            const parsedUrls: string[] = [];
            const urlRegex = /(https?:\/\/[^\s\)]+)/g;
            const matches = skill.implementation?.match(urlRegex);
            if (matches) {
              matches.forEach(url => {
                if (!parsedUrls.includes(url)) parsedUrls.push(url);
              });
            }
            return parsedUrls;
          })();

          if (urls.length === 0) return null;

          return (
            <div className="mt-3 pt-3 border-t border-zinc-800/60 space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Learn this skill
              </div>
              <div className="flex flex-wrap gap-1.5">
                {urls.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 px-2 py-0.5 text-xs text-zinc-300 transition-colors"
                  >
                    <span>{safeUrlLabel(link)}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </SpotlightCard>
  );
}
