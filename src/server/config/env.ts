import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017"),
  MONGODB_DB: z.string().default("wildsense"),
  OLLAMA_BASE_URL: z.string().url().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().default("gemma3:4b"),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().min(1000).max(120000).default(45000),
  AI_MAX_CONCURRENT_REQUESTS: z.coerce.number().min(1).max(10).default(2),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
});

export type ServerConfig = z.infer<typeof envSchema>;

let cachedConfig: ServerConfig | null = null;

export function getServerConfig(): ServerConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const raw = {
    NODE_ENV: process.env["NODE_ENV"],
    PORT: process.env["PORT"],
    MONGODB_URI: process.env["MONGODB_URI"],
    MONGODB_DB: process.env["MONGODB_DB"],
    OLLAMA_BASE_URL: process.env["OLLAMA_BASE_URL"],
    OLLAMA_MODEL: process.env["OLLAMA_MODEL"],
    AI_REQUEST_TIMEOUT_MS: process.env["AI_REQUEST_TIMEOUT_MS"],
    AI_MAX_CONCURRENT_REQUESTS: process.env["AI_MAX_CONCURRENT_REQUESTS"],
    CORS_ORIGINS: process.env["CORS_ORIGINS"],
  };

  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.format();
    console.error("Configuration validation error:", errors);
    throw new Error(`Invalid server configuration: ${JSON.stringify(errors)}`);
  }

  // Sanitize OLLAMA_BASE_URL: strip trailing slash
  parsed.data.OLLAMA_BASE_URL = parsed.data.OLLAMA_BASE_URL.replace(/\/$/, "");

  cachedConfig = parsed.data;
  return cachedConfig;
}

export function resetServerConfigForTest(override?: Partial<ServerConfig>): void {
  cachedConfig = override ? { ...getServerConfig(), ...override } : null;
}
