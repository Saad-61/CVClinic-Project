import React from "react";
import { cn } from "../../lib/utils";

interface AuroraProps extends React.HTMLAttributes<HTMLDivElement> {
  colorStops?: string[];
  className?: string;
}

export default function Aurora({
  colorStops = [
    "rgba(182, 171, 255, 0.12)", // Lavender accent
    "rgba(214, 169, 67, 0.08)",  // Muted Rich Gold
    "rgba(158, 89, 217, 0.08)"   // Eminence Purple accent
  ],
  className,
  ...props
}: AuroraProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-40",
        className
      )}
      {...props}
    >
      {/* Soft floating gradient circles */}
      <div
        className="absolute top-[-15%] left-[-10%] w-[70%] rounded-full mix-blend-screen filter blur-[90px] opacity-70 animate-blob1"
        style={{
          background: colorStops[0],
          animationDuration: "25s",
          aspectRatio: "1 / 1",
          height: "auto",
        }}
      />
      <div
        className="absolute top-[20%] right-[-15%] w-[60%] rounded-full mix-blend-screen filter blur-[100px] opacity-65 animate-blob2"
        style={{
          background: colorStops[1],
          animationDuration: "30s",
          aspectRatio: "1 / 1",
          height: "auto",
        }}
      />
      <div
        className="absolute bottom-[-15%] left-[20%] w-[65%] rounded-full mix-blend-screen filter blur-[110px] opacity-55 animate-blob3"
        style={{
          background: colorStops[2],
          animationDuration: "28s",
          aspectRatio: "1 / 1",
          height: "auto",
        }}
      />
    </div>
  );
}
