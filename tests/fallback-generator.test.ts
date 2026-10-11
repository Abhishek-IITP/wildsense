import { describe, it, expect } from "vitest";
import {
  generateDeterministicFallbackMission,
  generateDeterministicFallbackReflection,
} from "@/server/ai/fallback.generator";

describe("Fallback Generator", () => {
  it("produces deterministic, safe missions based on input parameters", () => {
    const input = {
      duration: 15,
      environment: "Park or neighbourhood",
      interest: "Notice small details",
      difficulty: "Gentle" as const,
    };

    const m1 = generateDeterministicFallbackMission(input);
    const m2 = generateDeterministicFallbackMission(input);

    expect(m1.title).toBe(m2.title);
    expect(m1.steps).toEqual(m2.steps);
    expect(m1.duration).toBe(15);
    expect(m1.difficulty).toBe("Gentle");
    expect(m1.category).toBe("Notice");
    expect(m1.source).toBe("fallback");
  });

  it("adapts instructions when environment has little greenery", () => {
    const input = {
      duration: 10,
      environment: "Somewhere with very little greenery",
      interest: "Notice small details",
      difficulty: "Curious" as const,
    };

    const mission = generateDeterministicFallbackMission(input);
    expect(mission.steps[0]).toContain("pavement cracks");
  });

  it("adds extension step for Explorer difficulty", () => {
    const input = {
      duration: 30,
      environment: "Woodland or nature trail",
      interest: "Move and explore",
      difficulty: "Explorer" as const,
    };

    const mission = generateDeterministicFallbackMission(input);
    expect(mission.steps.some((s) => s.includes("Go a little further"))).toBe(true);
  });

  it("generates supportive fallback reflections", () => {
    const reflection = generateDeterministicFallbackReflection({
      missionTitle: "The shape collector",
      note: "Found a feather and three oak leaves.",
      discoveries: ["feather", "oak leaf"],
      minutes: 15,
      mood: "Calmer",
    });

    expect(reflection.reflection).toContain("The shape collector");
    expect(reflection.reflection).toContain("feather, oak leaf");
    expect(reflection.reflection.length).toBeLessThanOrEqual(600);
  });
});
