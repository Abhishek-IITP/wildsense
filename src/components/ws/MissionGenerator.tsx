import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { generateMission } from "@/lib/ai-client";
import { actions } from "@/lib/store";
import type { Difficulty } from "@/lib/types";
import { Arrow, btn, chipCls } from "./ui";

const DURATIONS = [5, 10, 20, 30];
const ENVS = ["Garden or balcony", "Park or neighbourhood", "Woodland or nature trail", "Riverside or beach", "Somewhere with very little greenery"];
const INTERESTS = ["Notice small details", "Listen to natural sounds", "Find colours and textures", "Learn about plants", "Take a mindful pause", "Move and explore"];
const DIFFS: Difficulty[] = ["Gentle", "Curious", "Explorer"];
const PHRASES = ["Looking for something worth noticing…", "Gathering a little curiosity…", "Your next adventure is taking shape…"];

export function MissionGenerator({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [duration, setDuration] = useState(10);
  const [environment, setEnv] = useState<string>(ENVS[1]!);
  const [interest, setInterest] = useState<string>(INTERESTS[0]!);
  const [difficulty, setDiff] = useState<Difficulty>("Gentle");
  const [loading, setLoading] = useState(false);
  const [phrase, setPhrase] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setPhrase((p) => (p + 1) % PHRASES.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

  async function create() {
    setLoading(true);
    const m = await generateMission({ duration, environment, interest, difficulty });
    actions.addMission(m);
    setLoading(false);
    onOpenChange(false);
    router.push(`/mission/${m.id}`);
  }

  const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <fieldset className="space-y-3">
      <legend className="eyebrow mb-3 text-muted-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="paper-grain max-h-[100dvh] max-w-2xl overflow-y-auto bg-background p-6 sm:rounded-lg md:p-10">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <DialogTitle className="sr-only">Creating mission</DialogTitle>
              <DialogDescription className="sr-only">Please wait</DialogDescription>
              <svg viewBox="0 0 60 60" className="h-16 w-16 text-moss" fill="none" stroke="currentColor" strokeWidth="1.2">
                <motion.path d="M30 55V22M30 32c-10 0-15-7-15-17 10 0 15 7 15 17Zm0-4c8 0 12-5 12-12-8 0-12 5-12 12Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, repeat: Infinity, repeatType: "reverse" }} />
              </svg>
              <AnimatePresence mode="wait">
                <motion.p key={phrase} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-8 font-display text-2xl italic">
                  {PHRASES[phrase]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div key="f" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <p className="eyebrow text-earth">A mission made for you</p>
                <DialogTitle className="mt-2 font-display text-4xl md:text-5xl">
                  Where are you <em>today?</em>
                </DialogTitle>
                <DialogDescription className="mt-2 text-muted-foreground">Four small choices. Then go.</DialogDescription>
              </div>
              <Group label="Time">
                {DURATIONS.map((d) => (
                  <button key={d} className={chipCls(duration === d)} onClick={() => setDuration(d)} aria-pressed={duration === d}>
                    {d} min
                  </button>
                ))}
              </Group>
              <Group label="Place">
                {ENVS.map((e) => (
                  <button key={e} className={chipCls(environment === e)} onClick={() => setEnv(e)} aria-pressed={environment === e}>
                    {e}
                  </button>
                ))}
              </Group>
              <Group label="Curious about">
                {INTERESTS.map((i) => (
                  <button key={i} className={chipCls(interest === i)} onClick={() => setInterest(i)} aria-pressed={interest === i}>
                    {i}
                  </button>
                ))}
              </Group>
              <Group label="Pace">
                {DIFFS.map((d) => (
                  <button key={d} className={chipCls(difficulty === d)} onClick={() => setDiff(d)} aria-pressed={difficulty === d}>
                    {d}
                  </button>
                ))}
              </Group>
              <button className={btn.primary + " w-full py-4"} onClick={create}>
                Create my mission <Arrow />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
