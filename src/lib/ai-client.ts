import { useEffect, useSyncExternalStore } from "react";
import { builtInMission } from "./fallback";
import type { AiStatus, GeneratorInput, JournalEntry, Mission } from "./types";

let status: AiStatus = "checking";
let model = "gemma3:4b";
const subs = new Set<() => void>();
const set = (s: AiStatus) => {
  status = s;
  subs.forEach((f) => f());
};

export async function checkHealth() {
  set("checking");
  try {
    const r = await fetch("/api/health");
    const j = await r.json();
    model = j.model ?? model;
    set(j.ok ? "connected" : "offline");
  } catch {
    set("offline");
  }
}

let started = false;
export function useAiStatus() {
  useEffect(() => {
    if (!started) {
      started = true;
      void checkHealth();
    }
  }, []);
  const s = useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => status,
    () => "checking" as AiStatus,
  );
  return { status: s, model };
}

export async function generateMission(input: GeneratorInput): Promise<Mission> {
  const prev = status;
  set("generating");
  try {
    const r = await fetch("/api/mission", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!r.ok) throw new Error("ai unavailable");
    const m = (await r.json()) as Mission;
    set("connected");
    return m;
  } catch {
    set(prev === "connected" ? "offline" : prev === "generating" ? "offline" : prev);
    return builtInMission(input);
  }
}

export async function generateReflection(entry: JournalEntry): Promise<string | null> {
  const prev = status;
  set("generating");
  try {
    const r = await fetch("/api/reflect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!r.ok) throw new Error();
    const j = await r.json();
    set("connected");
    return typeof j.reflection === "string" && j.reflection.trim() ? j.reflection.trim() : null;
  } catch {
    set(prev === "generating" ? "offline" : "offline");
    return null;
  }
}
