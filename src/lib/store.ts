import { useSyncExternalStore } from "react";
import type { JournalEntry, Mission } from "./types";

/** Tiny localStorage-backed store; data stays on the device. */
type State = { missions: Mission[]; journal: JournalEntry[]; completed: string[]; theme: "light" | "dark" };
const KEY = "wildsense:v1";
const EMPTY: State = { missions: [], journal: [], completed: [], theme: "light" };

let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
}

export function setState(fn: (s: State) => State) {
  load();
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full */
  }
  listeners.forEach((l) => l());
}

export function useStore(): State {
  return useSyncExternalStore(
    (l) => {
      load();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => {
      load();
      return state;
    },
    () => EMPTY,
  );
}

export const actions = {
  addMission: (m: Mission) =>
    setState((s) => ({
      ...s,
      missions: [m, ...s.missions.filter((x) => x.id !== m.id)],
    })),
  addEntry: (e: JournalEntry) =>
    setState((s) => ({
      ...s,
      journal: [e, ...s.journal],
      completed: Array.from(new Set([...s.completed, e.missionId])),
    })),
  updateEntry: (id: string, patch: Partial<JournalEntry>) =>
    setState((s) => ({ ...s, journal: s.journal.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
  deleteEntry: (id: string) => setState((s) => ({ ...s, journal: s.journal.filter((e) => e.id !== id) })),
  setTheme: (theme: "light" | "dark") => setState((s) => ({ ...s, theme })),
  restore: (data: unknown): boolean => {
    if (!data || typeof data !== "object") return false;
    const d = data as Partial<State>;
    if (!Array.isArray(d.journal)) return false;
    const ok = d.journal.every(
      (e) => e && typeof e.id === "string" && typeof e.missionTitle === "string" && typeof e.createdAt === "string",
    );
    if (!ok) return false;
    setState((s) => ({
      ...s,
      journal: d.journal as JournalEntry[],
      missions: Array.isArray(d.missions) ? (d.missions as Mission[]) : s.missions,
      completed: Array.isArray(d.completed) ? (d.completed as string[]) : s.completed,
    }));
    return true;
  },
  exportJson: () => {
    load();
    return JSON.stringify({ app: "wildsense", version: 1, ...state }, null, 2);
  },
};
