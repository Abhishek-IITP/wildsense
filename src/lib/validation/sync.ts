import { z } from "zod";

export const ClientSyncMutationSchema = z.object({
  mutationId: z.string().min(1),
  entityType: z.enum(["mission", "journal"]),
  action: z.enum(["upsert", "delete"]),
  entityId: z.string().min(1),
  timestamp: z.string(),
  data: z.record(z.unknown()).optional(),
  version: z.number().int().min(1),
});

export const ClientSyncBatchRequestSchema = z.object({
  clientId: z.string().min(1),
  lastSyncedVersion: z.number().int().min(0).optional(),
  mutations: z.array(ClientSyncMutationSchema),
});
