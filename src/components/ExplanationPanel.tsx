import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Lightbulb, Loader2, XCircle } from "lucide-react";

import { explainQuestion } from "@/lib/ai.functions";
import type { Question } from "@/lib/questions";

type Q = Pick<Question, "id" | "question" | "options" | "correct" | "explanation">;

export function ExplanationPanel({ q }: { q: Q }) {
  const fn = useServerFn(explainQuestion);
  const { data, isPending, error } = useQuery({
    queryKey: ["explain", q.id],
    queryFn: () =>
      fn({
        data: {
          id: q.id,
          question: q.question,
          options: q.options,
          correct: q.correct,
          hint: q.explanation || undefined,
        },
      }),
    staleTime: Infinity,
    retry: 1,
  });

  const correctIdx = q.correct[0] ?? 0;

  return (
    <div className="panel mt-4 p-4 sm:p-5">
      <h3 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Lightbulb className="size-4 text-accent" />
        Option-by-option breakdown
      </h3>

      {isPending && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Writing the explanation…
        </p>
      )}

      {error && (
        <div className="mt-3 space-y-2 text-sm">
          <p className="flex items-center gap-2 text-warning">
            <AlertCircle className="size-4" /> Couldn&apos;t generate the AI breakdown right now.
          </p>
          <p className="text-muted-foreground">
            Correct answer: <span className="font-medium text-success">
              {String.fromCharCode(65 + correctIdx)}. {q.options[correctIdx]}
            </span>
            {q.explanation ? ` — ${q.explanation}` : ""}
          </p>
        </div>
      )}

      {data && (
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-success/40 bg-success/10 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 className="size-4" />
              Why {String.fromCharCode(65 + correctIdx)}. {q.options[correctIdx]} is right
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{data.correctWhy}</p>
          </div>

          {data.wrong.map((w) => (
            <div key={w.index} className="rounded-lg border border-destructive/35 bg-destructive/10 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <XCircle className="size-4" />
                Why {String.fromCharCode(65 + w.index)}. {q.options[w.index]} is wrong
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{w.why}</p>
            </div>
          ))}

          {data.takeaway && (
            <p className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
              <span className="font-semibold text-accent">Remember: </span>
              {data.takeaway}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
