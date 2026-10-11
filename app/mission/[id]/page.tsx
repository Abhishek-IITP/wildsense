"use client";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/ws/SiteHeader";
import { SoundscapePlayer } from "@/components/ws/SoundscapePlayer";
import { AiDot, Arrow, FieldNote, btn, chipCls } from "@/components/ws/ui";
import { generateReflection, useAiStatus } from "@/lib/ai-client";
import { actions } from "@/lib/store";
import type { JournalEntry, Mission } from "@/lib/types";
import { useMission } from "@/lib/use-mission";
import { cn } from "@/lib/utils";

type Phase = "detail" | "active" | "reflect" | "saved";

export default function MissionPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { mission, loading } = useMission(id ?? "");
  const [phase, setPhase] = useState<Phase>("detail");
  const [minutes, setMinutes] = useState(0);
  const [entry, setEntry] = useState<JournalEntry | null>(null);

  useEffect(() => window.scrollTo(0, 0), [phase]);

  if (loading) {
    return (
      <div className="paper-grain flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <SiteHeader />
        <svg viewBox="0 0 60 60" className="h-14 w-14 text-moss animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M30 55V22M30 32c-10 0-15-7-15-17 10 0 15 7 15 17Zm0-4c8 0 12-5 12-12-8 0-12 5-12 12Z" />
        </svg>
        <p className="font-display text-2xl italic text-muted-foreground">Finding this field mission…</p>
      </div>
    );
  }

  if (!mission)
    return (
      <div className="paper-grain flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <SiteHeader />
        <h1 className="font-display text-5xl">This page of the journal is blank.</h1>
        <p className="max-w-md text-muted-foreground">We couldn't find a mission with this identifier.</p>
        <Link href="/" className={btn.primary}>Find a mission <Arrow /></Link>
      </div>
    );

  return (
    <AnimatePresence mode="wait">
      <motion.div key={phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
        {phase === "detail" && <Detail m={mission} onStart={() => setPhase("active")} />}
        {phase === "active" && (
          <Active
            m={mission}
            onFinish={(mins) => {
              setMinutes(mins);
              setPhase("reflect");
            }}
          />
        )}
        {phase === "reflect" && (
          <Reflect
            m={mission}
            minutes={minutes}
            onSaved={(e) => {
              setEntry(e);
              setPhase("saved");
            }}
          />
        )}
        {phase === "saved" && entry && <Saved entry={entry} />}
      </motion.div>
    </AnimatePresence>
  );
}

function Detail({ m, onStart }: { m: Mission; onStart: () => void }) {
  return (
    <div>
      <SiteHeader overlay />
      <section className="relative h-[72svh] min-h-[480px] overflow-hidden bg-scene text-scene-foreground">
        <motion.img initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }} src={m.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="scene-bottom absolute inset-0" />
        <div className="relative mx-auto flex h-full max-w-[1100px] flex-col justify-end px-5 pb-14 md:px-10">
          <p className="eyebrow opacity-80">{m.category}{m.source === "local-ai" ? " · written by local AI" : m.source === "built-in" ? " · built-in guide" : ""}</p>
          <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.9 }} className="mt-3 font-display text-[clamp(3rem,8vw,7rem)] leading-[0.92]">
            {m.title}
          </motion.h1>
          <p className="eyebrow mt-4 opacity-80">{m.duration} minutes · {m.difficulty}</p>
        </div>
      </section>
      <section className="paper-grain py-20">
        <div className="mx-auto grid max-w-[1100px] gap-14 px-5 md:grid-cols-12 md:px-10">
          <div className="md:col-span-7">
            <p className="font-display text-3xl italic leading-snug md:text-4xl">“{m.description}”</p>
            <ol className="mt-14 space-y-8">
              {m.steps.map((s, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex gap-6 border-t pt-6">
                  <span className="font-display text-4xl text-moss">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pt-2 text-lg">{s}</span>
                </motion.li>
              ))}
            </ol>
          </div>
          <aside className="space-y-8 md:col-span-4 md:col-start-9 md:pt-4">
            <div className="rotate-[1deg] bg-card p-6 shadow-sm">
              <p className="eyebrow text-earth">Did you notice?</p>
              <p className="mt-3 font-display text-2xl leading-snug">{m.curiosity}</p>
              <FieldNote className="mt-4 block">look closer ↘</FieldNote>
            </div>
            <div className="border-l-2 border-terracotta pl-4 text-sm text-muted-foreground">
              <p className="eyebrow mb-2 text-foreground">Stay safe</p>
              Tell someone where you are going, keep to safe ground, don't touch unknown plants or fungi, and give wildlife space.
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={onStart} className={btn.primary + " py-4"}>I'm heading outside <Arrow /></button>
              <Link href="/" className={btn.outline}>Choose another mission</Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

/** Timer uses wall-clock timestamps, so it survives throttled tabs and pauses accurately. */
function useTimer() {
  const [running, setRunning] = useState(true);
  const acc = useRef(0);
  const since = useRef<number | null>(Date.now());
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(t);
  }, []);
  const elapsed = acc.current + (since.current ? Date.now() - since.current : 0);
  const toggle = () => {
    if (running) {
      acc.current += Date.now() - (since.current ?? Date.now());
      since.current = null;
    } else since.current = Date.now();
    setRunning(!running);
  };
  return { elapsed, running, toggle };
}

import { SoundscapePlayer } from "@/components/ws/SoundscapePlayer";
import { Check } from "lucide-react";

function Active({ m, onFinish }: { m: Mission; onFinish: (mins: number) => void }) {
  const { elapsed, running, toggle } = useTimer();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const total = m.duration * 60000;
  const p = Math.min(elapsed / total, 1);
  const secs = Math.floor(elapsed / 1000);
  const R = 120;
  const C = 2 * Math.PI * R;

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-scene text-scene-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="eyebrow opacity-60">Mission in progress</p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl">{m.title}</h1>
        <div className="relative my-10 h-64 w-64">
          <svg viewBox="0 0 260 260" className="h-full w-full -rotate-90">
            <circle cx="130" cy="130" r={R} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5" />
            <circle cx="130" cy="130" r={R} fill="none" stroke="var(--sage)" strokeWidth="2" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p)} className="transition-[stroke-dashoffset] duration-500 ease-linear" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-6xl tabular-nums">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>
            <span className="eyebrow mt-2 opacity-60">of {m.duration} min{running ? "" : " · paused"}</span>
          </div>
        </div>

        {/* Ambient Soundscape offline synth */}
        <div className="mb-8">
          <SoundscapePlayer compact preset="forest" />
        </div>

        <ol className="max-w-md w-full space-y-2.5 text-left text-sm opacity-90">
          {m.steps.map((s, i) => {
            const isDone = completedSteps.includes(i);
            return (
              <li
                key={i}
                onClick={() => toggleStep(i)}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border border-scene-foreground/10 p-2.5 transition-colors hover:border-scene-foreground/30",
                  isDone ? "bg-scene-foreground/10 line-through opacity-70" : "bg-scene-foreground/5",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs transition",
                    isDone ? "border-sage bg-sage text-scene" : "border-scene-foreground/40 text-sage",
                  )}
                >
                  {isDone ? <Check className="h-3 w-3 stroke-[3]" /> : i + 1}
                </span>
                <span className="pt-0.5 leading-snug">{s}</span>
              </li>
            );
          })}
        </ol>

        <p className="mt-10 font-hand text-2xl text-sage">Now put your phone away. We'll be here.</p>
        <div className="mt-10 flex gap-3">
          <button onClick={toggle} className={btn.ghostLight}>{running ? "Pause" : "Resume"}</button>
          <button onClick={() => onFinish(Math.max(1, Math.round(elapsed / 60000)))} className={btn.ivory}>I'm back <Arrow /></button>
        </div>
      </div>
    </div>
  );
}

const MOODS = ["Calmer", "Curious", "Energised", "Grounded"];

function Reflect({ m, minutes, onSaved }: { m: Mission; minutes: number; onSaved: (e: JournalEntry) => void }) {
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tag, setTag] = useState("");
  const [mood, setMood] = useState("");
  const [mins, setMins] = useState(minutes);
  const addTag = () => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTag("");
  };
  const save = () => {
    const now = new Date().toISOString();
    const e: JournalEntry = {
      id: `j-${Date.now().toString(36)}`,
      missionId: m.id,
      missionTitle: m.title,
      note: note.trim(),
      discoveries: tags,
      mood,
      minutes: Math.max(0, mins),
      createdAt: now,
      updatedAt: now,
      version: 1,
      aiReflectionStatus: "unavailable",
    };
    actions.addEntry(e);
    onSaved(e);
  };
  const input = "w-full border-0 border-b border-border bg-transparent py-3 text-lg outline-none transition-colors focus:border-primary";
  return (
    <div className="paper-grain min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-32">
        <FieldNote>{m.title} — returned</FieldNote>
        <h1 className="mt-2 font-display text-6xl md:text-7xl">What stayed <em className="text-moss">with you?</em></h1>
        <p className="mt-4 text-muted-foreground">It doesn't have to be extraordinary. Small things count.</p>
        <div className="mt-14 space-y-12">
          <label className="block">
            <span className="eyebrow text-earth">What did you notice?</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="The moss was softer on the shaded side…" className={input + " resize-none font-display text-2xl"} />
          </label>
          <div>
            <span className="eyebrow text-earth">Things you discovered</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((t) => (
                <button key={t} onClick={() => setTags(tags.filter((x) => x !== t))} className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground" aria-label={`Remove ${t}`}>
                  {t} ×
                </button>
              ))}
            </div>
            <input value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => (e.key === "Enter" || e.key === ",") && (e.preventDefault(), addTag())} onBlur={addTag} placeholder="Type and press enter — e.g. acorn" className={input} />
          </div>
          <div>
            <span className="eyebrow text-earth">How do you feel?</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {MOODS.map((x) => (
                <button key={x} onClick={() => setMood(mood === x ? "" : x)} className={chipCls(mood === x)} aria-pressed={mood === x}>{x}</button>
              ))}
            </div>
          </div>
          <label className="block max-w-[200px]">
            <span className="eyebrow text-earth">Time outside (minutes)</span>
            <input type="number" min={0} value={mins} onChange={(e) => setMins(Number(e.target.value))} className={input} />
          </label>
          <button onClick={save} disabled={!note.trim() && tags.length === 0} className={btn.primary + " w-full py-4"}>Save this moment <Arrow /></button>
        </div>
      </div>
    </div>
  );
}

function Saved({ entry }: { entry: JournalEntry }) {
  const { status } = useAiStatus();
  const [reflection, setReflection] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "done" | "failed">("idle");
  const router = useRouter();
  const run = async () => {
    setState("loading");
    const r = await generateReflection(entry);
    if (r) {
      setReflection(r);
      actions.updateEntry(entry.id, { aiReflection: r });
      setState("done");
    } else setState("failed");
  };
  useEffect(() => {
    if (status === "connected" && state === "idle") void run();
  }, [status]);

  return (
    <div className="paper-grain flex min-h-screen items-center">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-5 py-32 text-center">
        <motion.svg initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} viewBox="0 0 60 60" className="mx-auto h-14 w-14 text-moss" fill="none" stroke="currentColor" strokeWidth="1.2">
          <motion.path d="M30 55V22M30 32c-10 0-15-7-15-17 10 0 15 7 15 17Zm0-4c8 0 12-5 12-12-8 0-12 5-12 12Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6 }} />
        </motion.svg>
        <p className="eyebrow mt-6 text-earth">Saved to your journal</p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl">A little thing, <em>kept.</em></h1>
        <div className="mx-auto mt-12 min-h-[120px] max-w-lg">
          {state === "loading" && <p className="font-display text-2xl italic text-muted-foreground animate-pulse">Reading your notes…</p>}
          {state === "done" && reflection && (
            <motion.blockquote initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <p className="font-display text-2xl italic leading-snug md:text-3xl">“{reflection}”</p>
              <AiDot status="connected" className="mt-5 justify-center text-muted-foreground" />
              <p className="mt-1 text-xs text-muted-foreground">Reflection generated on this device</p>
            </motion.blockquote>
          )}
          {(state === "failed" || (state === "idle" && status !== "connected" && status !== "checking")) && (
            <div className="text-muted-foreground">
              <p>Your local AI isn't reachable right now, so there's no reflection — but your note is safely saved.</p>
              <button onClick={run} className={btn.outline + " mt-4"}>Try a reflection</button>
            </div>
          )}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button onClick={() => router.push("/journal")} className={btn.primary}>Open my journal <Arrow /></button>
          <Link href="/" className={btn.outline}>Find another mission</Link>
        </div>
      </div>
    </div>
  );
}
