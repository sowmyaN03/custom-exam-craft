import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getSeen } from "@/lib/progress";
import { QUESTIONS, REPEATED, SUBJECTS, shuffle, slug } from "@/lib/questions";

export const Route = createFileRoute("/custom")({
  head: () => ({
    meta: [
      { title: "Custom exam builder — QuizForge" },
      {
        name: "description",
        content: "Mix any subjects, pick a length and generate your own full-stack mock exam.",
      },
      { property: "og:title", content: "Custom exam builder — QuizForge" },
      { property: "og:description", content: "Build a personalised MCQ exam from your question bank." },
    ],
  }),
  component: CustomPage,
});

type Pool = "all" | "repeated" | "weak" | "unseen";

function CustomPage() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string[]>([]);
  const [count, setCount] = useState(20);
  const [pool, setPool] = useState<Pool>("all");

  const available = useMemo(() => {
    let base = pool === "repeated" ? REPEATED : QUESTIONS;
    if (pool === "weak" || pool === "unseen") {
      const seen = getSeen();
      base = base.filter((q) => {
        const s = seen[q.id];
        if (pool === "unseen") return !s;
        return s ? s[1] / s[0] < 0.6 : false;
      });
    }
    if (picked.length) base = base.filter((q) => picked.includes(slug(q.subject)));
    return base;
  }, [picked, pool]);

  function start() {
    const questions = shuffle(available).slice(0, Math.min(count, available.length));
    sessionStorage.setItem(
      "quizforge.custom",
      JSON.stringify({
        name: `Custom exam · ${questions.length} questions`,
        questions,
      }),
    );
    navigate({ to: "/quiz", search: { mode: "custom", set: 1 } });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary">
          <Sparkles className="size-4" /> Custom exam
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Build your own paper</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick subjects, choose a pool and set the length — up to 30 questions per quiz.
        </p>
      </div>

      <section className="panel p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Subjects {picked.length ? `(${picked.length} selected)` : "(all)"}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUBJECTS.map((s) => {
            const on = picked.includes(s.slug);
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() =>
                  setPicked((p) => (on ? p.filter((x) => x !== s.slug) : [...p, s.slug]))
                }
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  on
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-surface-2/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.name} <span className="text-xs opacity-70">{s.count}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Question pool
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {(
            [
              ["all", "Everything"],
              ["repeated", "Repeated only"],
              ["weak", "My weak spots"],
              ["unseen", "Not attempted"],
            ] as [Pool, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPool(key)}
              className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                pool === key
                  ? "border-primary bg-primary/12 text-foreground"
                  : "border-border bg-surface-2/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Length
          </h2>
          <span className="font-mono text-sm text-primary">{count} questions</span>
        </div>
        <Slider
          className="mt-4"
          min={5}
          max={30}
          step={5}
          value={[count]}
          onValueChange={(v) => setCount(v[0])}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          {available.length} questions match your filters.
        </p>
      </section>

      <Button size="lg" disabled={available.length === 0} onClick={start}>
        <Wand2 className="size-4" /> Generate exam
      </Button>
    </div>
  );
}
