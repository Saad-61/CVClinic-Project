import { Compass } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen app-wash">
      <header className="sticky top-0 z-20 border-b border-purple-200/60 bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className={cn("container flex h-14 items-center justify-between")}>
          <div className="flex items-center gap-2.5">
            {/* Logo mark — Custom CVClinic Logo */}
            <img src="/logo.png" alt="CVClinic Logo" className="h-8 w-8 rounded-lg object-contain bg-white border border-slate-100 shadow-sm" />
            <div className="leading-tight">
              <div className="text-sm font-outfit font-bold tracking-tight text-slate-900">
                CVClinic
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
