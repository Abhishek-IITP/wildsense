import { cn } from "@/lib/utils";
import type { AiStatus } from "@/lib/types";

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all duration-300 ease-organic hover:gap-3 active:scale-[0.97] disabled:opacity-50",
  ivory:
    "inline-flex items-center justify-center gap-2 rounded-full bg-ivory px-6 py-3 text-sm font-medium text-forest transition-all duration-300 ease-organic hover:gap-3 active:scale-[0.97]",
  ghostLight:
    "inline-flex items-center justify-center gap-2 rounded-full border border-scene-foreground/40 px-6 py-3 text-sm font-medium text-scene-foreground backdrop-blur-sm transition-all duration-300 hover:bg-scene-foreground/10 active:scale-[0.97]",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-full border border-foreground/20 px-5 py-2.5 text-sm font-medium text-foreground transition-all duration-300 hover:border-foreground/50 active:scale-[0.97]",
  chip: "rounded-full border px-4 py-2 text-sm transition-all duration-300 active:scale-[0.97]",
};

export function chipCls(active: boolean) {
  return cn(
    btn.chip,
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border text-foreground/80 hover:border-foreground/40",
  );
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("h-4 w-4", className)} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 10h13M11 5l5 5-5 5" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M12 21V9M12 13c-4 0-6-3-6-7 4 0 6 3 6 7Zm0-2c3 0 5-2 5-5-3 0-5 2-5 5Z" />
      </svg>
      <span className="font-display text-xl">WildSense</span>
    </span>
  );
}

const LABEL: Record<AiStatus, string> = {
  checking: "Looking for local AI",
  connected: "Local AI ready",
  offline: "Built-in guide",
  generating: "Thinking locally",
};

export function AiDot({ status, className }: { status: AiStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 eyebrow", className)} aria-live="polite">
      <span className="relative flex h-2 w-2">
        {(status === "generating" || status === "checking") && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage opacity-70" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full transition-colors duration-500",
            status === "connected" || status === "generating" ? "bg-sage" : status === "offline" ? "bg-terracotta" : "bg-moss",
          )}
        />
      </span>
      {LABEL[status]}
    </span>
  );
}

export function FieldNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-hand text-lg text-earth", className)}>{children}</span>;
}
