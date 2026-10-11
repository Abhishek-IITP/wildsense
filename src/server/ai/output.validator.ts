import { MissionPromptOutput, ReflectionOutput } from "../schemas/ai.schema";

const UNSAFE_MISSION_PATTERNS = [
  // Ingestion / Tasting / Foraging to eat
  /\b(eat|taste|chew|consume|swallow|ingest|nibble|brew\s+tea\s+from|forage\s+for\s+food)\b/i,
  /\b(edible|toxic|poisonous)\b.*?\b(try|test|take\s+a\s+bite)\b/i,

  // Dangerous Wildlife Interaction
  /\b(touch|grab|catch|hold|pick\s+up|pet|chase|corner)\b.*?\b(snake|wasp|bee|spider|scorpion|badger|fox|bear|wildlife|animal|bird)\b/i,
  /\b(approach|disturb|touch)\b.*?\b(nest|hive|burrow|den|eggs)\b/i,

  // Trespassing / Property
  /\b(trespass|private\s+property|climb\s+fence|cross\s+gate|private\s+land|restricted\s+area|no\s+entry)\b/i,

  // Hazardous Terrain / Water
  /\b(swim|dive|wade\s+deep|fast\s+river|swift\s+current|deep\s+water)\b/i,
  /\b(climb\s+cliff|edge\s+of\s+cliff|rock\s+climbing|steep\s+drop|quarry|enter\s+cave)\b/i,

  // Destructive Actions
  /\b(dig\s+up|uproot|strip\s+bark|break\s+living|cut\s+down)\b/i,

  // Hazardous Behavior
  /\b(walk\s+with\s+eyes\s+closed\s+near\s+traffic|cross\s+road\s+without\s+looking)\b/i,
];

const UNSAFE_REFLECTION_PATTERNS = [
  // Medical / Mental Health diagnosis
  /\b(you\s+have|symptoms\s+of|diagnosed\s+with|clinical|depression|anxiety\s+disorder|pathology|therapy\s+needed)\b/i,
  // Manipulative engagement traps
  /\b(you\s+must\s+return\s+every\s+day\s+or|don't\s+break\s+your\s+streak|stay\s+on\s+this\s+app)\b/i,
];

export interface ValidationResult<T> {
  isValid: boolean;
  sanitized?: T;
  reasons: string[];
}

export function validateMissionSafety(output: unknown): ValidationResult<MissionPromptOutput> {
  const reasons: string[] = [];

  if (!output || typeof output !== "object") {
    return { isValid: false, reasons: ["Output is not an object"] };
  }

  const candidate = output as Partial<MissionPromptOutput>;

  // Check required text fields
  if (!candidate.title || typeof candidate.title !== "string" || candidate.title.length < 2) {
    reasons.push("Title missing or too short");
  }
  if (!candidate.description || typeof candidate.description !== "string" || candidate.description.length < 5) {
    reasons.push("Description missing or too short");
  }
  if (!Array.isArray(candidate.steps) || candidate.steps.length < 2) {
    reasons.push("Steps must contain at least 2 instructions");
  }
  if (!candidate.curiosity || typeof candidate.curiosity !== "string") {
    reasons.push("Curiosity fact missing");
  }

  if (reasons.length > 0) {
    return { isValid: false, reasons };
  }

  // Length bounds
  const title = candidate.title!.slice(0, 60).trim();
  const description = candidate.description!.slice(0, 240).trim();
  const steps = candidate.steps!.slice(0, 5).map((s) => String(s).slice(0, 200).trim());
  const curiosity = candidate.curiosity!.slice(0, 280).trim();
  const category = candidate.category ?? "Notice";

  // Safety pattern checks across all combined text
  const fullText = `${title} ${description} ${steps.join(" ")} ${curiosity}`;

  for (const pattern of UNSAFE_MISSION_PATTERNS) {
    if (pattern.test(fullText)) {
      reasons.push(`Contains prohibited instruction matching safety rule: ${pattern.source}`);
    }
  }

  if (reasons.length > 0) {
    return { isValid: false, reasons };
  }

  return {
    isValid: true,
    sanitized: {
      title,
      description,
      steps,
      curiosity,
      category,
    },
    reasons: [],
  };
}

export function validateReflectionSafety(output: unknown): ValidationResult<ReflectionOutput> {
  const reasons: string[] = [];

  if (!output || typeof output !== "object") {
    return { isValid: false, reasons: ["Output is not an object"] };
  }

  const candidate = output as Partial<ReflectionOutput>;
  if (!candidate.reflection || typeof candidate.reflection !== "string" || candidate.reflection.trim().length === 0) {
    return { isValid: false, reasons: ["Reflection text is empty"] };
  }

  const reflection = candidate.reflection.trim().slice(0, 600);

  for (const pattern of UNSAFE_REFLECTION_PATTERNS) {
    if (pattern.test(reflection)) {
      reasons.push(`Contains disallowed reflection content: ${pattern.source}`);
    }
  }

  if (reasons.length > 0) {
    return { isValid: false, reasons };
  }

  return {
    isValid: true,
    sanitized: { reflection },
    reasons: [],
  };
}
