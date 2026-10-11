export type Difficulty = "Gentle" | "Curious" | "Explorer";
export type Category = "Notice" | "Listen" | "Find" | "Reflect" | "Move";
export type MissionSource = "seed" | "sample" | "local-ai" | "fallback" | "built-in";

export type Mission = {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: Difficulty;
  category: Category;
  steps: string[];
  curiosity: string;
  source: MissionSource;
  createdAt: string;
  updatedAt: string;
  completed: boolean;
  version: number;
  image?: string;
};

export type AiReflectionStatus = "pending" | "completed" | "unavailable";

export type JournalEntry = {
  id: string;
  missionId: string;
  missionTitle: string;
  note: string;
  discoveries: string[];
  mood: string;
  minutes: number;
  createdAt: string;
  updatedAt: string;
  aiReflection?: string;
  aiReflectionStatus?: AiReflectionStatus;
  version: number;
  deletedAt?: string | null;
};

export type GeneratorInput = {
  duration: number;
  environment: string;
  interest: string;
  difficulty: Difficulty;
};

export type AiStatus = "checking" | "connected" | "offline" | "generating";

export interface AIHealthStatus {
  available: boolean;
  provider: "ollama";
  model: string;
  capabilities: {
    missionGeneration: boolean;
    reflectionGeneration: boolean;
  };
  reason?: string;
}

export type SyncState = "saved" | "pending_sync" | "syncing" | "synced" | "conflict";

export interface SyncMutation {
  mutationId: string;
  entityType: "mission" | "journal";
  action: "upsert" | "delete";
  entityId: string;
  timestamp: string;
  data?: Partial<Mission> | Partial<JournalEntry>;
  version: number;
}

export interface SyncBatchRequest {
  clientId: string;
  lastSyncedVersion?: number;
  mutations: SyncMutation[];
}

export interface SyncBatchResponse {
  success: boolean;
  syncedMutationIds: string[];
  conflicts: {
    entityId: string;
    entityType: "mission" | "journal";
    serverVersion: number;
    clientVersion: number;
    serverData: Mission | JournalEntry | null;
    message: string;
  }[];
  serverChanges: {
    missions: Mission[];
    journal: JournalEntry[];
  };
  currentServerVersion: number;
}
