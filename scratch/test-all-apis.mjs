async function runTests() {
  const base = "http://localhost:3000";
  const results = [];

  async function test(name, method, path, body, expectedStatus = [200, 201]) {
    try {
      const opts = {
        method,
        headers: { "Content-Type": "application/json", Accept: "application/json" }
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${base}${path}`, opts);
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}
      const ok = expectedStatus.includes(res.status);
      results.push({ name, method, path, status: res.status, ok, preview: text.slice(0, 100), json });
      console.log(`${ok ? "✓" : "✗"} [${res.status}] ${method} ${path} - ${name}`);
      if (!ok) console.log("   Body:", text.slice(0, 300));
      return { status: res.status, json, text };
    } catch (err) {
      results.push({ name, method, path, status: 0, ok: false, error: err.message });
      console.log(`✗ [ERR] ${method} ${path} - ${name}: ${err.message}`);
      return { status: 0, error: err };
    }
  }

  console.log("--- 1. Health & AI Status ---");
  await test("Root health", "GET", "/api/health");
  await test("Health live", "GET", "/api/v1/health/live");
  await test("Health ready", "GET", "/api/v1/health/ready");
  await test("AI status", "GET", "/api/v1/ai/status");

  console.log("\n--- 2. Missions API ---");
  await test("List missions", "GET", "/api/v1/missions");
  await test("Filter missions category", "GET", "/api/v1/missions?category=Notice");
  await test("Filter missions invalid category", "GET", "/api/v1/missions?category=InvalidCat", null, [400]);

  // Create mission
  const newMission = {
    title: "Test Mission " + Date.now(),
    description: "A test mission description for validation.",
    duration: 15,
    difficulty: "Gentle",
    category: "Notice",
    steps: ["Step 1 notice something", "Step 2 notice something else"],
    curiosity: "Did you know test missions are fun?"
  };
  const createMissRes = await test("Create mission", "POST", "/api/v1/missions", newMission);
  const createdMissionId = createMissRes.json?.data?.id;

  if (createdMissionId) {
    await test("Get created mission", "GET", `/api/v1/missions/${createdMissionId}`);
    await test("Patch mission", "PATCH", `/api/v1/missions/${createdMissionId}`, { description: "Updated description" });
    await test("Delete mission", "DELETE", `/api/v1/missions/${createdMissionId}`);
  }
  await test("Get non-existent mission", "GET", "/api/v1/missions/non-existent-xyz-999", null, [404]);

  console.log("\n--- 3. Mission Generation ---");
  await test("Generate mission (root)", "POST", "/api/mission", {
    duration: 10,
    difficulty: "Gentle",
    environment: "Garden",
    interest: "Notice small details"
  });
  await test("Generate mission (v1)", "POST", "/api/v1/missions/generate", {
    duration: 15,
    difficulty: "Curious",
    environment: "Park",
    interest: "Listen to natural sounds"
  });

  console.log("\n--- 4. Journal API ---");
  await test("List journal", "GET", "/api/v1/journal");
  const newJournal = {
    missionId: createdMissionId || "m-test",
    missionTitle: "Test Mission Title",
    note: "Noticed a red leaf floating on water.",
    discoveries: ["Red leaf", "Puddle"],
    mood: "peaceful",
    minutes: 12
  };
  const createJourRes = await test("Create journal entry", "POST", "/api/v1/journal", newJournal);
  const createdJournalId = createJourRes.json?.data?.id;

  if (createdJournalId) {
    await test("Get journal entry", "GET", `/api/v1/journal/${createdJournalId}`);
    await test("Patch journal entry", "PATCH", `/api/v1/journal/${createdJournalId}`, { note: "Updated reflection note" });
    await test("Get reflection status", "GET", `/api/v1/reflections/${createdJournalId}/status`);
    await test("Delete journal entry", "DELETE", `/api/v1/journal/${createdJournalId}`);
  }
  await test("Get non-existent journal entry", "GET", "/api/v1/journal/non-existent-999", null, [404]);

  console.log("\n--- 5. Reflections API ---");
  await test("Root reflect", "POST", "/api/reflect", {
    missionTitle: "Test Mission",
    note: "Found a quiet pine tree",
    discoveries: ["Pine cone", "Resin scent"],
    minutes: 10
  });
  await test("v1 reflect", "POST", "/api/v1/reflections", {
    missionTitle: "Morning Stroll",
    note: "Cool morning breeze",
    discoveries: ["Dew drops"],
    minutes: 15
  });

  console.log("\n--- 6. Sync API ---");
  await test("Sync empty batch", "POST", "/api/v1/sync", {
    clientId: "client-test-1",
    mutations: []
  });
  await test("Sync with mutations", "POST", "/api/v1/sync", {
    clientId: "client-test-1",
    mutations: [
      {
        mutationId: "mut-1",
        entityType: "journal",
        action: "upsert",
        entityId: "j-sync-" + Date.now(),
        timestamp: new Date().toISOString(),
        version: 1,
        data: {
          missionId: "m-sync-1",
          missionTitle: "Sync Mission",
          note: "Synced note",
          discoveries: ["Moss"],
          mood: "happy",
          minutes: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    ]
  });

  console.log("\n--- 7. Frontend Pages ---");
  await test("Page: /", "GET", "/");
  await test("Page: /journal", "GET", "/journal");
  await test("Page: /mission/shape-collector", "GET", "/mission/shape-collector");
  await test("Page: /non-existent-404", "GET", "/non-existent-404", null, [404]);

  console.log("\n=== Summary ===");
  const failures = results.filter(r => !r.ok);
  console.log(`Total: ${results.length}, Passed: ${results.length - failures.length}, Failed: ${failures.length}`);
}

runTests();
