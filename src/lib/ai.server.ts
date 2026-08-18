const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function chat(
  messages: Array<{ role: string; content: string }>,
  model = "google/gemini-3-flash-preview",
): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature: 0.1 }),
  });
  if (res.status === 429) throw new Error("Rate limit reached — please retry in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

export function parseJson<T>(text: string): T {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.search(/[[{]/);
  if (start > 0) t = t.slice(start);
  const lastArr = t.lastIndexOf("]");
  const lastObj = t.lastIndexOf("}");
  const end = Math.max(lastArr, lastObj);
  if (end > 0) t = t.slice(0, end + 1);
  return JSON.parse(t) as T;
}
