import { JournalEntry } from "@/types";
import { CreateJournalDto, JournalQueryDto, UpdateJournalDto } from "../schemas/journal.schema";
import { journalRepository } from "../repositories/journal.repository";
import { NotFoundError } from "../middleware/error-handler";

export class JournalService {
  public async listJournal(query: JournalQueryDto): Promise<{ items: JournalEntry[]; total: number }> {
    return journalRepository.listJournal(query);
  }

  public async getJournalById(id: string): Promise<JournalEntry> {
    const entry = await journalRepository.getJournalById(id);
    if (!entry) {
      throw new NotFoundError(`Journal entry with ID ${id} not found.`);
    }
    return entry;
  }

  public async createEntry(dto: CreateJournalDto): Promise<JournalEntry> {
    const now = new Date().toISOString();
    const aiReflectionStatus: "pending" | "completed" | "unavailable" = dto.aiReflection
      ? "completed"
      : dto.aiReflectionStatus ?? "unavailable";

    const entry: JournalEntry = {
      id: dto.id || `j-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      missionId: dto.missionId,
      missionTitle: dto.missionTitle,
      note: dto.note ?? "",
      discoveries: dto.discoveries ?? [],
      mood: dto.mood ?? "",
      minutes: dto.minutes ?? 0,
      createdAt: dto.createdAt || now,
      updatedAt: now,
      aiReflection: dto.aiReflection,
      aiReflectionStatus,
      version: 1,
      deletedAt: null,
    };

    return journalRepository.saveJournalEntry({
      ...entry,
      aiReflectionStatus,
    });
  }

  public async updateEntry(id: string, dto: UpdateJournalDto): Promise<JournalEntry> {
    return journalRepository.updateJournalEntry(id, dto, dto.version);
  }

  public async deleteEntry(id: string): Promise<boolean> {
    return journalRepository.deleteJournalEntry(id, true);
  }
}

export const journalService = new JournalService();
