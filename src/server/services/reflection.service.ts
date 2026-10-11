import { ReflectionInput } from "../schemas/ai.schema";
import { generateReflectionPipeline, GenerateReflectionResult } from "../ai/reflection.generator";
import { journalRepository } from "../repositories/journal.repository";

export class ReflectionService {
  public async generateReflection(
    input: ReflectionInput,
    journalId?: string,
  ): Promise<GenerateReflectionResult & { journalId?: string }> {
    const result = await generateReflectionPipeline(input);

    if (journalId && result.reflection) {
      try {
        await journalRepository.updateJournalEntry(journalId, {
          aiReflection: result.reflection,
          aiReflectionStatus: "completed",
        });
      } catch {
        // Failing to update DB does not fail the reflection response
      }
    }

    return {
      ...result,
      journalId,
    };
  }

  public async getReflectionStatus(journalId: string): Promise<{
    status: "completed" | "pending" | "unavailable";
    reflection?: string;
  }> {
    try {
      const entry = await journalRepository.getJournalById(journalId);
      if (!entry) {
        return { status: "unavailable" };
      }
      return {
        status: entry.aiReflectionStatus ?? (entry.aiReflection ? "completed" : "unavailable"),
        reflection: entry.aiReflection,
      };
    } catch {
      return { status: "unavailable" };
    }
  }
}

export const reflectionService = new ReflectionService();
