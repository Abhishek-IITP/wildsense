import { JournalEntry } from "@/types";
import { requestJson } from "./client";

export async function fetchJournal(query?: {
  limit?: number;
  offset?: number;
}): Promise<{ data: JournalEntry[]; pagination: { total: number } }> {
  const params = new URLSearchParams();
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.offset) params.set("offset", String(query.offset));

  const qs = params.toString();
  return requestJson<{ data: JournalEntry[]; pagination: { total: number } }>(
    `/api/v1/journal${qs ? `?${qs}` : ""}`,
  );
}

export async function createJournalEntryRemote(entry: Partial<JournalEntry>): Promise<JournalEntry> {
  const result = await requestJson<{ data: JournalEntry }>("/api/v1/journal", {
    method: "POST",
    body: JSON.stringify(entry),
  });
  return result.data;
}

export async function updateJournalEntryRemote(
  id: string,
  patch: Partial<JournalEntry>,
): Promise<JournalEntry> {
  const result = await requestJson<{ data: JournalEntry }>(`/api/v1/journal/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return result.data;
}

export async function deleteJournalEntryRemote(id: string): Promise<boolean> {
  const result = await requestJson<{ success: boolean }>(`/api/v1/journal/${id}`, {
    method: "DELETE",
  });
  return result.success;
}
