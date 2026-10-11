import { getServerConfig } from "../config/env";
import { AIHealthStatus } from "@/types";
import { AIServiceUnavailableError, RateLimitError } from "../middleware/error-handler";

class ConcurrencyLimiter {
  private activeCount = 0;

  constructor(private readonly maxConcurrent: number) {}

  public async acquire(): Promise<() => void> {
    if (this.activeCount >= this.maxConcurrent) {
      throw new RateLimitError("AI inference capacity busy. Please try again in a few moments.");
    }
    this.activeCount++;
    let released = false;
    return () => {
      if (!released) {
        released = true;
        this.activeCount = Math.max(0, this.activeCount - 1);
      }
    };
  }

  public getActiveCount(): number {
    return this.activeCount;
  }
}

export class OllamaClient {
  private limiter: ConcurrencyLimiter;

  constructor() {
    const config = getServerConfig();
    this.limiter = new ConcurrencyLimiter(config.AI_MAX_CONCURRENT_REQUESTS);
  }

  public async healthCheck(): Promise<AIHealthStatus> {
    const config = getServerConfig();
    try {
      const response = await fetch(`${config.OLLAMA_BASE_URL}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        return {
          available: false,
          provider: "ollama",
          model: config.OLLAMA_MODEL,
          capabilities: { missionGeneration: false, reflectionGeneration: false },
          reason: `Ollama returned HTTP ${response.status}`,
        };
      }

      const data = (await response.json()) as { models?: { name: string }[] };
      const models = data.models ?? [];
      const hasModel = models.some(
        (m) => m.name === config.OLLAMA_MODEL || m.name.startsWith(config.OLLAMA_MODEL),
      );

      return {
        available: hasModel,
        provider: "ollama",
        model: config.OLLAMA_MODEL,
        capabilities: {
          missionGeneration: hasModel,
          reflectionGeneration: hasModel,
        },
        ...(!hasModel ? { reason: `Model ${config.OLLAMA_MODEL} not found in Ollama library.` } : {}),
      };
    } catch (err) {
      return {
        available: false,
        provider: "ollama",
        model: config.OLLAMA_MODEL,
        capabilities: { missionGeneration: false, reflectionGeneration: false },
        reason: err instanceof Error ? err.message : "Unable to reach Ollama endpoint",
      };
    }
  }

  public async chat(
    systemPrompt: string,
    userPrompt: string,
    format?: object,
    timeoutOverrideMs?: number,
  ): Promise<string> {
    const config = getServerConfig();
    const timeoutMs = timeoutOverrideMs ?? config.AI_REQUEST_TIMEOUT_MS;

    const release = await this.limiter.acquire();
    try {
      const response = await fetch(`${config.OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          model: config.OLLAMA_MODEL,
          stream: false,
          format,
          options: {
            temperature: 0.7,
            num_predict: 512,
          },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        throw new AIServiceUnavailableError(`Ollama request failed with status ${response.status}`);
      }

      const json = (await response.json()) as { message?: { content?: string } };
      const rawContent = json.message?.content ?? "";
      return this.cleanContent(rawContent);
    } catch (err) {
      if (err instanceof RateLimitError || err instanceof AIServiceUnavailableError) {
        throw err;
      }
      throw new AIServiceUnavailableError(
        `AI request failed: ${err instanceof Error ? err.message : "Inference error"}`,
      );
    } finally {
      release();
    }
  }

  private cleanContent(raw: string): string {
    let text = raw.trim();
    // Strip markdown code fences e.g. ```json ... ```
    if (text.startsWith("```")) {
      const firstNewline = text.indexOf("\n");
      if (firstNewline !== -1) {
        text = text.slice(firstNewline + 1);
      }
      if (text.endsWith("```")) {
        text = text.slice(0, -3);
      }
    }
    return text.trim();
  }
}

export const ollamaClient = new OllamaClient();
