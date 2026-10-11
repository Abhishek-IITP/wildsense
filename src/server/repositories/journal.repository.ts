import { Collection, Filter } from "mongodb";
import { getDatabase } from "../database/mongodb";
import { JournalEntryDto, JournalQueryDto } from "../schemas/journal.schema";
import { ConflictError, NotFoundError } from "../middleware/error-handler";

export class JournalRepository {
  private async col(): Promise<Collection<JournalEntryDto>> {
    const db = await getDatabase();
    return db.collection<JournalEntryDto>("journal");
  }

  public async listJournal(query: JournalQueryDto): Promise<{ items: JournalEntryDto[]; total: number }> {
    const col = await this.col();
    const filter: Filter<JournalEntryDto> = {};

    if (!query.includeDeleted) {
      filter.$or = [{ deletedAt: { $exists: false } }, { deletedAt: null }];
    }

    const total = await col.countDocuments(filter);
    const items = await col
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(query.offset)
      .limit(query.limit)
      .toArray();

    return { items, total };
  }

  public async getJournalById(id: string): Promise<JournalEntryDto | null> {
    const col = await this.col();
    return col.findOne({ id });
  }

  public async saveJournalEntry(entry: JournalEntryDto): Promise<JournalEntryDto> {
    const col = await this.col();
    // Idempotent upsert by stable ID
    await col.updateOne(
      { id: entry.id },
      {
        $set: {
          missionId: entry.missionId,
          missionTitle: entry.missionTitle,
          note: entry.note,
          discoveries: entry.discoveries,
          mood: entry.mood,
          minutes: entry.minutes,
          updatedAt: entry.updatedAt,
          aiReflection: entry.aiReflection,
          aiReflectionStatus: entry.aiReflectionStatus,
          version: entry.version,
          deletedAt: entry.deletedAt ?? null,
        },
        $setOnInsert: {
          id: entry.id,
          createdAt: entry.createdAt,
        },
      },
      { upsert: true },
    );

    return (await this.getJournalById(entry.id)) ?? entry;
  }

  public async updateJournalEntry(
    id: string,
    patch: Partial<JournalEntryDto>,
    expectedVersion?: number,
  ): Promise<JournalEntryDto> {
    const col = await this.col();
    const existing = await col.findOne({ id });
    if (!existing) {
      throw new NotFoundError(`Journal entry with ID ${id} not found.`);
    }

    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      throw new ConflictError(
        `Version conflict: server has version ${existing.version}, expected ${expectedVersion}.`,
      );
    }

    const nextVersion = existing.version + 1;
    const now = new Date().toISOString();

    const updateDoc: Partial<JournalEntryDto> = {
      ...patch,
      updatedAt: now,
      version: nextVersion,
    };
    delete (updateDoc as Record<string, unknown>)["id"];
    delete (updateDoc as Record<string, unknown>)["createdAt"];

    await col.updateOne({ id }, { $set: updateDoc });
    return (await this.getJournalById(id))!;
  }

  public async deleteJournalEntry(id: string, tombstone = true): Promise<boolean> {
    const col = await this.col();
    const existing = await col.findOne({ id });
    if (!existing) {
      return false;
    }

    if (tombstone) {
      // Soft deletion tombstone for synchronization
      const now = new Date().toISOString();
      await col.updateOne(
        { id },
        {
          $set: {
            deletedAt: now,
            updatedAt: now,
            version: existing.version + 1,
          },
        },
      );
      return true;
    } else {
      const res = await col.deleteOne({ id });
      return res.deletedCount > 0;
    }
  }

  public async getJournalSince(sinceIso: string): Promise<JournalEntryDto[]> {
    const col = await this.col();
    return col.find({ updatedAt: { $gt: sinceIso } }).toArray();
  }
}

export const journalRepository = new JournalRepository();
