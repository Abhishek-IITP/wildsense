/** Server-only Ollama client. Reads OLLAMA_BASE_URL / OLLAMA_MODEL. */
export function ollamaConfig() {
  return {
    base: (process.env["OLLAMA_BASE_URL"] || "http://127.0.0.1:11434").replace(/\/$/, ""),
    model: process.env["OLLAMA_MODEL"] || "gemma3:4b",
  };
}

export async function ollamaChat(system: string, user: string, format?: object, timeoutMs = 60000) {
  const { base, model } = ollamaConfig();
  const r = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model,
      stream: false,
      format,
      options: { temperature: 0.8 },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!r.ok) throw new Error(`ollama ${r.status}`);
  const j = (await r.json()) as { message?: { content?: string } };
  return j.message?.content ?? "";
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
