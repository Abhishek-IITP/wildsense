import { z } from "zod";
import { MissionSchema } from "./mission.schema";
import { JournalEntrySchema } from "./journal.schema";

export const SyncMutationSchema = z.object({
  mutationId: z.string().min(1).max(100),
  entityType: z.enum(["mission", "journal"]),
  action: z.enum(["upsert", "delete"]),
  entityId: z.string().min(1).max(100),
  timestamp: z.string().datetime({ offset: true }).or(z.string().datetime()),
  data: z.record(z.unknown()).optional(),
  version: z.number().int().min(1),
});

export const SyncBatchRequestSchema = z.object({
  clientId: z.string().min(1).max(100),
  lastSyncedVersion: z.number().int().min(0).optional().default(0),
  mutations: z.array(SyncMutationSchema).max(100), // Bounded batch limit
});

export const BackupSchema = z.object({
  app: z.literal("wildsense"),
  version: z.number().int().min(1).max(10),
  exportedAt: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
  missions: z.array(MissionSchema).max(1000).default([]),
  journal: z.array(JournalEntrySchema).max(5000).default([]),
  completed: z.array(z.string()).max(1000).default([]),
  theme: z.enum(["light", "dark"]).optional(),
});

export type SyncMutationDto = z.infer<typeof SyncMutationSchema>;
export type SyncBatchRequestDto = z.infer<typeof SyncBatchRequestSchema>;
export type BackupDto = z.infer<typeof BackupSchema>;
