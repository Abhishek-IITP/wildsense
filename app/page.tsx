"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef, useState } from "react";
import hero from "@/assets/hero.jpg";
import meadow from "@/assets/meadow.jpg";
import { SAMPLE_MISSIONS } from "@/data/missions";
import { MissionGenerator } from "@/components/ws/MissionGenerator";
import { SiteFooter, SiteHeader } from "@/components/ws/SiteHeader";
import { Arrow, FieldNote, btn, chipCls } from "@/components/ws/ui";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Notice", "Listen", "Find", "Reflect", "Move"] as const;

export default function Home() {
  const [gen, setGen] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const root = useRef<HTMLDivElement>(null);
  const featured = SAMPLE_MISSIONS[0]!;
  const list = SAMPLE_MISSIONS.filter((m) => filter === "All" || m.category === filter);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(".h-img", { clipPath: "inset(8% 8% 8% 8%)", scale: 1.12 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.4 })
        .from(".h-line", { yPercent: 110, duration: 0.9, stagger: 0.09 }, 0.3)
        .from(".h-fade", { y: 18, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.75)
        .from(".h-note", { y: -10, rotate: -6, opacity: 0, duration: 0.8 }, 1.1);
      if (window.innerWidth > 768) {
        gsap.to(".h-img", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".h-wrap", start: "top top", end: "bottom top", scrub: true } });
        gsap.to(".c-img", { yPercent: -10, ease: "none", scrollTrigger: { trigger: ".c-wrap", start: "top bottom", end: "bottom top", scrub: true } });
      }
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) =>
        gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } }),
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      <SiteHeader overlay />

      {/* Hero */}
      <section className="h-wrap relative h-[100svh] min-h-[620px] overflow-hidden bg-scene text-scene-foreground">
        <img src={hero.src} alt="Sunlight falling through a misty forest trail" width={1920} height={1088} className="h-img absolute inset-0 h-[115%] w-full object-cover object-[70%_center]" />
        <div className="scene-left absolute inset-0" />
        <div className="scene-bottom absolute inset-x-0 bottom-0 h-1/2" />
        <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-16 md:justify-center md:px-10 md:pb-0">
          <p className="h-fade eyebrow mb-6 opacity-80">A little more outside</p>
          <h1 className="font-display text-[clamp(3.2rem,9vw,8.5rem)] leading-[1]">
            <span className="block overflow-hidden pb-[0.08em]"><span className="h-line block">The world</span></span>
            <span className="block overflow-hidden pb-[0.08em]"><span className="h-line block">is waiting just</span></span>
            <span className="block overflow-hidden pb-2"><span className="h-line block italic text-sage">outside.</span></span>
          </h1>
          <p className="h-fade mt-6 max-w-md text-base opacity-85 md:text-lg">
            A small mission. A slower moment. A world you might have walked past.
          </p>
          <div className="h-fade mt-8 flex flex-wrap gap-3">
            <a href="#today" className={btn.ivory}>Start exploring <Arrow /></a>
            <button onClick={() => setGen(true)} className={btn.ghostLight}>Create a mission</button>
          </div>
        </div>
        <div className="h-note absolute bottom-8 right-6 hidden text-right md:block md:right-10">
          <p className="eyebrow opacity-70">No signal needed. Just curiosity.</p>
          <p className="mt-1 font-hand text-lg opacity-80">51°N · first light, 6:42</p>
        </div>
        <div className="absolute bottom-8 left-1/2 hidden h-10 w-px -translate-x-1/2 overflow-hidden bg-scene-foreground/20 md:block">
          <div className="h-1/2 w-full animate-[pulse_2s_ease-in-out_infinite] bg-scene-foreground/80" />
        </div>
      </section>

      {/* Daily invitation */}
      <section id="today" className="paper-grain scroll-mt-0 py-24 md:py-36">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 md:grid-cols-12 md:px-10">
          <div className="reveal md:col-span-5 md:pt-16">
            <p className="eyebrow text-earth">Today's invitation</p>
            <h2 className="mt-4 font-display text-5xl leading-[0.95] md:text-7xl">
              A small thing to <em className="text-moss">notice</em> today.
            </h2>
            <div className="mt-12 border-t pt-8">
              <FieldNote>Field note 001</FieldNote>
              <h3 className="mt-2 font-display text-4xl">{featured.title}</h3>
              <p className="eyebrow mt-3 text-muted-foreground">
                {featured.duration} minutes · {featured.difficulty} · {featured.category}
              </p>
              <p className="mt-6 max-w-sm font-display text-2xl italic leading-snug text-foreground/80">“{featured.description}”</p>
              <Link href={`/mission/${featured.id}`} className={btn.primary + " mt-8"}>
                Begin this mission <Arrow />
              </Link>
            </div>
          </div>
          <Link href={`/mission/${featured.id}`} className="reveal group relative block md:col-span-6 md:col-start-7">
            <div className="overflow-hidden rounded-sm">
              <img src={featured.image} alt="Three different leaves arranged on paper" loading="lazy" width={1280} height={1600} className="aspect-[4/5] w-full object-cover transition-transform duration-[1.4s] ease-organic group-hover:scale-[1.04]" />
            </div>
            <div className="absolute -left-4 bottom-10 rotate-[-4deg] bg-ivory px-4 py-3 shadow-sm md:-left-12">
              <FieldNote className="text-forest">oak · birch · lilac?</FieldNote>
            </div>
            <p className="eyebrow mt-3 text-right text-muted-foreground">Pl. 01 — specimens, autumn</p>
          </Link>
        </div>
      </section>

      {/* Collection */}
      <section className="pb-28 md:pb-40">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="reveal flex flex-col justify-between gap-8 border-t pt-12 md:flex-row md:items-end">
            <h2 className="font-display text-5xl md:text-7xl">
              Follow your <em className="text-earth">curiosity.</em>
            </h2>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter missions">
              {FILTERS.map((f) => (
                <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={chipCls(filter === f)}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <motion.div layout className="mt-14 grid gap-x-8 gap-y-16 md:grid-cols-12">
            <AnimatePresence mode="popLayout">
              {list.map((m, i) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    i % 3 === 0 ? "md:col-span-5" : i % 3 === 1 ? "md:col-span-4 md:mt-24" : "md:col-span-3 md:mt-8",
                  )}
                >
                  <Link href={`/mission/${m.id}`} className="group block">
                    <div className="relative overflow-hidden rounded-sm">
                      <img src={m.image} alt="" loading="lazy" className={cn("w-full object-cover transition-transform duration-[1.2s] ease-organic group-hover:scale-105", i % 2 ? "aspect-[3/4]" : "aspect-[4/3]")} />
                      <span className="absolute left-3 top-3 bg-ivory/90 px-2 py-1 eyebrow text-forest">{m.category}</span>
                      <span className="absolute bottom-3 right-3 translate-y-2 font-hand text-lg text-scene-foreground opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                        go on…
                      </span>
                    </div>
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-3xl">{m.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                      </div>
                      <Arrow className="mt-3 shrink-0 transition-transform duration-500 group-hover:translate-x-1" />
                    </div>
                    <p className="eyebrow mt-3 text-earth">{m.duration} min · {m.difficulty}</p>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          <div className="reveal mt-20 flex flex-col items-start gap-4 border-t pt-10 md:flex-row md:items-center md:justify-between">
            <p className="font-display text-3xl italic">None of these feel right?</p>
            <button onClick={() => setGen(true)} className={btn.outline}>Create a mission for where you are <Arrow /></button>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="c-wrap relative h-[90svh] min-h-[560px] overflow-hidden bg-scene text-scene-foreground">
        <img src={meadow.src} alt="A person sitting in a golden meadow at sunset" loading="lazy" width={1920} height={1088} className="c-img absolute inset-0 h-[120%] w-full object-cover" />
        <div className="scene-bottom absolute inset-0" />
        <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-20 md:px-10">
          <h2 className="reveal max-w-4xl font-display text-[clamp(2.6rem,6vw,6rem)] leading-[0.95]">
            Some things are better <em>experienced</em> than explained.
          </h2>
          <p className="reveal mt-6 max-w-md opacity-85">Your phone can give you a reason to go outside. The rest is up to you.</p>
          <div className="reveal mt-8">
            <button onClick={() => setGen(true)} className={btn.ivory}>Start another mission <Arrow /></button>
          </div>
        </div>
      </section>

      <SiteFooter />
      <MissionGenerator open={gen} onOpenChange={setGen} />
    </div>
  );
}
