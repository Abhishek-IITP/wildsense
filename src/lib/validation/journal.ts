import { z } from "zod";

export const ClientJournalEntrySchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  missionTitle: z.string().min(1).max(200),
  note: z.string().max(5000).default(""),
  discoveries: z.array(z.string().max(100)).max(50).default([]),
  mood: z.string().max(50).default(""),
  minutes: z.number().int().min(0).max(1440),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  aiReflection: z.string().max(2000).optional(),
  aiReflectionStatus: z.enum(["pending", "completed", "unavailable"]).optional(),
  version: z.number().optional().default(1),
  deletedAt: z.string().nullable().optional(),
});
