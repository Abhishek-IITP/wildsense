import { JournalEntry, Mission, SyncBatchRequest, SyncBatchResponse, SyncMutation } from "@/types";
import { missionRepository } from "../repositories/mission.repository";
import { journalRepository } from "../repositories/journal.repository";
import { syncRepository } from "../repositories/sync.repository";
import { MissionSchema } from "../schemas/mission.schema";
import { JournalEntrySchema } from "../schemas/journal.schema";

export class SyncService {
  public async processSyncBatch(batch: SyncBatchRequest): Promise<SyncBatchResponse> {
    const syncedMutationIds: string[] = [];
    const conflicts: SyncBatchResponse["conflicts"] = [];

    // Retrieve client's last sync metadata
    const clientMeta = await syncRepository.getClientMeta(batch.clientId);
    const lastSyncIso = clientMeta?.lastSyncedAt ?? new Date(0).toISOString();

    for (const mutation of batch.mutations) {
      try {
        if (mutation.entityType === "journal") {
          const conflict = await this.applyJournalMutation(mutation);
          if (conflict) {
            conflicts.push(conflict);
          } else {
            syncedMutationIds.push(mutation.mutationId);
          }
        } else if (mutation.entityType === "mission") {
          const conflict = await this.applyMissionMutation(mutation);
          if (conflict) {
            conflicts.push(conflict);
          } else {
            syncedMutationIds.push(mutation.mutationId);
          }
        }
      } catch (err) {
        console.error(`Failed to apply mutation ${mutation.mutationId}:`, err);
        // Do not add to syncedMutationIds so client can retry or inspect
      }
    }

    // Fetch server changes that happened since last sync
    const [missionsSince, journalSince] = await Promise.all([
      missionRepository.getMissionsSince(lastSyncIso).catch(() => [] as Mission[]),
      journalRepository.getJournalSince(lastSyncIso).catch(() => [] as JournalEntry[]),
    ]);

    const newVersion = (clientMeta?.lastSyncedVersion ?? 0) + syncedMutationIds.length;
    await syncRepository.updateClientMeta(batch.clientId, newVersion);

    return {
      success: true,
      syncedMutationIds,
      conflicts,
      serverChanges: {
        missions: missionsSince,
        journal: journalSince,
      },
      currentServerVersion: newVersion,
    };
  }

  private async applyJournalMutation(
    mutation: SyncMutation,
  ): Promise<SyncBatchResponse["conflicts"][number] | null> {
    const existing = await journalRepository.getJournalById(mutation.entityId);

    if (mutation.action === "delete") {
      if (existing) {
        if (existing.version > mutation.version) {
          return {
            entityId: mutation.entityId,
            entityType: "journal",
            serverVersion: existing.version,
            clientVersion: mutation.version,
            serverData: existing,
            message: "Server has a newer edit; deletion paused.",
          };
        }
        await journalRepository.deleteJournalEntry(mutation.entityId, true);
      }
      return null;
    }

    // Upsert action
    const data = mutation.data as Partial<JournalEntry>;
    if (existing) {
      if (existing.version > mutation.version) {
        return {
          entityId: mutation.entityId,
          entityType: "journal",
          serverVersion: existing.version,
          clientVersion: mutation.version,
          serverData: existing,
          message: "Server has a newer edit; client changes were not automatically overwritten.",
        };
      }
    }

    const now = new Date().toISOString();
    const parsed = JournalEntrySchema.safeParse({
      id: mutation.entityId,
      missionId: data.missionId ?? existing?.missionId ?? "unknown",
      missionTitle: data.missionTitle ?? existing?.missionTitle ?? "Field Mission",
      note: data.note ?? existing?.note ?? "",
      discoveries: data.discoveries ?? existing?.discoveries ?? [],
      mood: data.mood ?? existing?.mood ?? "",
      minutes: data.minutes ?? existing?.minutes ?? 0,
      createdAt: data.createdAt ?? existing?.createdAt ?? now,
      updatedAt: now,
      aiReflection: data.aiReflection ?? existing?.aiReflection,
      aiReflectionStatus: data.aiReflectionStatus ?? existing?.aiReflectionStatus ?? "unavailable",
      version: Math.max((existing?.version ?? 0) + 1, mutation.version),
      deletedAt: data.deletedAt ?? null,
    });

    if (parsed.success) {
      await journalRepository.saveJournalEntry(parsed.data);
    }

    return null;
  }

  private async applyMissionMutation(
    mutation: SyncMutation,
  ): Promise<SyncBatchResponse["conflicts"][number] | null> {
    const existing = await missionRepository.getMissionById(mutation.entityId);

    if (mutation.action === "delete") {
      if (existing) {
        if (existing.version > mutation.version) {
          return {
            entityId: mutation.entityId,
            entityType: "mission",
            serverVersion: existing.version,
            clientVersion: mutation.version,
            serverData: existing,
            message: "Server has a newer mission version; deletion paused.",
          };
        }
        await missionRepository.deleteMission(mutation.entityId);
      }
      return null;
    }

    // Upsert action
    const data = mutation.data as Partial<Mission>;
    if (existing && existing.version > mutation.version) {
      return {
        entityId: mutation.entityId,
        entityType: "mission",
        serverVersion: existing.version,
        clientVersion: mutation.version,
        serverData: existing,
        message: "Server has a newer mission version.",
      };
    }

    const now = new Date().toISOString();
    const parsed = MissionSchema.safeParse({
      id: mutation.entityId,
      title: data.title ?? existing?.title ?? "Mission",
      description: data.description ?? existing?.description ?? "",
      duration: data.duration ?? existing?.duration ?? 10,
      difficulty: data.difficulty ?? existing?.difficulty ?? "Gentle",
      category: data.category ?? existing?.category ?? "Notice",
      steps: data.steps ?? existing?.steps ?? ["Observe", "Reflect"],
      curiosity: data.curiosity ?? existing?.curiosity ?? "",
      source: data.source ?? existing?.source ?? "local-ai",
      createdAt: data.createdAt ?? existing?.createdAt ?? now,
      updatedAt: now,
      completed: data.completed ?? existing?.completed ?? false,
      version: Math.max((existing?.version ?? 0) + 1, mutation.version),
    });

    if (parsed.success) {
      await missionRepository.saveMission(parsed.data);
    }

    return null;
  }
}

export const syncService = new SyncService();
