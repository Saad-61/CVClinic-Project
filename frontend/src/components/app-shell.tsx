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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center mr-1">
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full object-contain"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Document shape with folded top-right corner */}
                <path
                  d="M25 10H60L80 30V85C80 87.7614 77.7614 90 75 90H25C22.2386 90 20 87.7614 20 85V15C20 12.2386 22.2386 10 25 10Z"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                {/* Folded corner */}
                <path
                  d="M60 10V30H80"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                {/* Middle plus symbol in gold */}
                <path
                  d="M50 42V68M37 55H63"
                  stroke="#d6a943"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="text-lg font-outfit font-extrabold tracking-tight">
                <span className="text-primary">CV</span>
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
