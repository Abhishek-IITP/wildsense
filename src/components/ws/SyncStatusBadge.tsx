"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { actions, useStore } from "@/lib/store";
import { sendSyncBatch } from "@/lib/api/sync";
import type { SyncMutation } from "@/types";
import { cn } from "@/lib/utils";

export function SyncStatusBadge({ className }: { className?: string }) {
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

    // Initial sync time from localStorage if stored
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
      // Build mutations for current local journal entries
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

        // Merge any server journal entries or missions that client didn't have
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
          "group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
          !isOnline
            ? "border-muted text-muted-foreground bg-muted/30"
            : syncing
              ? "border-amber-500/40 text-amber-600 bg-amber-500/10"
              : "border-border/70 hover:border-moss/50 text-muted-foreground hover:text-foreground bg-card/60 backdrop-blur-sm",
        )}
      >
        {!isOnline ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
            <CloudOff className="h-3.5 w-3.5 opacity-70" />
            <span className="hidden sm:inline font-sans">Offline</span>
          </>
        ) : syncing ? (
          <>
            <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
            <span className="font-sans">Syncing…</span>
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-moss" />
            <Cloud className="h-3.5 w-3.5 text-moss group-hover:scale-105 transition-transform" />
            <span className="hidden sm:inline font-sans">
              {lastSyncTime ? "Synced" : "Sync Cloud"}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
