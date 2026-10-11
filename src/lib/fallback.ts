import type { Category, GeneratorInput, Mission } from "./types";

/** Deterministic built-in generator used when local AI is unavailable. */
const INTEREST_MAP: Record<string, { category: Category; titles: string[]; steps: string[]; curiosity: string }> = {
  "Notice small details": {
    category: "Notice",
    titles: ["The close look", "Smaller than a coin", "Hidden in plain sight"],
    steps: [
      "Choose one spot and crouch down to its level.",
      "Find something smaller than your fingernail.",
      "Notice three textures you could describe to a friend.",
      "Look for one sign that something has changed recently.",
    ],
    curiosity: "Most of the life around you is under one centimetre tall.",
  },
  "Listen to natural sounds": {
    category: "Listen",
    titles: ["The sound map", "Quiet layers", "What the wind carries"],
    steps: [
      "Find somewhere to sit or stand still.",
      "Close your eyes and count every sound for one minute.",
      "Sort them: near or far, natural or human.",
      "Choose one natural sound and follow it until it fades.",
    ],
    curiosity: "Your ears can pick out direction faster than your eyes can turn.",
  },
  "Find colours and textures": {
    category: "Find",
    titles: ["The colour hunt", "Five greens", "A palette of the ground"],
    steps: [
      "Look for five different shades of one colour.",
      "Touch three textures: rough, smooth and something in between.",
      "Find one colour you did not expect to see.",
      "Leave everything where it was.",
    ],
    curiosity: "Leaves look green because they use red and blue light and reflect the rest.",
  },
  "Learn about plants": {
    category: "Find",
    titles: ["Plant portraits", "Leaf detective", "Who lives here?"],
    steps: [
      "Pick one plant and study it from root to tip.",
      "Count its leaves, or notice how they are arranged.",
      "Find another plant that looks like a relative.",
      "Notice what grows nearby — plants rarely live alone.",
    ],
    curiosity: "Many plants arrange leaves in spirals so each one catches its own light.",
  },
  "Take a mindful pause": {
    category: "Reflect",
    titles: ["Five slow breaths", "A still moment", "The pause"],
    steps: [
      "Find somewhere comfortable to sit.",
      "Take five slow breaths and notice the air temperature.",
      "Name one thing you can see, hear, and feel.",
      "Stay a little longer than feels natural.",
    ],
    curiosity: "Even a few minutes among plants can slow your heart rate.",
  },
  "Move and explore": {
    category: "Move",
    titles: ["Follow the curve", "A new route", "The wandering path"],
    steps: [
      "Take a route you have not walked before.",
      "At each turn, choose the more interesting direction.",
      "Stop every few minutes to look up.",
      "Walk back slowly and notice what looks different.",
    ],
    curiosity: "Walking a familiar place backwards reveals details you never noticed.",
  },
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function builtInMission(input: GeneratorInput): Mission {
  const spec = INTEREST_MAP[input.interest] ?? INTEREST_MAP["Notice small details"]!;
  const seed = hash(JSON.stringify(input) + new Date().toDateString());
  const title = spec.titles[seed % spec.titles.length]!;
  const place = input.environment.toLowerCase();
  const steps = [...spec.steps];
  if (input.difficulty === "Explorer") steps.push("Go a little further than you planned, then return the same way.");
  if (input.environment.includes("little greenery"))
    steps[0] = "Look for nature in cracks, walls, sky and edges — it is always there.";
  const now = new Date().toISOString();
  return {
    id: `m-${Date.now().toString(36)}`,
    title,
    description: `A ${input.duration}-minute invitation for your ${place}. Slow down and see what has been here all along.`,
    duration: input.duration,
    difficulty: input.difficulty,
    category: spec.category,
    steps,
    curiosity: spec.curiosity,
    createdAt: now,
    updatedAt: now,
    completed: false,
    version: 1,
    source: "built-in",
  };
}

export function isValidMission(m: unknown): m is Pick<Mission, "title" | "description" | "steps" | "curiosity"> & { category?: Category } {
  if (!m || typeof m !== "object") return false;
  const o = m as { title?: unknown; description?: unknown; curiosity?: unknown; steps?: unknown };
  return (
    typeof o.title === "string" &&
    o.title.length > 0 &&
    typeof o.description === "string" &&
    typeof o.curiosity === "string" &&
    Array.isArray(o.steps) &&
    o.steps.length >= 2 &&
    o.steps.every((s) => typeof s === "string")
  );
}
