import { Compass } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAnalyzing = location.pathname === "/analyzing";

  const handleLogoClick = () => {
    if (isAnalyzing) return;
    if (location.pathname === "/") {
      // Manual smooth-scroll loop using requestAnimationFrame for perfect smoothness
      const scroll = () => {
        const current = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (current > 0) {
          const step = Math.max(15, current / 8);
          window.scrollTo(0, current - step);
          document.documentElement.scrollTo(0, current - step);
          document.body.scrollTo(0, current - step);
          requestAnimationFrame(scroll);
        }
      };
      scroll();
    } else {
      navigate("/");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        document.documentElement.scrollTo({ top: 0, behavior: "instant" });
      }, 0);
    }
  };

  return (
    <div className="min-h-screen app-theme-bg">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-card/75 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className={cn("container flex h-14 items-center justify-between")}>
          <div
            onClick={handleLogoClick}
            className={cn(
              "flex items-center gap-1.5 transition-all duration-200",
              isAnalyzing
                ? "cursor-default"
                : "cursor-pointer select-none group hover:opacity-90 active:scale-[0.98]"
            )}
          >
            {/* Redesigned Premium Logo Image */}
            <div className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center mr-1 transition-transform duration-300",
              !isAnalyzing && "group-hover:scale-105"
            )}>
              <img
                src="/logo.svg"
                alt="CVClinic Logo"
                className="h-full w-full object-contain"
                draggable={false}
              />
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
