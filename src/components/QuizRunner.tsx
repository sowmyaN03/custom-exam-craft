import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { ExplanationPanel } from "./ExplanationPanel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { saveAttempt, recordAnswer, type Attempt } from "@/lib/progress";
import type { Question } from "@/lib/questions";

export type QuizQuestion = Pick<
  Question,
  "id" | "question" | "options" | "correct" | "explanation"
> & { subject?: string };

export function QuizRunner({
  title,
  subtitle,
  questions,
  mode,
  subject,
  onRestart,
}: {
  title: string;
  subtitle?: string;
  questions: QuizQuestion[];
  mode: Attempt["mode"];
  subject?: string;
  onRestart?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const started = useRef(Date.now());
  const saved = useRef(false);

  const q = questions[index];
  const chosen = q ? answers[q.id] : undefined;
  const locked = chosen !== undefined;

  const score = useMemo(
    () => questions.filter((x) => answers[x.id] !== undefined && x.correct.includes(answers[x.id])).length,
    [answers, questions],
  );
  const answeredCount = Object.keys(answers).length;

  function choose(i: number) {
    if (locked || !q) return;
    setAnswers((a) => ({ ...a, [q.id]: i }));
    recordAnswer(q.id, q.correct.includes(i));
  }

  function finish() {
    if (!saved.current) {
      saved.current = true;
      saveAttempt({
        id: `${Date.now()}`,
        label: title,
        mode,
        subject,
        total: questions.length,
        correct: score,
        durationMs: Date.now() - started.current,
        finishedAt: Date.now(),
        wrongIds: questions
          .filter((x) => answers[x.id] !== undefined && !x.correct.includes(answers[x.id]))
          .map((x) => x.id),
      });
    }
    setFinished(true);
  }

  if (!q) {
    return <p className="text-sm text-muted-foreground">No questions in this set.</p>;
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="space-y-6">
        <div className="panel p-6 text-center sm:p-10">
          <Trophy className="mx-auto size-10 text-accent" />
          <h1 className="mt-3 font-display text-3xl font-bold">{pct}%</h1>
          <p className="mt-1 text-muted-foreground">
            {score} of {questions.length} correct — {title}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {onRestart && (
              <Button
                onClick={() => {
                  setAnswers({});
                  setIndex(0);
                  setFinished(false);
                  saved.current = false;
                  started.current = Date.now();
                  onRestart();
                }}
              >
                <RotateCcw className="size-4" /> Retry set
              </Button>
            )}
            <Button variant="secondary" onClick={() => setFinished(false)}>
              Review answers
            </Button>
            <Button variant="outline" asChild>
              <Link to="/history">See progress</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {questions.map((item, i) => {
            const pick = answers[item.id];
            const ok = pick !== undefined && item.correct.includes(pick);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setIndex(i);
                  setFinished(false);
                }}
                className="panel flex w-full items-start gap-3 p-4 text-left transition-colors hover:border-primary/50"
              >
                <span
                  className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md ${
                    ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                </span>
                <span className="text-sm">
                  <span className="text-muted-foreground">Q{i + 1}. </span>
                  {item.question}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <Progress value={((index + 1) / questions.length) * 100} className="h-2" />
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {index + 1}/{questions.length} · {score} right
        </span>
      </div>

      <div className="panel p-5 sm:p-7">
        <p className="text-xs uppercase tracking-widest text-primary">
          {q.subject ?? "Question"} {q.explanation ? "" : ""}
        </p>
        <h2 className="mt-2 text-lg font-semibold leading-snug sm:text-xl">{q.question}</h2>

        <div className="mt-5 space-y-2.5">
          {q.options.map((opt, i) => {
            const isCorrect = q.correct.includes(i);
            const isChosen = chosen === i;
            let cls =
              "border-border bg-surface-2/60 hover:border-primary/60 hover:bg-secondary";
            if (locked && isCorrect) cls = "border-success bg-success/15 text-foreground";
            else if (locked && isChosen) cls = "border-destructive bg-destructive/15 text-foreground";
            else if (locked) cls = "border-border bg-surface-2/30 text-muted-foreground";
            return (
              <button
                key={i}
                type="button"
                disabled={locked}
                onClick={() => choose(i)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${cls}`}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-md border border-border/70 font-mono text-xs">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
                {locked && isCorrect && <Check className="size-4 shrink-0 text-success" />}
                {locked && isChosen && !isCorrect && <X className="size-4 shrink-0 text-destructive" />}
              </button>
            );
          })}
        </div>

        {locked && (
          <p
            className={`mt-4 text-sm font-semibold ${
              q.correct.includes(chosen!) ? "text-success" : "text-destructive"
            }`}
          >
            {q.correct.includes(chosen!)
              ? "Correct!"
              : `Not quite — the correct answer is ${String.fromCharCode(65 + (q.correct[0] ?? 0))}.`}
          </p>
        )}
      </div>

      {locked && <ExplanationPanel q={q} />}

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <ArrowLeft className="size-4" /> Previous
        </Button>

        {index === questions.length - 1 ? (
          <Button onClick={finish} disabled={answeredCount === 0}>
            Finish quiz <Trophy className="size-4" />
          </Button>
        ) : (
          <Button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>
            Next <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
