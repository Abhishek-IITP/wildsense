import { pingDatabase } from "../database/mongodb";
import { ollamaClient } from "../ai/ollama.client";
import { getServerConfig } from "../config/env";

export interface ReadinessReport {
  status: "ready" | "degraded";
  timestamp: string;
  uptimeSeconds: number;
  dependencies: {
    api: { status: "healthy" };
    database: {
      status: "connected" | "unavailable";
      latencyMs?: number;
    };
    ai: {
      status: "connected" | "offline";
      provider: string;
      model: string;
      available: boolean;
      reason?: string;
    };
  };
}

export class HealthService {
  private readonly processStart = Date.now();

  public getLiveness(): { status: "alive"; timestamp: string } {
    return {
      status: "alive",
      timestamp: new Date().toISOString(),
    };
  }

  public async getReadiness(): Promise<ReadinessReport> {
    const config = getServerConfig();

    const [dbPing, aiHealth] = await Promise.all([
      pingDatabase().catch(() => ({ ok: false, latencyMs: undefined as number | undefined })),
      ollamaClient.healthCheck().catch(() => ({
        available: false,
        provider: "ollama" as const,
        model: config.OLLAMA_MODEL,
        capabilities: { missionGeneration: false, reflectionGeneration: false },
        reason: "Offline",
      })),
    ]);

    const isDegraded = !dbPing.ok || !aiHealth.available;

    return {
      status: isDegraded ? "degraded" : "ready",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.processStart) / 1000),
      dependencies: {
        api: { status: "healthy" },
        database: {
          status: dbPing.ok ? "connected" : "unavailable",
          latencyMs: "latencyMs" in dbPing ? dbPing.latencyMs : undefined,
        },
        ai: {
          status: aiHealth.available ? "connected" : "offline",
          provider: "ollama",
          model: config.OLLAMA_MODEL,
          available: aiHealth.available,
          reason: aiHealth.reason,
        },
      },
    };
  }
}

export const healthService = new HealthService();
