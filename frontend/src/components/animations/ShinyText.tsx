import React from "react";
import { cn } from "../../lib/utils";

interface ShinyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  shimmerColor?: string;
  baseColor?: string;
}

export default function ShinyText({
  text,
  disabled = false,
  speed = 4,
  className,
  shimmerColor = "rgba(255, 255, 255, 1)",
  baseColor = "currentColor",
  ...props
}: ShinyTextProps) {
  return (
    <span
      className={cn(
        "inline-block bg-clip-text text-transparent",
        !disabled && "animate-shine",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(120deg, ${baseColor} 30%, ${shimmerColor} 45%, ${shimmerColor} 55%, ${baseColor} 70%)`,
        backgroundSize: "200% 100%",
        animationDuration: `${speed}s`,
      }}
      {...props}
    >
      {text}
    </span>
  );
}
