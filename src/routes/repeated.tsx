import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Repeat2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QUIZ_SIZE, REPEATED, chunk } from "@/lib/questions";

export const Route = createFileRoute("/repeated")({
  head: () => ({
    meta: [
      { title: "Repeated questions — QuizForge" },
      {
        name: "description",
        content: "Drill the MCQs that appeared across multiple past question papers.",
      },
      { property: "og:title", content: "Repeated questions — QuizForge" },
      {
        property: "og:description",
        content: "High-yield MCQs repeated across past papers, in sets of 30.",
      },
    ],
  }),
  component: RepeatedPage,
});

function RepeatedPage() {
  const sets = chunk(REPEATED, QUIZ_SIZE);

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-accent">
          <Repeat2 className="size-4" /> High yield
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Repeated questions</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {REPEATED.length} questions that turned up in more than one paper — the fastest way to cover
          what examiners keep asking.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sets.map((s, i) => (
          <div key={i} className="panel flex flex-col gap-3 p-5">
            <span className="font-display font-semibold text-primary">Set {i + 1}</span>
            <p className="text-xs text-muted-foreground">{s.length} questions</p>
            <Button asChild className="mt-auto w-full">
              <Link to="/quiz" search={{ mode: "repeated", set: i + 1 }}>
                <Play className="size-4" /> Start
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
