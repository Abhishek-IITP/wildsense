import { Db } from "mongodb";
import { getDatabase } from "./mongodb";

export async function createDatabaseIndexes(db?: Db): Promise<{ created: string[] }> {
  const targetDb = db ?? (await getDatabase());
  const created: string[] = [];

  // Missions collection
  const missionsCol = targetDb.collection("missions");
  await missionsCol.createIndex({ id: 1 }, { unique: true, name: "idx_missions_id_unique" });
  created.push("missions.id (unique)");

  await missionsCol.createIndex({ category: 1, difficulty: 1 }, { name: "idx_missions_cat_diff" });
  created.push("missions.category_difficulty");

  await missionsCol.createIndex({ updatedAt: -1 }, { name: "idx_missions_updatedAt" });
  created.push("missions.updatedAt");

  // Journal collection
  const journalCol = targetDb.collection("journal");
  await journalCol.createIndex({ id: 1 }, { unique: true, name: "idx_journal_id_unique" });
  created.push("journal.id (unique)");

  await journalCol.createIndex({ createdAt: -1 }, { name: "idx_journal_createdAt" });
  created.push("journal.createdAt");

  await journalCol.createIndex({ updatedAt: -1 }, { name: "idx_journal_updatedAt" });
  created.push("journal.updatedAt");

  await journalCol.createIndex({ deletedAt: 1 }, { name: "idx_journal_deletedAt" });
  created.push("journal.deletedAt");

  // Sync Metadata collection
  const syncCol = targetDb.collection("sync_metadata");
  await syncCol.createIndex({ clientId: 1 }, { unique: true, name: "idx_sync_clientId_unique" });
  created.push("sync_metadata.clientId (unique)");

  return { created };
}
