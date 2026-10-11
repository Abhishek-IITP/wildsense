import { ReflectionInput } from "../schemas/ai.schema";
import { ollamaClient } from "./ollama.client";
import { validateReflectionSafety } from "./output.validator";
import { generateDeterministicFallbackReflection } from "./fallback.generator";

const REFLECTION_SYSTEM_PROMPT = `You are a gentle naturalist writing a two-sentence reflection in a person's field journal.
Refer only to what they actually recorded — never invent discoveries or species names they did not mention.
First sentence acknowledges what they noticed or felt outside.
Second sentence offers one small contemplative idea for next time they step outside.
No emojis, no exclamation marks, no medical or psychological diagnosis, no marketing clichés.`;

export interface GenerateReflectionResult {
  reflection: string;
  source: "local-ai" | "fallback";
}

export async function generateReflectionPipeline(input: ReflectionInput): Promise<GenerateReflectionResult> {
  const userPrompt = `Mission: ${input.missionTitle.slice(0, 100)}
Minutes outside: ${input.minutes}
Mood: ${input.mood.slice(0, 40)}
User notes: ${input.note.slice(0, 500)}
Discoveries: ${input.discoveries.slice(0, 10).join(", ")}`;

  try {
    const rawOutput = await ollamaClient.chat(REFLECTION_SYSTEM_PROMPT, userPrompt, undefined, 30000);
    const cleaned = rawOutput.trim();

    const safety = validateReflectionSafety({ reflection: cleaned });
    if (!safety.isValid || !safety.sanitized) {
      console.warn("Generated reflection failed safety checks:", safety.reasons);
      const fallback = generateDeterministicFallbackReflection(input);
      return { reflection: fallback.reflection, source: "fallback" };
    }

    return { reflection: safety.sanitized.reflection, source: "local-ai" };
  } catch {
    const fallback = generateDeterministicFallbackReflection(input);
    return { reflection: fallback.reflection, source: "fallback" };
  }
}
