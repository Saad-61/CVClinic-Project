import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { cn } from "../lib/utils";

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function CopyButton({
  value,
  label = "Copy",
  className,
  variant = "outline",
}: {
  value: string;
  label?: string;
  className?: string;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1200);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={variant}
            size="sm"
            className={cn(
              "border-zinc-800 text-primary hover:bg-primary/10 hover:text-white hover:border-primary transition-all",
              className
            )}
            onClick={async () => {
              await copyText(value);
              setCopied(true);
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? "Copied" : "Copy to clipboard"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


