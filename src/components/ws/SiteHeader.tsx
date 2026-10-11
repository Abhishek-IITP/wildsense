import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Headphones } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { checkHealth, useAiStatus } from "@/lib/ai-client";
import { actions, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AiDot, Logo, btn } from "./ui";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { SoundscapePlayer } from "./SoundscapePlayer";

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname();
  const { status, model } = useAiStatus();
  const { theme } = useStore();
  const [open, setOpen] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const tone = overlay ? "text-scene-foreground" : "text-foreground";
  const link = cn("text-sm opacity-80 transition-opacity hover:opacity-100", tone);

  return (
    <header className={cn("absolute inset-x-0 top-0 z-30", tone)}>
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 md:px-10">
        <Link href="/" aria-label="WildSense home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5 md:gap-7">
          <Link
            href="/"
            className={cn(
              link,
              pathname === "/" && "!opacity-100 underline underline-offset-8",
            )}
          >
            Explore
          </Link>
          <Link
            href="/journal"
            className={cn(
              link,
              pathname === "/journal" && "!opacity-100 underline underline-offset-8",
            )}
          >
            Journal
          </Link>

          <button
            onClick={() => setSoundOpen(!soundOpen)}
            aria-label="Toggle ambient nature soundscape"
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition",
              soundOpen
                ? "border-moss bg-moss/20 text-moss"
                : "border-border/60 hover:border-border text-muted-foreground hover:text-foreground bg-card/40 backdrop-blur-sm",
            )}
            title="Ambient Nature Soundscape"
          >
            <Headphones className="h-3.5 w-3.5" />
            <span className="hidden md:inline font-sans">Soundscape</span>
          </button>

          <SyncStatusBadge />
          <AiDot status={status} className="hidden lg:inline-flex" />

          <button onClick={() => setOpen(true)} aria-label="Settings" className={cn(link, "rounded-full p-1")}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
            </svg>
          </button>
        </nav>
      </div>

      {/* Floating soundscape popover widget */}
      {soundOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
            onClick={() => setSoundOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed right-3 top-20 z-50 sm:right-8 sm:top-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <SoundscapePlayer onClose={() => setSoundOpen(false)} />
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl">Settings</DialogTitle>
            <DialogDescription>Everything stays on this device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="eyebrow text-muted-foreground">Local AI</p>
                <AiDot status={status} className="mt-2" />
                <p className="mt-1 text-muted-foreground">Model: {model}</p>
              </div>
              <button className={btn.outline} onClick={() => checkHealth()}>
                Retry
              </button>
            </div>
            <p className="text-muted-foreground">
              WildSense talks to Gemma through Ollama running on your own computer. When it is not reachable, a built-in
              guide writes missions instead, and your journal is still saved locally.
            </p>
            <div className="flex items-center justify-between border-t pt-4">
              <span>Appearance</span>
              <div className="flex gap-2">
                {(["light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => actions.setTheme(t)}
                    className={cn(btn.chip, theme === t ? "border-primary bg-primary text-primary-foreground" : "border-border")}
                  >
                    {t === "light" ? "Paper" : "Night"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}

export function SiteFooter() {
  const { status } = useAiStatus();
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-10">
        <Logo />
        <p className="max-w-sm text-sm text-muted-foreground">
          No account. No tracking. Your field notes never leave this device.
        </p>
        <AiDot status={status} className="text-muted-foreground" />
      </div>
    </footer>
  );
}
