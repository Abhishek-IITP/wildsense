import { Collection, Filter } from "mongodb";
import { getDatabase } from "../database/mongodb";
import { MissionDto, MissionFilterQueryDto } from "../schemas/mission.schema";
import { ConflictError, NotFoundError } from "../middleware/error-handler";

export class MissionRepository {
  private async col(): Promise<Collection<MissionDto>> {
    const db = await getDatabase();
    return db.collection<MissionDto>("missions");
  }

  public async listMissions(filter: MissionFilterQueryDto): Promise<{ items: MissionDto[]; total: number }> {
    const col = await this.col();
    const query: Filter<MissionDto> = {};

    if (filter.category) {
      query.category = filter.category;
    }
    if (filter.difficulty) {
      query.difficulty = filter.difficulty;
    }
    if (filter.duration) {
      query.duration = { $lte: filter.duration };
    }

    const total = await col.countDocuments(query);
    const items = await col
      .find(query)
      .sort({ createdAt: -1 })
      .skip(filter.offset)
      .limit(filter.limit)
      .toArray();

    return { items, total };
  }

  public async getMissionById(id: string): Promise<MissionDto | null> {
    const col = await this.col();
    return col.findOne({ id });
  }

  public async saveMission(mission: MissionDto): Promise<MissionDto> {
    const col = await this.col();
    // Idempotent upsert by stable id
    await col.updateOne(
      { id: mission.id },
      {
        $set: {
          title: mission.title,
          description: mission.description,
          duration: mission.duration,
          difficulty: mission.difficulty,
          category: mission.category,
          steps: mission.steps,
          curiosity: mission.curiosity,
          source: mission.source,
          updatedAt: mission.updatedAt,
          completed: mission.completed,
          version: mission.version,
          ...(mission.image ? { image: mission.image } : {}),
        },
        $setOnInsert: {
          id: mission.id,
          createdAt: mission.createdAt,
        },
      },
      { upsert: true },
    );

    return (await this.getMissionById(mission.id)) ?? mission;
  }

  public async updateMission(
    id: string,
    patch: Partial<MissionDto>,
    expectedVersion?: number,
  ): Promise<MissionDto> {
    const col = await this.col();
    const existing = await col.findOne({ id });
    if (!existing) {
      throw new NotFoundError(`Mission with ID ${id} not found.`);
    }

    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      throw new ConflictError(
        `Version conflict: server has version ${existing.version}, expected ${expectedVersion}.`,
      );
    }

    const nextVersion = existing.version + 1;
    const now = new Date().toISOString();

    const updateDoc: Partial<MissionDto> = {
      ...patch,
      updatedAt: now,
      version: nextVersion,
    };
    delete (updateDoc as Record<string, unknown>)["id"];
    delete (updateDoc as Record<string, unknown>)["createdAt"];

    await col.updateOne({ id }, { $set: updateDoc });
    return (await this.getMissionById(id))!;
  }

  public async deleteMission(id: string): Promise<boolean> {
    const col = await this.col();
    const existing = await col.findOne({ id });
    if (!existing) {
      return false;
    }
    if (existing.source === "seed" || existing.source === "sample") {
      throw new ConflictError("Built-in seed missions cannot be deleted.");
    }
    const res = await col.deleteOne({ id });
    return res.deletedCount > 0;
  }

  public async getMissionsSince(sinceIso: string): Promise<MissionDto[]> {
    const col = await this.col();
    return col.find({ updatedAt: { $gt: sinceIso } }).toArray();
  }
}

export const missionRepository = new MissionRepository();
