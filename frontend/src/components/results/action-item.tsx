import { sectionEmpty } from "../../lib/report-utils";
import type { TopAction } from "../../types/cv";

interface ActionItemProps {
  action: TopAction;
  idx: number;
}

export function ActionItem({ action, idx }: ActionItemProps) {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {idx + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-white">{action.action}</div>
        {!sectionEmpty(action.section) && (
          <div className="mt-0.5 text-xs text-zinc-400">{action.section}</div>
        )}
        {action.why || action.how ? (
          <div className="mt-2 space-y-1.5 text-[13px] text-zinc-300">
            {action.why && (
              <div>
                <span className="font-semibold text-zinc-200">Why:</span> {action.why}
              </div>
            )}
            {action.how && (
              <div>
                <span className="font-semibold text-zinc-200">How:</span> {action.how}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
