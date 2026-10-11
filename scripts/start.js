import fs from "fs";
import { spawn } from "child_process";

function run() {
  const hasBuild = fs.existsSync(".next/BUILD_ID");

  if (!hasBuild) {
    console.log("⚠️ No production build found in .next directory.");
    console.log("🔨 Automatically running 'next build' before starting...");
    const buildProc = spawn("next", ["build"], { stdio: "inherit", shell: true });
    buildProc.on("close", (code) => {
      if (code !== 0) {
        console.error(`Build failed with exit code ${code}`);
        process.exit(code ?? 1);
      }
      startServer();
    });
  } else {
    startServer();
  }
}

function startServer() {
  const port = process.env.PORT || "3000";
  console.log(`🚀 Launching Next.js production server (PORT: ${port})...`);
  const srv = spawn("next", ["start", "-p", port], { stdio: "inherit", shell: true });
  srv.on("close", (code) => {
    process.exit(code ?? 0);
  });
}

run();
