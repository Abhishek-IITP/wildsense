import { GeneratorInput, Mission } from "@/types";
import { requestJson } from "./client";

export async function fetchMissions(filter?: {
  category?: string;
  difficulty?: string;
  duration?: number;
}): Promise<{ data: Mission[]; pagination: { total: number } }> {
  const params = new URLSearchParams();
  if (filter?.category) params.set("category", filter.category);
  if (filter?.difficulty) params.set("difficulty", filter.difficulty);
  if (filter?.duration) params.set("duration", String(filter.duration));

  const query = params.toString();
  return requestJson<{ data: Mission[]; pagination: { total: number } }>(
    `/api/v1/missions${query ? `?${query}` : ""}`,
  );
}

export async function fetchMissionById(id: string): Promise<Mission> {
  const result = await requestJson<{ data: Mission }>(`/api/v1/missions/${id}`);
  return result.data;
}

export async function generateRemoteMission(input: GeneratorInput): Promise<{
  mission: Mission;
  meta: { generationMode: string; fallbackUsed: boolean };
}> {
  return requestJson<{
    mission: Mission;
    meta: { generationMode: string; fallbackUsed: boolean };
  }>("/api/v1/missions/generate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
