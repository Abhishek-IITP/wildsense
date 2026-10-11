import { z } from "zod";

export const AiReflectionStatusEnum = z.enum(["pending", "completed", "unavailable"]);

export const JournalEntrySchema = z.object({
  id: z.string().min(1).max(100),
  missionId: z.string().min(1).max(100),
  missionTitle: z.string().min(1).max(200),
  note: z.string().max(5000).default(""),
  discoveries: z.array(z.string().max(100)).max(50).default([]),
  mood: z.string().max(50).default(""),
  minutes: z.number().int().min(0).max(1440),
  createdAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  updatedAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  aiReflection: z.string().max(2000).optional(),
  aiReflectionStatus: AiReflectionStatusEnum.default("unavailable"),
  version: z.number().int().min(1),
  deletedAt: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable().optional(),
});

export const CreateJournalInputSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  missionId: z.string().min(1).max(100),
  missionTitle: z.string().min(1).max(200),
  note: z.string().max(5000).default(""),
  discoveries: z.array(z.string().max(100)).max(50).default([]),
  mood: z.string().max(50).default(""),
  minutes: z.number().int().min(0).max(1440).default(0),
  createdAt: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
  aiReflection: z.string().max(2000).optional(),
  aiReflectionStatus: AiReflectionStatusEnum.optional().default("unavailable"),
});

export const UpdateJournalInputSchema = z.object({
  note: z.string().max(5000).optional(),
  discoveries: z.array(z.string().max(100)).max(50).optional(),
  mood: z.string().max(50).optional(),
  minutes: z.number().int().min(0).max(1440).optional(),
  aiReflection: z.string().max(2000).optional(),
  aiReflectionStatus: AiReflectionStatusEnum.optional(),
  version: z.number().int().min(1).optional(),
});

export const JournalQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  cursor: z.string().optional(),
  includeDeleted: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export type JournalEntryDto = z.infer<typeof JournalEntrySchema>;
export type CreateJournalDto = z.infer<typeof CreateJournalInputSchema>;
export type UpdateJournalDto = z.infer<typeof UpdateJournalInputSchema>;
export type JournalQueryDto = z.infer<typeof JournalQuerySchema>;
