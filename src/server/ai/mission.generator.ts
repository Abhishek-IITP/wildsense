import { Mission } from "@/types";
import { GenerateMissionInputDto } from "../schemas/mission.schema";
import { ollamaClient } from "./ollama.client";
import { validateMissionSafety } from "./output.validator";
import { generateDeterministicFallbackMission } from "./fallback.generator";

const MISSION_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    category: { type: "string", enum: ["Notice", "Listen", "Find", "Reflect", "Move"] },
    steps: { type: "array", items: { type: "string" } },
    curiosity: { type: "string" },
  },
  required: ["title", "description", "category", "steps", "curiosity"],
};

const SYSTEM_PROMPT = `You are WildSense, a gentle naturalist writing a short, safe, specific outdoor nature exploration mission.
Tone: Warm, quiet, concrete, inspiring. No exclamation marks, no emojis, no clichés.
Constraints:
- Title: At most 5 words, title-cased.
- Description: Exactly one clear sentence (max 200 characters).
- Category: Must be one of ["Notice", "Listen", "Find", "Reflect", "Move"].
- Steps: Exactly 3 to 4 short imperative steps.
- Curiosity: Exactly one true, intriguing scientific or natural history fact.
SAFETY RULES (ABSOLUTE):
- NEVER suggest tasting, eating, or foraging unknown plants, berries, leaves, or mushrooms.
- NEVER suggest touching or handling wild animals, snakes, insects, or approaching nests/hives.
- NEVER suggest trespassing, climbing over fences, or entering private property.
- NEVER suggest swimming in deep or fast water, or climbing steep cliffs.
- Always encourage leaving no trace and respecting living things.
Output must be strictly valid JSON according to schema.`;

export interface GenerateMissionResult {
  mission: Mission;
  meta: {
    generationMode: "local-ai" | "fallback";
    fallbackUsed: boolean;
    reason?: string;
  };
}

export async function generateMissionPipeline(input: GenerateMissionInputDto): Promise<GenerateMissionResult> {
  const userPrompt = `Duration: ${input.duration} minutes.
Environment: ${input.environment.slice(0, 80)}.
Interest: ${input.interest.slice(0, 80)}.
Difficulty: ${input.difficulty}.
Respond only with valid JSON.`;

  try {
    const rawOutput = await ollamaClient.chat(SYSTEM_PROMPT, userPrompt, MISSION_JSON_SCHEMA);
    const parsed = JSON.parse(rawOutput);

    const safetyResult = validateMissionSafety(parsed);
    if (!safetyResult.isValid || !safetyResult.sanitized) {
      console.warn("Generated mission failed safety/structure validation:", safetyResult.reasons);
      return {
        mission: generateDeterministicFallbackMission(input),
        meta: {
          generationMode: "fallback",
          fallbackUsed: true,
          reason: `Safety check rejected model output: ${safetyResult.reasons.join(", ")}`,
        },
      };
    }

    const { sanitized } = safetyResult;
    const now = new Date().toISOString();
    const mission: Mission = {
      id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title: sanitized.title,
      description: sanitized.description,
      duration: input.duration,
      difficulty: input.difficulty,
      category: sanitized.category,
      steps: sanitized.steps,
      curiosity: sanitized.curiosity,
      createdAt: now,
      updatedAt: now,
      completed: false,
      version: 1,
      source: "local-ai",
    };

    return {
      mission,
      meta: {
        generationMode: "local-ai",
        fallbackUsed: false,
      },
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Inference error";
    return {
      mission: generateDeterministicFallbackMission(input),
      meta: {
        generationMode: "fallback",
        fallbackUsed: true,
        reason,
      },
    };
  }
}
