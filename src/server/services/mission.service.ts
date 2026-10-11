import { SAMPLE_MISSIONS } from "@/data/missions";
import { Mission } from "@/types";
import {
  CreateMissionDto,
  GenerateMissionInputDto,
  MissionFilterQueryDto,
  UpdateMissionDto,
} from "../schemas/mission.schema";
import { missionRepository } from "../repositories/mission.repository";
import { generateMissionPipeline, GenerateMissionResult } from "../ai/mission.generator";
import { ConflictError, NotFoundError } from "../middleware/error-handler";

export class MissionService {
  public async listMissions(filter: MissionFilterQueryDto): Promise<{ items: Mission[]; total: number }> {
    let dbItems: Mission[] = [];
    try {
      const dbResult = await missionRepository.listMissions(filter);
      dbItems = dbResult.items;
    } catch {
      // MongoDB unavailable: fallback to built-in sample missions gracefully
    }

    // Combine sample missions and db items (avoiding duplicate IDs)
    const dbIds = new Set(dbItems.map((m) => m.id));
    const sampleMatches = SAMPLE_MISSIONS.filter((m) => {
      if (dbIds.has(m.id)) return false;
      if (filter.category && m.category !== filter.category) return false;
      if (filter.difficulty && m.difficulty !== filter.difficulty) return false;
      if (filter.duration && m.duration > filter.duration) return false;
      return true;
    });

    const combined = [...sampleMatches, ...dbItems];
    const paginated = combined.slice(filter.offset, filter.offset + filter.limit);

    return {
      items: paginated,
      total: combined.length,
    };
  }

  public async getMissionById(id: string): Promise<Mission> {
    const sample = SAMPLE_MISSIONS.find((m) => m.id === id);
    if (sample) {
      return sample;
    }

    try {
      const dbMission = await missionRepository.getMissionById(id);
      if (dbMission) {
        return dbMission;
      }
    } catch {
      // Fall through to not found
    }

    throw new NotFoundError(`Mission with ID ${id} not found.`);
  }

  public async generateMission(input: GenerateMissionInputDto): Promise<GenerateMissionResult> {
    const result = await generateMissionPipeline(input);

    // Persist to MongoDB if reachable (idempotent, won't fail if DB is offline)
    try {
      await missionRepository.saveMission(result.mission);
    } catch {
      // Offline mode: mission is still returned to client for local storage
    }

    return result;
  }

  public async saveMission(dto: CreateMissionDto): Promise<Mission> {
    const now = new Date().toISOString();
    const mission: Mission = {
      id: dto.id || `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title: dto.title,
      description: dto.description,
      duration: dto.duration,
      difficulty: dto.difficulty,
      category: dto.category,
      steps: dto.steps,
      curiosity: dto.curiosity,
      source: dto.source ?? "local-ai",
      createdAt: now,
      updatedAt: now,
      completed: dto.completed ?? false,
      version: 1,
    };

    try {
      return await missionRepository.saveMission(mission);
    } catch {
      // Return memory mission if DB is offline
      return mission;
    }
  }

  public async updateMission(id: string, patch: UpdateMissionDto): Promise<Mission> {
    if (SAMPLE_MISSIONS.some((m) => m.id === id)) {
      throw new ConflictError("Built-in seed missions are immutable.");
    }

    return missionRepository.updateMission(id, patch, patch.version);
  }

  public async deleteMission(id: string): Promise<boolean> {
    if (SAMPLE_MISSIONS.some((m) => m.id === id)) {
      throw new ConflictError("Built-in seed missions cannot be deleted.");
    }

    return missionRepository.deleteMission(id);
  }
}

export const missionService = new MissionService();
