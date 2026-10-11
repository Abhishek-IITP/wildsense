import { Collection } from "mongodb";
import { getDatabase } from "../database/mongodb";

export interface ClientSyncMeta {
  clientId: string;
  lastSyncedAt: string;
  lastSyncedVersion: number;
}

export class SyncRepository {
  private async col(): Promise<Collection<ClientSyncMeta>> {
    const db = await getDatabase();
    return db.collection<ClientSyncMeta>("sync_metadata");
  }

  public async getClientMeta(clientId: string): Promise<ClientSyncMeta | null> {
    const col = await this.col();
    return col.findOne({ clientId });
  }

  public async updateClientMeta(clientId: string, version: number): Promise<void> {
    const col = await this.col();
    await col.updateOne(
      { clientId },
      {
        $set: {
          lastSyncedAt: new Date().toISOString(),
          lastSyncedVersion: version,
        },
      },
      { upsert: true },
    );
  }
}

export const syncRepository = new SyncRepository();
