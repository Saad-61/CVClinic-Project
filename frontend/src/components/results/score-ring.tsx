import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

function getScoreColor(score: number): string {
  if (score >= 75) return "hsl(142 71% 45%)"; // green — Strong/Excellent
  if (score >= 55) return "hsl(38 92% 50%)";  // amber — Good
  if (score >= 35) return "hsl(25 95% 53%)";  // orange — Fair
  return "hsl(0 72% 51%)";                     // red — Needs work
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Strong";
  if (score >= 55) return "Good";
  if (score >= 35) return "Fair";
  return "Needs work";
}

export function ScoreRing({
  score,
  size = 120,
  strokeWidth = 9,
}: ScoreRingProps) {
  const clampedScore = Math.min(Math.max(Math.round(score), 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // motionScore drives both the counter text and the arc — starts at 0, animates to real value
  const motionScore = useMotionValue(0);

  // Animated counter display
  const displayScore = useTransform(motionScore, (v) => Math.round(v));

  // Arc dash offset — full arc when motionScore = 100, empty at 0
  const dashOffset = useTransform(
    motionScore,
    (v) => circumference - (v / 100) * circumference
  );

  // Color and label track the *animated* value so they don't flash ahead of the counter
  const color = useTransform(motionScore, (v) => getScoreColor(Math.round(v)));
  const label = useTransform(motionScore, (v) => getScoreLabel(Math.round(v)));

  // Re-run animation every time clampedScore changes (handles async prop updates)
  useEffect(() => {
    const controls = animate(motionScore, clampedScore, {
      duration: clampedScore === 0 ? 0 : 1.2,
      ease: "easeOut",
    });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedScore]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`Resume score: ${clampedScore} out of 100`}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(270 20% 93%)"
            strokeWidth={strokeWidth}
          />
          {/* Animated arc — color tracks motionScore */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color as unknown as string}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: dashOffset, stroke: color as unknown as string }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>

        {/* Center number + /100 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-bold leading-none tabular-nums"
            style={{ color }}
          >
            {displayScore}
          </motion.span>
          <span className="text-[10px] font-medium text-slate-500 mt-0.5">/ 100</span>
        </div>
      </div>

      {/* Label below ring */}
      <div className="text-center">
        <div className="text-xs font-semibold text-slate-700">Resume Score</div>
        <motion.div className="text-[11px] font-medium" style={{ color }}>
          {label}
        </motion.div>
      </div>
    </div>
  );
}
