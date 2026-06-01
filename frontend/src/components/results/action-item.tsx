import { sectionEmpty } from "../../lib/report-utils";
import type { TopAction } from "../../types/cv";

interface ActionItemProps {
  action: TopAction;
  idx: number;
}

export function ActionItem({ action, idx }: ActionItemProps) {
  return (
    <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-700 text-sm font-bold text-white">
        {idx + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-slate-900">{action.action}</div>
        {!sectionEmpty(action.section) && (
          <div className="mt-0.5 text-xs text-slate-500">{action.section}</div>
        )}
        {action.why || action.how ? (
          <div className="mt-2 space-y-1.5 text-[13px] text-slate-600">
            {action.why && (
              <div>
                <span className="font-semibold text-slate-800">Why:</span> {action.why}
              </div>
            )}
            {action.how && (
              <div>
                <span className="font-semibold text-slate-800">How:</span> {action.how}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
