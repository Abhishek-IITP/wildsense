import { MongoClient, Db } from "mongodb";
import { getServerConfig } from "../config/env";
import { DatabaseUnavailableError } from "../middleware/error-handler";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  const config = getServerConfig();

  if (client) {
    return client;
  }

  if (!clientPromise) {
    const mongoClient = new MongoClient(config.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });

    clientPromise = mongoClient
      .connect()
      .then((connectedClient) => {
        client = connectedClient;
        return connectedClient;
      })
      .catch((err) => {
        clientPromise = null;
        client = null;
        throw new DatabaseUnavailableError(`Unable to connect to MongoDB: ${err instanceof Error ? err.message : String(err)}`);
      });
  }

  return clientPromise;
}

export async function getDatabase(): Promise<Db> {
  try {
    const mongoClient = await getMongoClient();
    const config = getServerConfig();
    return mongoClient.db(config.MONGODB_DB);
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      throw err;
    }
    throw new DatabaseUnavailableError(`Database access failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function pingDatabase(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (client) {
    try {
      await client.close(true);
    } catch {
      // Ignore errors on closing
    } finally {
      client = null;
      clientPromise = null;
    }
  }
}
