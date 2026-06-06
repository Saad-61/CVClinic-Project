import { Compass } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen app-wash">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-card/75 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className={cn("container flex h-14 items-center justify-between")}>
          <div className="flex items-center gap-2.5">
            {/* Redesigned SVG Logo Mark for Dark Mode */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-950/30 border border-purple-800/40 p-1.5 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full text-slate-100">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="17" x2="12" y2="11" className="text-purple-400 stroke-[2.5]" />
                <line x1="9" y1="14" x2="15" y2="14" className="text-purple-400 stroke-[2.5]" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="text-lg font-outfit font-extrabold tracking-tight">
                <span className="text-purple-700">CV</span>
                <span className="text-white">Clinic</span>
              </div>
              <div className="text-xs text-slate-500">AI-powered CV analysis</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 bg-purple-50 border border-purple-100 rounded-full px-3 py-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1" />
            Upload · Analyze · Improve
          </div>
        </div>
      </header>
      <main className="container py-10">{children}</main>
    </div>
  );
}
