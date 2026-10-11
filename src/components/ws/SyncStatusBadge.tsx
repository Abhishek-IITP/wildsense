"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { actions, useStore } from "@/lib/store";
import { sendSyncBatch } from "@/lib/api/sync";
import type { SyncMutation } from "@/types";
import { cn } from "@/lib/utils";

export function SyncStatusBadge({
  className,
  overlay = false,
}: {
  className?: string;
  overlay?: boolean;
}) {
  const { journal } = useStore();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast.info("Connection restored", { description: "WildSense is back online" });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Offline mode active", { description: "Missions & journal remain saved locally" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const saved = localStorage.getItem("wildsense:lastSync");
    if (saved) setLastSyncTime(new Date(saved));

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const triggerSync = async () => {
    if (!navigator.onLine) {
      toast.error("Cannot sync while offline", { description: "Saved on device. Will sync once connected." });
      return;
    }

    setSyncing(true);
    try {
      const mutations: SyncMutation[] = journal.map((entry) => ({
        mutationId: `mut-j-${entry.id}-${Date.now()}`,
        entityType: "journal",
        action: "upsert",
        entityId: entry.id,
        timestamp: new Date().toISOString(),
        version: entry.version || 1,
        data: entry,
      }));

      const clientId = localStorage.getItem("wildsense:clientId") || `client-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("wildsense:clientId", clientId);

      const res = await sendSyncBatch({
        clientId,
        mutations,
      });

      if (res && res.success) {
        const now = new Date();
        setLastSyncTime(now);
        localStorage.setItem("wildsense:lastSync", now.toISOString());

        if (res.serverChanges?.missions?.length) {
          res.serverChanges.missions.forEach((m) => actions.addMission(m));
        }

        toast.success("Field sync complete", {
          description: `Synced ${res.syncedMutationIds?.length ?? 0} item(s) with cloud database.`,
        });
      } else {
        toast.error("Sync did not finish", { description: "Using local offline journal." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync server unreachable";
      toast.error("Cloud sync unreachable", {
        description: `Local notes safe. (${msg})`,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <button
        onClick={triggerSync}
        disabled={syncing}
        aria-label="Cloud sync status"
        className={cn(
          "group flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all shadow-xs active:scale-95",
          overlay
            ? !isOnline
              ? "border-scene-foreground/20 bg-scene-foreground/10 text-scene-foreground/60"
              : syncing
                ? "border-amber-400/50 bg-amber-500/20 text-amber-300"
                : "border-scene-foreground/30 bg-scene-foreground/15 text-scene-foreground hover:bg-scene-foreground/25 hover:border-scene-foreground/50 backdrop-blur-md"
            : !isOnline
              ? "border-muted bg-muted/60 text-muted-foreground"
              : syncing
                ? "border-amber-500/50 bg-amber-50 text-amber-700"
                : "border-foreground/20 bg-card text-foreground hover:border-moss/70 hover:bg-secondary hover:text-moss shadow-sm",
        )}
      >
        {!isOnline ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
            <CloudOff className="h-3.5 w-3.5 opacity-70 shrink-0" />
            <span className="font-sans">Offline</span>
          </>
        ) : syncing ? (
          <>
            <RefreshCw className="h-3 w-3 animate-spin text-amber-600 shrink-0" />
            <span className="font-sans">Syncing…</span>
          </>
        ) : (
          <>
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", overlay ? "bg-sage" : "bg-moss")} />
            <Cloud
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-105",
                overlay ? "text-sage" : "text-moss",
              )}
            />
            <span className="font-sans">
              {lastSyncTime ? "Synced" : "Sync"}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
