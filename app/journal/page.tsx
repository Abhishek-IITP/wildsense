"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Search, X, Download, FileText, Upload, Sparkles, Tag, Clock } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/ws/SiteHeader";
import { Arrow, FieldNote, btn } from "@/components/ws/ui";
import { actions, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const MOOD_FILTERS = ["All", "Calmer", "Curious", "Energised", "Grounded", "peaceful", "happy"] as const;

export default function Journal() {
  const { journal } = useStore();
  const file = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const minutes = journal.reduce((a, e) => a + (e.minutes || 0), 0);
  const totalDiscoveries = journal.reduce((a, e) => a + e.discoveries.length, 0);

  // Collect all unique discovery tags across entries
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    journal.forEach((entry) => {
      entry.discoveries.forEach((d) => {
        counts.set(d, (counts.get(d) || 0) + 1);
      });
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [journal]);

  // Naturalist Level calculation
  const rank = useMemo(() => {
    if (minutes >= 200 || journal.length >= 10) return { title: "Forest Sage", badge: "🌲🌲🌲", desc: "A deep, enduring kinship with the living wild." };
    if (minutes >= 90 || journal.length >= 5) return { title: "Canopy Wanderer", badge: "🌿🌿", desc: "Attuned to the quiet rhythms of the canopy." };
    if (minutes >= 30 || journal.length >= 2) return { title: "Trail Rover", badge: "🌱", desc: "Noticing the subtle details most walk past." };
    return { title: "Green Sprout", badge: "🍃", desc: "Beginning an offline journey into nature." };
  }, [minutes, journal.length]);

  // Filtered entries
  const filteredJournal = useMemo(() => {
    return journal.filter((e) => {
      // Search term
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchTitle = e.missionTitle.toLowerCase().includes(query);
        const matchNote = e.note.toLowerCase().includes(query);
        const matchTag = e.discoveries.some((d) => d.toLowerCase().includes(query));
        const matchReflection = e.aiReflection?.toLowerCase().includes(query);
        if (!matchTitle && !matchNote && !matchTag && !matchReflection) return false;
      }
      // Mood filter
      if (selectedMood !== "All" && e.mood?.toLowerCase() !== selectedMood.toLowerCase()) {
        return false;
      }
      // Tag filter
      if (selectedTag && !e.discoveries.includes(selectedTag)) {
        return false;
      }
      return true;
    });
  }, [journal, search, selectedMood, selectedTag]);

  const exportJson = () => {
    const blob = new Blob([actions.exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wildsense-journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("JSON backup downloaded");
  };

  const exportMarkdown = () => {
    if (!journal.length) return;
    const mdLines = [
      "# WildSense Field Journal",
      `*Exported on ${new Date().toLocaleDateString()} · ${journal.length} entries · ${minutes} minutes outside*`,
      "",
      "---",
      "",
      ...journal.map((e) => {
        const dateStr = new Date(e.createdAt).toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return [
          `## ${e.missionTitle}`,
          `**Date**: ${dateStr} | **Time**: ${e.minutes} min${e.mood ? ` | **State**: ${e.mood}` : ""}`,
          "",
          e.note ? `> "${e.note}"\n` : "",
          e.discoveries.length > 0 ? `**Discoveries**: ${e.discoveries.map((d) => `\`${d}\``).join(", ")}\n` : "",
          e.aiReflection ? `**Naturalist Reflection**:\n${e.aiReflection}\n` : "",
          "---",
          "",
        ].join("\n");
      }),
    ];

    const blob = new Blob([mdLines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wildsense-field-notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Markdown Field Notes exported");
  };

  const restore = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!confirm("Replace your current journal with this backup?")) return;
      if (actions.restore(data)) toast.success("Journal restored successfully");
      else toast.error("That file doesn't look like a WildSense journal.");
    } catch {
      toast.error("Couldn't read that file.");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedMood("All");
    setSelectedTag(null);
  };

  return (
    <div className="paper-grain min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-5 pb-28 pt-36 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="eyebrow text-earth">Your field journal</p>
            <h1 className="mt-3 font-display text-6xl leading-[0.95] md:text-8xl">
              Little things <em className="text-moss">worth keeping.</em>
            </h1>
          </div>

          {/* Naturalist Rank Badge */}
          {journal.length > 0 && (
            <div className="rounded-xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-sm md:max-w-xs">
              <div className="flex items-center gap-2">
                <span className="text-lg">{rank.badge}</span>
                <p className="font-display text-xl leading-tight text-foreground">{rank.title}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{rank.desc}</p>
            </div>
          )}
        </div>

        {/* Stats Summary Bar */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-y py-4 text-sm">
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{journal.length}</span> adventures ·{" "}
            <span className="font-semibold text-foreground">{minutes}</span> minutes outside ·{" "}
            <span className="font-semibold text-foreground">{totalDiscoveries}</span> discoveries
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={exportMarkdown}
              disabled={!journal.length}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-40"
              title="Export as Markdown for Obsidian or Notion"
            >
              <FileText className="h-3.5 w-3.5 text-moss" />
              <span>Markdown</span>
            </button>
            <button
              onClick={exportJson}
              disabled={!journal.length}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-40"
              title="Export full JSON backup"
            >
              <Download className="h-3.5 w-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => file.current?.click()}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
              title="Restore journal from file"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Restore</span>
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])}
            />
          </div>
        </div>

        {journal.length > 0 && (
          <div className="mt-8 space-y-5">
            {/* Search and Filters Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search notes, mission titles, or discoveries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-border bg-card/60 py-2 pl-10 pr-9 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-moss focus:ring-1 focus:ring-moss"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Mood Filter Selectors */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {MOOD_FILTERS.map((m) => {
                  const isSelected = selectedMood.toLowerCase() === m.toLowerCase();
                  return (
                    <button
                      key={m}
                      onClick={() => setSelectedMood(isSelected && m !== "All" ? "All" : m)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs transition capitalize whitespace-nowrap",
                        isSelected
                          ? "bg-moss text-ivory font-medium"
                          : "bg-secondary/70 text-secondary-foreground hover:bg-secondary",
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discovery Tags Bar */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                <span className="text-muted-foreground flex items-center gap-1 pr-1">
                  <Tag className="h-3.5 w-3.5" />
                  Discoveries:
                </span>
                {allTags.slice(0, 14).map(([t, count]) => {
                  const isSelected = selectedTag === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedTag(isSelected ? null : t)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs transition",
                        isSelected
                          ? "bg-earth text-ivory font-medium shadow-xs"
                          : "border border-border/70 bg-card/50 text-muted-foreground hover:text-foreground hover:border-moss/40",
                      )}
                    >
                      {t} <span className="text-[10px] opacity-70">({count})</span>
                    </button>
                  );
                })}
                {(selectedTag || selectedMood !== "All" || search) && (
                  <button
                    onClick={clearFilters}
                    className="ml-2 text-xs text-moss hover:underline font-medium"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content list */}
        {journal.length === 0 ? (
          <div className="py-28 text-center">
            <FieldNote className="text-2xl">p. 1</FieldNote>
            <h2 className="mt-3 font-display text-5xl">Your first field note is waiting.</h2>
            <p className="mx-auto mt-4 max-w-sm text-muted-foreground">
              Take a small adventure. Come back with something you noticed.
            </p>
            <Link href="/" className={btn.primary + " mt-8"}>
              Find a mission <Arrow />
            </Link>
          </div>
        ) : filteredJournal.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-3xl text-muted-foreground">No field notes matched your filters.</p>
            <button onClick={clearFilters} className={btn.outline + " mt-4"}>
              Clear search & filters
            </button>
          </div>
        ) : (
          <ol className="relative mt-16 border-l border-border pl-8 md:pl-14">
            <AnimatePresence>
              {filteredJournal.map((e, i) => (
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: Math.min(i, 8) * 0.05 }}
                  className="group relative pb-16"
                >
                  <span className="absolute -left-[37px] top-2 h-2.5 w-2.5 rounded-full bg-moss ring-4 ring-background md:-left-[61px]" />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {new Date(e.createdAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {e.minutes} min
                    </span>
                    {e.mood && (
                      <>
                        <span>·</span>
                        <span className="capitalize rounded-full bg-secondary/80 px-2 py-0.5 text-secondary-foreground font-medium">
                          {e.mood}
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="mt-2 font-display text-4xl">{e.missionTitle}</h3>
                  {e.note && (
                    <p className="mt-4 max-w-2xl font-display text-2xl italic leading-snug text-foreground/85">
                      “{e.note}”
                    </p>
                  )}

                  {e.discoveries.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {e.discoveries.map((d) => (
                        <button
                          key={d}
                          onClick={() => setSelectedTag(selectedTag === d ? null : d)}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs transition cursor-pointer",
                            selectedTag === d
                              ? "bg-earth text-ivory font-medium"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                          )}
                        >
                          #{d}
                        </button>
                      ))}
                    </div>
                  )}

                  {e.aiReflection && (
                    <div className="mt-6 max-w-xl rounded-lg border-l-2 border-sage bg-card/60 p-4 text-sm text-muted-foreground shadow-xs">
                      <p className="eyebrow mb-1 flex items-center gap-1.5 text-moss font-semibold">
                        <Sparkles className="h-3 w-3" />
                        Naturalist Reflection
                      </p>
                      <p className="italic leading-relaxed text-foreground/80">{e.aiReflection}</p>
                    </div>
                  )}

                  <div className="mt-5 flex items-center gap-4">
                    <button
                      onClick={() => confirm("Delete this field note?") && actions.deleteEntry(e.id)}
                      className="text-xs text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus:opacity-100 group-hover:opacity-100"
                    >
                      Delete note
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
