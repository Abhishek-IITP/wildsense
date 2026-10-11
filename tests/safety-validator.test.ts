import { describe, it, expect } from "vitest";
import {
  validateMissionSafety,
  validateReflectionSafety,
} from "@/server/ai/output.validator";

describe("Safety Validator", () => {
  describe("validateMissionSafety", () => {
    it("approves safe outdoor observation missions", () => {
      const candidate = {
        title: "The Shape of Bark",
        description: "Notice the distinct grooves in tree bark without harming the tree.",
        category: "Notice",
        steps: [
          "Find a mature oak or pine along the path.",
          "Look closely at the patterns formed by the bark.",
          "Touch the rough surface gently without peeling anything.",
        ],
        curiosity: "Bark protects the living cambium layer underneath.",
      };

      const result = validateMissionSafety(candidate);
      expect(result.isValid).toBe(true);
      expect(result.sanitized?.title).toBe("The Shape of Bark");
      expect(result.reasons).toHaveLength(0);
    });

    it("rejects missions instructing ingestion or foraging to eat", () => {
      const candidate = {
        title: "Berry Tasting",
        description: "Find wild berries and taste them to see if they are sweet.",
        category: "Find",
        steps: [
          "Walk into the hedge.",
          "Pick three red berries and eat them.",
        ],
        curiosity: "Some berries are edible.",
      };

      const result = validateMissionSafety(candidate);
      expect(result.isValid).toBe(false);
      expect(result.reasons.some((r) => r.includes("safety rule"))).toBe(true);
    });

    it("rejects missions instructing wildlife capture or handling", () => {
      const candidate = {
        title: "Catch a Spider",
        description: "Try to hold a spider in your hand.",
        category: "Find",
        steps: [
          "Look under a log.",
          "Grab a spider gently to examine it.",
        ],
        curiosity: "Spiders have eight legs.",
      };

      const result = validateMissionSafety(candidate);
      expect(result.isValid).toBe(false);
      expect(result.reasons.some((r) => r.includes("safety rule"))).toBe(true);
    });

    it("rejects trespassing instructions", () => {
      const candidate = {
        title: "Beyond the Gate",
        description: "Cross into private property to see private gardens.",
        category: "Move",
        steps: [
          "Find a locked gate.",
          "Climb fence and explore.",
        ],
        curiosity: "Private lands have flowers.",
      };

      const result = validateMissionSafety(candidate);
      expect(result.isValid).toBe(false);
    });

    it("rejects cliff climbing or dangerous water wading", () => {
      const candidate = {
        title: "Cliff Edge",
        description: "Stand at the very edge of a cliff to feel the wind.",
        category: "Move",
        steps: [
          "Hike to the drop.",
          "Walk to the edge of cliff.",
        ],
        curiosity: "Wind is strong near cliffs.",
      };

      const result = validateMissionSafety(candidate);
      expect(result.isValid).toBe(false);
    });

    it("rejects missing or malformed inputs", () => {
      expect(validateMissionSafety(null).isValid).toBe(false);
      expect(validateMissionSafety({}).isValid).toBe(false);
      expect(
        validateMissionSafety({
          title: "T",
          description: "D",
          steps: ["one step"],
          curiosity: "",
        }).isValid,
      ).toBe(false);
    });
  });

  describe("validateReflectionSafety", () => {
    it("approves thoughtful, gentle reflection text", () => {
      const candidate = {
        reflection:
          "Noticing the rhythm of the wind through the pines offered a calm pause. Carrying that stillness back inside is a gift.",
      };

      const result = validateReflectionSafety(candidate);
      expect(result.isValid).toBe(true);
      expect(result.sanitized?.reflection).toContain("rhythm of the wind");
    });

    it("rejects clinical diagnoses or therapy claims", () => {
      const candidate = {
        reflection: "You have symptoms of clinical depression and therapy is needed.",
      };

      const result = validateReflectionSafety(candidate);
      expect(result.isValid).toBe(false);
      expect(result.reasons[0]).toContain("disallowed reflection content");
    });

    it("rejects streak or manipulative retention language", () => {
      const candidate = {
        reflection: "Don't break your streak! You must return every day or lose progress.",
      };

      const result = validateReflectionSafety(candidate);
      expect(result.isValid).toBe(false);
    });
  });
});
