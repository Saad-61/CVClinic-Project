import { Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { cn } from "../lib/utils";

type Props = {
  disabled?: boolean;
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSizeBytes?: number;
};

function isSupportedFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".docx");
}

export function FileDropzone({
  disabled,
  onFileSelected,
  accept = ".pdf,.docx",
  maxSizeBytes = 10 * 1024 * 1024,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chooseFile = () => inputRef.current?.click();

  const handleFile = (file: File | null) => {
    if (!file) return;
    setError(null);

    if (!isSupportedFile(file)) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }
    if (file.size > maxSizeBytes) {
      setError("File is too large. Please keep it under 10MB.");
      return;
    }
    onFileSelected(file);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-800 bg-card px-5 py-8 text-center transition-colors hover:border-[#B6ABFF]/50 hover:bg-[#B6ABFF]/5",
          dragActive && "border-[#9e59d9] bg-[#9e59d9]/10",
          disabled && "cursor-not-allowed opacity-60 hover:bg-card hover:border-zinc-800",
        )}
        onClick={(e) => {
          if (disabled) e.preventDefault();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
          if (disabled) return;
          handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-zinc-800 text-white shadow transition-colors group-hover:bg-[#9e59d9] group-hover:text-white">
          <Upload className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="text-sm font-medium text-zinc-200">
          Drop your CV here
        </div>
        <div className="text-xs text-zinc-400">
          PDF or DOCX • up to 10MB
        </div>
        <div className="mt-2 text-xs font-medium text-[#af6eeb] underline-offset-4 group-hover:underline">
          Or browse files
        </div>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          disabled={disabled}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {error ? (
        <div className="text-sm text-rose-700">{error}</div>
      ) : (
        <div className="text-xs text-zinc-400">
          Tip: if preview looks wrong, re-upload the file.
        </div>
      )}
      <button
        type="button"
        className="sr-only"
        onClick={chooseFile}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}

