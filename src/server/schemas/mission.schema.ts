import { z } from "zod";

export const DifficultyEnum = z.enum(["Gentle", "Curious", "Explorer"]);
export const CategoryEnum = z.enum(["Notice", "Listen", "Find", "Reflect", "Move"]);
export const MissionSourceEnum = z.enum(["seed", "sample", "local-ai", "fallback", "built-in"]);

export const MissionSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  duration: z.number().int().min(1).max(180),
  difficulty: DifficultyEnum,
  category: CategoryEnum,
  steps: z.array(z.string().min(1).max(300)).min(2).max(8),
  curiosity: z.string().min(1).max(500),
  source: MissionSourceEnum,
  createdAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  updatedAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  completed: z.boolean(),
  version: z.number().int().min(1),
  image: z.string().optional(),
});

export const CreateMissionInputSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  duration: z.number().int().min(1).max(180),
  difficulty: DifficultyEnum,
  category: CategoryEnum,
  steps: z.array(z.string().min(1).max(300)).min(2).max(8),
  curiosity: z.string().min(1).max(500),
  source: MissionSourceEnum.optional().default("local-ai"),
  completed: z.boolean().optional().default(false),
});

export const UpdateMissionInputSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  duration: z.number().int().min(1).max(180).optional(),
  difficulty: DifficultyEnum.optional(),
  category: CategoryEnum.optional(),
  steps: z.array(z.string().min(1).max(300)).min(2).max(8).optional(),
  curiosity: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
  version: z.number().int().min(1).optional(),
});

export const MissionFilterQuerySchema = z.object({
  category: CategoryEnum.optional(),
  difficulty: DifficultyEnum.optional(),
  duration: z.coerce.number().int().min(1).max(180).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const GenerateMissionInputSchema = z.object({
  duration: z.coerce.number().int().min(1).max(180).default(10),
  difficulty: DifficultyEnum.default("Gentle"),
  environment: z.string().max(100).default("Park or neighbourhood"),
  interest: z.string().max(100).default("Notice small details"),
});

export type MissionDto = z.infer<typeof MissionSchema>;
export type CreateMissionDto = z.infer<typeof CreateMissionInputSchema>;
export type UpdateMissionDto = z.infer<typeof UpdateMissionInputSchema>;
export type MissionFilterQueryDto = z.infer<typeof MissionFilterQuerySchema>;
export type GenerateMissionInputDto = z.infer<typeof GenerateMissionInputSchema>;
