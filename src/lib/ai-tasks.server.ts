import { chat, parseJson } from "./ai.server";

export type OptionNote = { index: number; why: string };
export type Explanation = {
  correctIndex: number;
  correctWhy: string;
  wrong: OptionNote[];
  takeaway: string;
};

export type GeneratedQuestion = {
  id: string;
  question: string;
  options: string[];
  correct: number[];
  explanation: string;
  confidence: "high" | "medium" | "low";
  agreement: number;
};

function letters(options: string[]) {
  return options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n");
}

export async function buildExplanation(input: {
  id: string;
  question: string;
  options: string[];
  correct: number[];
  hint?: string;
}): Promise<Explanation> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const cached = await supabaseAdmin
    .from("explanations")
    .select("content")
    .eq("question_id", input.id)
    .maybeSingle();
  if (cached.data?.content) return cached.data.content as Explanation;

  const correctLetters = input.correct.map((i) => String.fromCharCode(65 + i)).join(", ");
  const prompt = `You are a senior full-stack trainer (Java, Spring, JavaScript, TypeScript, HTML/CSS, Node, MongoDB, DevOps).

Question:
${input.question}

Options:
${letters(input.options)}

The verified correct answer is option ${correctLetters}.
${input.hint ? `Source note: ${input.hint}` : ""}

Return STRICT JSON only, no prose, in this shape:
{
  "correctWhy": "2-4 sentences explaining precisely why option ${correctLetters} is correct, citing the concept/spec/API involved",
  "wrong": [{"index": 0, "why": "one or two sentences on why this specific option is wrong"}],
  "takeaway": "one short line to remember"
}
Rules: include an entry in "wrong" for EVERY option except ${correctLetters} (use zero-based index matching the option order). Be concrete and technical, never generic.`;

  const raw = await chat([
    { role: "system", content: "You output only valid minified JSON." },
    { role: "user", content: prompt },
  ]);
  const parsed = parseJson<{ correctWhy: string; wrong: OptionNote[]; takeaway?: string }>(raw);

  const explanation: Explanation = {
    correctIndex: input.correct[0] ?? 0,
    correctWhy: parsed.correctWhy,
    wrong: (parsed.wrong ?? []).filter(
      (w) => Number.isInteger(w.index) && w.index >= 0 && w.index < input.options.length && !input.correct.includes(w.index),
    ),
    takeaway: parsed.takeaway ?? "",
  };

  await supabaseAdmin
    .from("explanations")
    .upsert({ question_id: input.id, content: explanation as never });

  return explanation;
}

type Extracted = { question: string; options: string[]; answer: number; explanation?: string };

const EXTRACT = `Extract every multiple-choice question from the study material below.
Return STRICT JSON array only: [{"question":"...","options":["...","..."],"answer":0,"explanation":"short reason"}]
Rules:
- "answer" is the zero-based index of the correct option as marked in the material; if the material does not mark one, use your own expert judgement.
- Keep the original wording of question and options. Skip anything that is not a question. Skip Angular questions.
- Never invent questions that are not in the material.`;

const VERIFY = `You are an exam validator. For each question, independently choose the correct option using your own expert knowledge, ignoring any answer key.
Return STRICT JSON array only: [{"i":0,"answer":2}] where "i" is the question index given and "answer" is the zero-based correct option index.`;

export async function buildQuestionsFromText(text: string, name: string): Promise<{
  name: string;
  questions: GeneratedQuestion[];
  reviewed: number;
}> {
  const clipped = text.slice(0, 60000);

  // Pass 1 — extraction
  const raw = await chat([
    { role: "system", content: "You output only valid minified JSON." },
    { role: "user", content: `${EXTRACT}\n\nMATERIAL:\n${clipped}` },
  ]);
  const extracted = parseJson<Extracted[]>(raw)
    .filter((q) => q && q.question && Array.isArray(q.options) && q.options.length >= 2)
    .slice(0, 60);

  const listing = extracted
    .map((q, i) => `#${i}\nQ: ${q.question}\n${letters(q.options)}`)
    .join("\n\n");

  // Passes 2 and 3 — two independent re-answers used to cross-check pass 1
  const [checkA, checkB] = await Promise.all([
    chat([
      { role: "system", content: "You output only valid minified JSON." },
      { role: "user", content: `${VERIFY}\n\n${listing}` },
    ]),
    chat(
      [
        { role: "system", content: "You output only valid minified JSON." },
        { role: "user", content: `${VERIFY}\n\n${listing}` },
      ],
      "openai/gpt-5.6-luna",
    ),
  ]);

  const toMap = (s: string) => {
    try {
      const arr = parseJson<Array<{ i: number; answer: number }>>(s);
      return new Map(arr.map((x) => [x.i, x.answer]));
    } catch {
      return new Map<number, number>();
    }
  };
  const a = toMap(checkA);
  const b = toMap(checkB);

  const questions: GeneratedQuestion[] = extracted.map((q, i) => {
    const votes = [q.answer, a.get(i), b.get(i)].filter(
      (v): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < q.options.length,
    );
    const tally = new Map<number, number>();
    for (const v of votes) tally.set(v, (tally.get(v) ?? 0) + 1);
    let best = q.answer;
    let bestCount = 0;
    for (const [k, c] of tally) if (c > bestCount) [best, bestCount] = [k, c];
    return {
      id: `up-${i}-${Math.random().toString(36).slice(2, 8)}`,
      question: q.question,
      options: q.options,
      correct: [best],
      explanation: q.explanation ?? "",
      confidence: bestCount >= 3 ? "high" : bestCount === 2 ? "medium" : "low",
      agreement: bestCount,
    };
  });

  return { name, questions, reviewed: questions.length };
}
