import { describe, it, expect } from "vitest";
import {
  GenerateMissionInputSchema,
  MissionSchema,
} from "@/server/schemas/mission.schema";
import {
  CreateJournalInputSchema,
  JournalEntrySchema,
} from "@/server/schemas/journal.schema";
import {
  SyncMutationSchema,
  SyncBatchRequestSchema,
} from "@/server/schemas/sync.schema";

describe("Zod Validation Schemas", () => {
  describe("Mission Schemas", () => {
    it("validates well-formed mission generation inputs", () => {
      const valid = {
        duration: 20,
        environment: "Woodland or nature trail",
        interest: "Listen to natural sounds",
        difficulty: "Curious",
      };
      const parsed = GenerateMissionInputSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("rejects invalid durations", () => {
      const invalid = {
        duration: 999,
        environment: "Park",
        interest: "Notice",
        difficulty: "Curious",
      };
      const parsed = GenerateMissionInputSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it("validates complete Mission entities", () => {
      const mission = {
        id: "m-123",
        title: "Test Mission",
        description: "Test description for a mission.",
        duration: 15,
        difficulty: "Gentle",
        category: "Notice",
        steps: ["Step 1", "Step 2"],
        curiosity: "Interesting fact.",
        createdAt: "2026-10-10T00:00:00.000Z",
        updatedAt: "2026-10-10T00:00:00.000Z",
        completed: false,
        version: 1,
        source: "seed",
      };
      expect(MissionSchema.safeParse(mission).success).toBe(true);
    });
  });

  describe("Journal Schemas", () => {
    it("validates journal creation input", () => {
      const entry = {
        missionId: "m-123",
        missionTitle: "The shape collector",
        note: "Saw yellow birch leaves.",
        discoveries: ["birch leaf", "smooth stone"],
        mood: "Grounded",
        minutes: 15,
      };
      const res = CreateJournalInputSchema.safeParse(entry);
      expect(res.success).toBe(true);
    });

    it("validates full JournalEntry record", () => {
      const full = {
        id: "j-abc",
        missionId: "m-123",
        missionTitle: "The shape collector",
        note: "Notes",
        discoveries: ["feather"],
        mood: "Calmer",
        minutes: 10,
        createdAt: "2026-10-10T12:00:00Z",
        updatedAt: "2026-10-10T12:00:00Z",
        version: 1,
        aiReflectionStatus: "completed",
        aiReflection: "A thoughtful observation.",
      };
      expect(JournalEntrySchema.safeParse(full).success).toBe(true);
    });
  });

  describe("Sync Schemas", () => {
    it("validates batch sync payloads", () => {
      const mutation = {
        mutationId: "mut-1",
        entityType: "journal",
        action: "upsert",
        entityId: "j-1",
        timestamp: "2026-10-10T12:00:00Z",
        version: 1,
        data: { note: "First sync" },
      };
      expect(SyncMutationSchema.safeParse(mutation).success).toBe(true);

      const payload = {
        clientId: "client-uuid-123",
        lastSyncedVersion: 0,
        mutations: [mutation],
      };
      const parsed = SyncBatchRequestSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it("enforces batch size caps to prevent denial of service", () => {
      const tooMany = Array.from({ length: 101 }, (_, i) => ({
        mutationId: `m-${i}`,
        entityType: "journal" as const,
        action: "upsert" as const,
        entityId: `id-${i}`,
        timestamp: "2026-10-10T12:00:00Z",
        version: 1,
      }));

      const parsed = SyncBatchRequestSchema.safeParse({
        clientId: "c-1",
        mutations: tooMany,
      });
      expect(parsed.success).toBe(false);
    });
  });
});
