import { z } from "zod";
import { CategoryEnum } from "./mission.schema";

export const MissionPromptOutputSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().min(1).max(240),
  category: CategoryEnum,
  steps: z.array(z.string().min(1).max(200)).min(2).max(5),
  curiosity: z.string().min(1).max(280),
});

export const ReflectionInputSchema = z.object({
  missionTitle: z.string().max(200).default("Outdoor Mission"),
  note: z.string().max(5000).default(""),
  discoveries: z.array(z.string().max(100)).max(50).default([]),
  minutes: z.number().int().min(0).max(1440).default(10),
  mood: z.string().max(50).default(""),
});

export const ReflectionOutputSchema = z.object({
  reflection: z.string().min(1).max(600),
});

export type MissionPromptOutput = z.infer<typeof MissionPromptOutputSchema>;
export type ReflectionInput = z.infer<typeof ReflectionInputSchema>;
export type ReflectionOutput = z.infer<typeof ReflectionOutputSchema>;
