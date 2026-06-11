import { useEffect, useState } from "react";

interface CountUpProps {
  end: number;
  start?: number;
  duration?: number; // in seconds
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function CountUp({
  end,
  start = 0,
  duration = 1.2,
  prefix = "",
  suffix = "",
  className = "",
}: CountUpProps) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Ease out quad formula: f(t) = t * (2 - t)
      const easeProgress = progress * (2 - progress);
      const current = Math.round(start + easeProgress * (end - start));
      
      setCount(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [end, start, duration]);

  return (
    <span className={className}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}
