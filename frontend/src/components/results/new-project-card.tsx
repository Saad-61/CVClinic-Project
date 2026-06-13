import type { MissingSkill } from "../../types/cv";
import { Clock, ExternalLink, Milestone } from "lucide-react";
import { safeUrlLabel } from "../../lib/utils";

interface NewProjectCardProps {
  skill: MissingSkill;
}

export function NewProjectCard({ skill }: NewProjectCardProps) {
  const isNew = String(skill.project_type || "").toLowerCase() === "new";
  const priority = String(skill.priority || "").toUpperCase();

  const getDifficulty = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return { label: "Advanced", color: "text-rose-400 border-rose-500/30 bg-zinc-900" };
      case "MEDIUM":
        return { label: "Intermediate", color: "text-amber-400 border-amber-500/30 bg-zinc-900" };
      default:
        return { label: "Beginner", color: "text-zinc-400 border-zinc-700/30 bg-zinc-900" };
    }
  };

  const difficulty = getDifficulty(priority);

  // Extract resources from implementation text as fallback if learn_at is not present
  const getResources = () => {
    const list = skill.learn_at || [];
    if (list.length > 0) return list;
    
    // Fallback: parse implementation text for URLs
    const urls: string[] = [];
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    const matches = skill.implementation?.match(urlRegex);
    if (matches) {
      matches.forEach(url => {
        if (!urls.includes(url)) urls.push(url);
      });
    }
    return urls;
  };

  const resources = getResources();

  // Extract implementation text without the resources section to avoid double rendering
  const getCleanImplementation = () => {
    const text = skill.implementation || "";
    const idx = text.indexOf("Resources:");
    if (idx !== -1) {
      return text.substring(0, idx).trim();
    }
    return text;
  };

  const cleanImplementation = getCleanImplementation();

  return (
    <div className="rounded-xl border-l-4 border-l-primary border border-border bg-card p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/40 pb-3">
        <span className="rounded-full border bg-zinc-900 border-zinc-800/80 px-2.5 py-0.5 text-xs font-semibold text-zinc-300">
          {skill.skill}
        </span>
        <div className="flex items-center gap-2">
          {isNew ? (
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${difficulty.color}`}>
              {difficulty.label}
            </span>
          ) : (
            <span className="rounded-full border border-zinc-800/80 bg-zinc-900 px-2.5 py-0.5 text-[10px] font-semibold text-primary-light">
              Add to existing
            </span>
          )}
          
          <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 bg-zinc-900/60 px-2.5 py-0.5 rounded-full border border-zinc-800/50">
            <Clock className="w-3 h-3 text-zinc-400" />
            {skill.estimated_hours && skill.estimated_hours > 0 ? (
              `~${skill.estimated_hours}h`
            ) : (
              priority === "HIGH" ? "2-4 weeks" : priority === "MEDIUM" ? "1-2 weeks" : "3-5 days"
            )}
          </span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-white leading-tight">
          {skill.project || "Skill Starter Project"}
        </h4>
        <p className="mt-1.5 text-xs text-white leading-relaxed">
          {skill.project_idea}
        </p>
      </div>

      {/* Tech Stack Chips */}
      {skill.tech_stack && skill.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {skill.tech_stack.map((tech) => (
            <span key={tech} className="rounded-full bg-zinc-900 border border-zinc-800/80 px-2.5 py-0.5 text-[10px] font-bold text-zinc-300 shadow-sm">
              {tech}
            </span>
          ))}
        </div>
      )}

      {cleanImplementation && (
        <div className="text-xs space-y-1">
          <div className="font-bold text-primary">How to implement:</div>
          <p className="text-white leading-relaxed whitespace-pre-line">{cleanImplementation}</p>
        </div>
      )}

      {/* Build Milestones for New Projects */}
      {isNew && (skill.milestone_1 || skill.milestone_2 || skill.milestone_3) && (
        <div className="space-y-3 border-t border-zinc-800/60 pt-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Milestone className="w-3.5 h-3.5 text-primary" />
            Build Milestones
          </div>
          <div className="relative pl-5 border-l-2 border-zinc-800/80 space-y-4 ml-2 mt-2 pb-1 text-xs">
            {skill.milestone_1 && (
              <div className="relative">
                <span className="absolute -left-[25px] top-1 flex h-2 w-2 rounded-full bg-[#d6a943] ring-4 ring-card" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-light">Phase 1: Setup & Scaffold</span>
                  <p className="text-zinc-200 leading-normal font-medium">{skill.milestone_1}</p>
                </div>
              </div>
            )}
            {skill.milestone_2 && (
              <div className="relative">
                <span className="absolute -left-[25px] top-1 flex h-2 w-2 rounded-full bg-[#d6a943] ring-4 ring-card" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-light/80">Phase 2: Core Build</span>
                  <p className="text-zinc-200 leading-normal font-medium">{skill.milestone_2}</p>
                </div>
              </div>
            )}
            {skill.milestone_3 && (
              <div className="relative">
                <span className="absolute -left-[25px] top-1 flex h-2 w-2 rounded-full bg-[#d6a943] ring-4 ring-card" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Phase 3: Deploy & Polish</span>
                  <p className="text-zinc-200 leading-normal font-medium">{skill.milestone_3}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resources Links */}
      {resources.length > 0 && (
        <div className="space-y-1.5 border-t border-zinc-800/60 pt-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Resources
          </div>
          <div className="flex flex-wrap gap-2">
            {resources.map((link) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 px-2 py-1 text-[11px] text-zinc-300 transition-colors"
              >
                <span>{safeUrlLabel(link)}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
