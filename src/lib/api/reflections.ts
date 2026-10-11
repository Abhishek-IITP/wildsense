import { requestJson } from "./client";

export interface ReflectionRequestInput {
  missionTitle: string;
  note: string;
  discoveries: string[];
  minutes?: number;
  mood?: string;
  journalId?: string;
}

export async function requestReflection(
  input: ReflectionRequestInput,
): Promise<{
  reflection: string;
  source: string;
}> {
  return requestJson<{ reflection: string; source: string }>(
    "/api/v1/reflections",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function checkReflectionStatus(
  journalId: string,
): Promise<{
  status: string;
  reflection?: string;
}> {
  return requestJson<{ status: string; reflection?: string }>(
    `/api/v1/reflections/${journalId}/status`,
  );
}