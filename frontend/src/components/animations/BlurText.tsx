import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "../../lib/utils";

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function BlurText({ text, className, delay = 0 }: BlurTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  const words = text.split(/\s+/);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.16,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: { filter: "blur(8px)", opacity: 0, y: 15 },
    visible: {
      filter: "blur(0px)",
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 50,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      ref={containerRef}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className={cn("inline-flex flex-wrap", className)}
    >
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          variants={wordVariants}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}
