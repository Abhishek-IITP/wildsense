import { Category, Difficulty, Mission } from "@/types";
import { GenerateMissionInputDto } from "../schemas/mission.schema";
import { ReflectionInput, ReflectionOutput } from "../schemas/ai.schema";

interface FallbackSpec {
  category: Category;
  titles: string[];
  steps: string[];
  curiosity: string;
}

const FALLBACK_INTERESTS: Record<string, FallbackSpec> = {
  "Notice small details": {
    category: "Notice",
    titles: ["The close look", "Smaller than a coin", "Hidden in plain sight"],
    steps: [
      "Choose one safe spot and crouch down to its level without stepping on plants.",
      "Find something smaller than your fingernail.",
      "Notice three distinct textures you could describe to a friend.",
      "Look for one subtle sign that something has changed recently.",
    ],
    curiosity: "Most of the living organisms around you are less than one centimetre tall.",
  },
  "Listen to natural sounds": {
    category: "Listen",
    titles: ["The sound map", "Quiet layers", "What the wind carries"],
    steps: [
      "Find a comfortable, safe place to sit or stand still.",
      "Close your eyes and count every sound you hear for one full minute.",
      "Sort them gently in your mind: near or far, natural or human.",
      "Choose one natural sound and follow it patiently until it fades.",
    ],
    curiosity: "Human ears can detect the direction of a sound faster than eyes can turn to look.",
  },
  "Find colours and textures": {
    category: "Find",
    titles: ["The colour hunt", "Five greens", "A palette of the ground"],
    steps: [
      "Look for five different shades of one colour in your immediate surroundings.",
      "Touch three safe textures: rough, smooth, and something in between.",
      "Find one colour you did not expect to notice today.",
      "Leave every natural element resting exactly where it was.",
    ],
    curiosity: "Leaves appear green because chlorophyll absorbs red and blue light and reflects the green wavelengths.",
  },
  "Learn about plants": {
    category: "Find",
    titles: ["Plant portraits", "Leaf detective", "Who lives here?"],
    steps: [
      "Select one plant and study it from stem to tip without picking leaves.",
      "Notice how its leaves are arranged: alternate, opposite, or in a rosette.",
      "Look for another plant nearby that shares similar characteristics.",
      "Notice what thrives alongside it — plants rarely grow in isolation.",
    ],
    curiosity: "Many plants arrange their leaves in golden ratio spirals so every leaf catches maximum sunlight.",
  },
  "Take a mindful pause": {
    category: "Reflect",
    titles: ["Five slow breaths", "A still moment", "The gentle pause"],
    steps: [
      "Find somewhere comfortable to rest for a few minutes.",
      "Take five slow, deep breaths and notice the temperature of the air.",
      "Name one thing you can see, hear, and feel right now.",
      "Stay a little longer than feels customary before picking up your phone.",
    ],
    curiosity: "Spending even twenty minutes in nature measurably lowers cortisol and heart rate.",
  },
  "Move and explore": {
    category: "Move",
    titles: ["Follow the curve", "A new route", "The wandering path"],
    steps: [
      "Take a safe pathway or sidewalk you have not walked before.",
      "At each safe turn, choose the direction that looks greener or quieter.",
      "Stop every few minutes to look up into tree canopies or the sky.",
      "Walk back slowly and notice three details that look different in reverse.",
    ],
    curiosity: "Walking a familiar route in reverse engages different spatial memory networks in the brain.",
  },
};

function computeDeterministicHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function generateDeterministicFallbackMission(input: GenerateMissionInputDto): Mission {
  const spec = FALLBACK_INTERESTS[input.interest] ?? FALLBACK_INTERESTS["Notice small details"]!;
  const seedString = `${input.environment}-${input.interest}-${input.duration}-${input.difficulty}`;
  const seed = computeDeterministicHash(seedString);
  const title = spec.titles[seed % spec.titles.length]!;
  const place = input.environment.toLowerCase();
  const steps = [...spec.steps];

  if (input.difficulty === "Explorer") {
    steps.push("Go a little further than you planned, then return along the same safe path.");
  }
  if (input.environment.toLowerCase().includes("little greenery")) {
    steps[0] = "Look for signs of life in pavement cracks, old brickwork, sky, and stone edges.";
  }

  const now = new Date().toISOString();
  return {
    id: `m-fb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    description: `A ${input.duration}-minute invitation for your ${place}. Slow down and see what has been here all along.`,
    duration: input.duration,
    difficulty: input.difficulty as Difficulty,
    category: spec.category,
    steps,
    curiosity: spec.curiosity,
    createdAt: now,
    updatedAt: now,
    completed: false,
    version: 1,
    source: "fallback",
  };
}

export function generateDeterministicFallbackReflection(input: ReflectionInput): ReflectionOutput {
  const noteSnippet = input.note ? `You spent quiet time noticing "${input.note.slice(0, 80)}" during ${input.missionTitle}.` : `You spent quiet time outside during ${input.missionTitle}.`;
  const discoverySnippet = input.discoveries.length > 0 ? ` Preserving discoveries like ${input.discoveries.slice(0, 3).join(", ")} keeps the memory alive.` : " Keeping these observations sharpens the eye for next time.";
  return {
    reflection: `${noteSnippet}${discoverySnippet} Next time you step outside, see if you can spot a similar sign in a different place.`.slice(0, 600),
  };
}
