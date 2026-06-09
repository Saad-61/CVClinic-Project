import { Compass } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen app-theme-bg">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-card/75 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className={cn("container flex h-14 items-center justify-between")}>
          <div className="flex items-center gap-1.5">
            {/* Redesigned Premium Logo Image */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center">
              <img src="/logo.png?v=2" alt="CVClinic Logo" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-outfit font-extrabold tracking-tight">
                <span className="text-[#af6eeb]">CV</span>
                <span className="text-white">Clinic</span>
              </div>
              <div className="text-xs text-slate-500">AI Resume Diagnostics</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
            Upload · Analyze · Improve
          </div>
        </div>
      </header>
      <main className="container py-10">{children}</main>
    </div>
  );
}
