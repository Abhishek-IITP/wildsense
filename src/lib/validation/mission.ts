import { z } from "zod";

export const ClientMissionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  duration: z.number().int().min(1).max(180),
  difficulty: z.enum(["Gentle", "Curious", "Explorer"]),
  category: z.enum(["Notice", "Listen", "Find", "Reflect", "Move"]),
  steps: z.array(z.string().min(1).max(300)).min(2).max(8),
  curiosity: z.string().min(1).max(500),
  source: z.enum(["seed", "sample", "local-ai", "fallback", "built-in"]).optional().default("built-in"),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  completed: z.boolean().optional().default(false),
  version: z.number().optional().default(1),
  image: z.string().optional(),
});

export const ClientGeneratorInputSchema = z.object({
  duration: z.number().int().min(1).max(180),
  environment: z.string().max(100),
  interest: z.string().max(100),
  difficulty: z.enum(["Gentle", "Curious", "Explorer"]),
});
