import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Repeat2, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { stats } from "@/lib/progress";
import { SECTIONS, TOTALS } from "@/lib/questions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuizForge — Full Stack MCQ Practice Library" },
      {
        name: "description",
        content:
          "Solve 400+ full-stack exam MCQs by subject with instant right/wrong feedback and option-wise explanations.",
      },
      { property: "og:title", content: "QuizForge — Full Stack MCQ Practice Library" },
      {
        property: "og:description",
        content: "Section, subject and repeated-question practice sets with AI explanations.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [s, setS] = useState({ quizzes: 0, answered: 0, accuracy: 0, mastered: 0 });
  useEffect(() => {
    const sync = () => setS(stats());
    sync();
    window.addEventListener("quizforge:progress", sync);
    return () => window.removeEventListener("quizforge:progress", sync);
  }, []);

  return (
    <div className="space-y-10">
      <section className="panel relative overflow-hidden p-6 sm:p-10">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">Exam practice engine</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">
          Solve your question papers <span className="text-gradient">one question at a time</span>
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          {TOTALS.questions} curated MCQs from your dumps, grouped into {TOTALS.sections} sections and{" "}
          {TOTALS.subjects} subjects. Instant green/red feedback, plus an option-by-option breakdown of
          why each answer is right or wrong.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild size="lg">
            <Link to="/custom">
              <Sparkles className="size-4" /> Build a custom exam
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/repeated">
              <Repeat2 className="size-4" /> Repeated questions
            </Link>
          </Button>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: "Quizzes taken", v: s.quizzes },
            { k: "Questions answered", v: s.answered },
            { k: "Accuracy", v: `${s.accuracy}%` },
            { k: "Mastered", v: s.mastered },
          ].map((m) => (
            <div key={m.k} className="rounded-xl border border-border bg-surface-2/60 p-4">
              <dt className="text-xs text-muted-foreground">{m.k}</dt>
              <dd className="mt-1 font-display text-2xl font-bold">{m.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {SECTIONS.map((section) => (
        <section key={section.slug}>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold">{section.name}</h2>
            <span className="text-xs text-muted-foreground">{section.count} questions</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {section.subjects.map((sub) => (
              <Link
                key={sub.slug}
                to="/subject/$subject"
                params={{ subject: sub.slug }}
                className="panel group p-5 transition-all hover:border-primary/60 hover:shadow-glow"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary">
                    <BookOpen className="size-4" />
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h3 className="mt-3 font-display text-base font-semibold">{sub.name}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Target className="size-3.5" />
                  {sub.count} questions · {sub.sets} {sub.sets === 1 ? "quiz" : "quizzes"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
