import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface ComboboxProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  searchable?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  disabled = false,
  className,
  searchable = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between bg-card text-foreground border-border hover:bg-muted/50 hover:text-foreground transition-colors text-left font-normal px-3 py-2.5 h-auto",
            className
          )}
        >
          <span className="truncate">
            {value
              ? options.find((option) => option.value === value)?.label || value
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-border bg-card" align="start" sideOffset={2}>
        <Command className="bg-card text-foreground border-none">
          {searchable ? (
            <CommandInput placeholder={searchPlaceholder} className="border-border text-foreground bg-transparent" />
          ) : (
            <CommandInput className="hidden" wrapperClassName="hidden" />
          )}
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty className="py-3 text-center text-xs text-muted-foreground">{emptyText}</CommandEmpty>
            <CommandGroup className="p-1">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value ? option.value.toLowerCase() : option.label.toLowerCase()}
                  onSelect={() => {
                    onChange(option.value === value ? "" : option.value)
                    setOpen(false)
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(option.value === value ? "" : option.value)
                    setOpen(false)
                  }}
                  onClick={() => {
                    onChange(option.value === value ? "" : option.value)
                    setOpen(false)
                  }}
                  className="flex items-center justify-between px-2 py-1.5 rounded-sm text-sm cursor-pointer hover:bg-muted text-foreground aria-selected:bg-muted/70 data-[selected=true]:bg-muted/70 transition-colors pointer-events-auto"
                >
                  <span className="truncate">{option.label}</span>
                  <Check
                    className={cn(
                      "h-4 w-4 text-amber-500 shrink-0 ml-2",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
