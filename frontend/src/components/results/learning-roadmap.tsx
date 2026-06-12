import { BookOpen } from "lucide-react";
import type { MissingSkill } from "../../types/cv";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface LearningRoadmapProps {
  skills: MissingSkill[];
}

export function LearningRoadmap({ skills }: LearningRoadmapProps) {
  const [activePhase, setActivePhase] = useState(0);

  if (!skills.length) return null;

  const high = skills.filter((s) => String(s.priority).toUpperCase() === "HIGH");
  const medium = skills.filter((s) => String(s.priority).toUpperCase() === "MEDIUM");
  const low = skills.filter((s) => String(s.priority).toUpperCase() === "LOW");

  const phases: {
    label: string;
    subLabel: string;
    color: string;
    bg: string;
    border: string;
    dot: string;
    items: MissingSkill[];
  }[] = [
    {
      label: "Phase 1",
      subLabel: "High Priority",
      color: "text-primary",
      bg: "bg-zinc-900/50",
      border: "border-border",
      dot: "bg-primary",
      items: high,
    },
    {
      label: "Phase 2",
      subLabel: "Medium Priority",
      color: "text-primary",
      bg: "bg-zinc-900/50",
      border: "border-border",
      dot: "bg-primary",
      items: medium,
    },
    {
      label: "Phase 3",
      subLabel: "Lower Priority",
      color: "text-primary",
      bg: "bg-zinc-900/50",
      border: "border-border",
      dot: "bg-primary",
      items: low,
    },
  ].filter((p) => p.items.length > 0);

  if (!phases.length) return null;

  // Ensure activePhase is within bounds if phases filtered down
  const currentPhaseIndex = Math.min(activePhase, phases.length - 1);
  const currentPhase = phases[currentPhaseIndex];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
          <BookOpen className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <div className="font-bold text-white text-base">Learning Roadmap</div>
          <div className="text-xs text-zinc-400">
            Your personalised skill-building path, ordered by market impact
          </div>
        </div>
      </div>

      {/* Horizontal Phase Timeline Stepper */}
      {phases.length > 1 && (
        <div className="relative flex items-center justify-between max-w-md mx-auto mb-8 px-6">
          {/* Connecting Track Line */}
          <div className="absolute left-10 right-10 top-[18px] h-0.5 bg-zinc-800 -translate-y-1/2 z-0">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(currentPhaseIndex / (phases.length - 1)) * 100}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>

          {phases.map((phase, idx) => {
            const isCompletedOrActive = idx <= currentPhaseIndex;
            const isActive = idx === currentPhaseIndex;
            
            return (
              <button
                key={phase.label}
                onClick={() => setActivePhase(idx)}
                className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none group"
              >
                {/* Step Circle Indicator */}
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-350 font-bold text-xs ${
                    isActive
                      ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(214,169,67,0.45)] scale-110"
                      : isCompletedOrActive
                      ? "bg-primary/90 border-primary text-primary-foreground"
                      : "bg-zinc-950 border-zinc-850 text-zinc-500 group-hover:border-zinc-750 group-hover:text-zinc-350"
                  }`}
                >
                  {idx + 1}
                </div>
                {/* Step Text Labels */}
                <div className="flex flex-col items-center text-center">
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider transition-colors duration-300 ${
                      isActive ? "text-primary" : "text-zinc-500 group-hover:text-zinc-400"
                    }`}
                  >
                    {phase.label}
                  </span>
                  <span
                    className={`text-[8px] font-semibold transition-colors duration-300 whitespace-nowrap ${
                      isActive ? "text-zinc-200" : "text-zinc-550"
                    }`}
                  >
                    {phase.subLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Phase Items list with slide-in animation */}
      <div className="overflow-hidden min-h-[120px] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhaseIndex}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="space-y-4"
          >
            {/* Header if only 1 phase is rendered without stepper */}
            {phases.length === 1 && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm">
                  1
                </div>
                <div className="text-sm font-bold text-primary">
                  {currentPhase.label} — {currentPhase.subLabel}
                </div>
              </div>
            )}

            <div className={`space-y-3.5 ${phases.length > 1 ? "border-l-2 border-dashed border-border/60 pl-5 ml-4" : ""}`}>
              {currentPhase.items.map((skill, idx) => {
                const isNew = String(skill.project_type || "").toLowerCase() === "new";
                return (
                  <div
                    key={`${currentPhase.label}-${idx}`}
                    className={`relative rounded-xl border ${currentPhase.border} ${currentPhase.bg} p-4 shadow-sm hover:border-zinc-800 transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="font-semibold text-white text-sm">
                        {skill.skill}
                      </div>
                      <span className="rounded-full bg-zinc-950 border border-zinc-800 px-2 py-0.5 text-[9px] font-bold text-zinc-400 shadow-sm uppercase tracking-wide">
                        {isNew ? "New project" : "Add to existing"}
                      </span>
                    </div>

                    {skill.why && (
                      <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                        <span className="font-bold text-zinc-400">Why: </span>
                        {skill.why}
                      </p>
                    )}

                    {(skill.project || skill.project_idea) && (
                      <div className="mt-3 rounded-lg bg-zinc-950/40 border border-border/50 px-3.5 py-2.5 text-xs text-zinc-200 space-y-1.5">
                        {skill.project && (
                          <div>
                            <span className="font-bold text-primary">Project: </span>
                            {skill.project}
                          </div>
                        )}
                        {skill.project_idea && (
                          <div>
                            <span className="font-bold text-primary">Idea: </span>
                            {skill.project_idea}
                          </div>
                        )}
                        {skill.implementation && (
                          <div className="text-zinc-400 mt-1 leading-relaxed border-t border-border/30 pt-1.5">
                            <span className="font-bold text-primary">How: </span>
                            {skill.implementation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
