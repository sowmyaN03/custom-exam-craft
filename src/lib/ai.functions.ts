import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { buildExplanation, buildQuestionsFromText } from "./ai-tasks.server";

const explainInput = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string()).min(1),
  correct: z.array(z.number()),
  hint: z.string().optional(),
});

export const explainQuestion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => explainInput.parse(d))
  .handler(async ({ data }) => buildExplanation(data));

const generateInput = z.object({
  text: z.string().min(30).max(120000),
  name: z.string().default("Uploaded set"),
});

export const generateQuestions = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => generateInput.parse(d))
  .handler(async ({ data }) => buildQuestionsFromText(data.text, data.name));
