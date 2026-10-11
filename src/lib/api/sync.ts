import { SyncBatchRequest, SyncBatchResponse } from "@/types";
import { requestJson } from "./client";

export async function sendSyncBatch(batch: SyncBatchRequest): Promise<SyncBatchResponse> {
  return requestJson<SyncBatchResponse>("/api/v1/sync", {
    method: "POST",
    body: JSON.stringify(batch),
  });
}
