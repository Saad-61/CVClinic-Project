import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current!);

    const handleClick = () => {
      if (props.disabled) return;
      if (onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={props.disabled}
        onClick={handleClick}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded border border-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center justify-center bg-zinc-950/80 hover:border-primary/50",
          checked ? "bg-primary border-primary text-primary-foreground" : "text-transparent",
          className
        )}
      >
        <Check className={cn("h-3 w-3 stroke-[3px] transition-transform", checked ? "scale-100" : "scale-0")} />
        <input
          type="checkbox"
          ref={inputRef}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";
