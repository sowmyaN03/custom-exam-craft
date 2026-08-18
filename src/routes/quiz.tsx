import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { QuizRunner, type QuizQuestion } from "@/components/QuizRunner";
import { Button } from "@/components/ui/button";
import {
  QUIZ_SIZE,
  REPEATED,
  chunk,
  questionsForSubject,
  subjectBySlug,
} from "@/lib/questions";

type Search = {
  mode: "subject" | "repeated" | "custom" | "upload";
  subject?: string;
  set?: number;
};

export const Route = createFileRoute("/quiz")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode: (["subject", "repeated", "custom", "upload"].includes(String(search.mode))
      ? String(search.mode)
      : "subject") as Search["mode"],
    subject: search.subject ? String(search.subject) : undefined,
    set: search.set ? Number(search.set) : 1,
  }),
  head: () => ({
    meta: [
      { title: "Quiz — QuizForge" },
      { name: "description", content: "Answer questions one by one with instant feedback and explanations." },
      { property: "og:title", content: "Quiz — QuizForge" },
      { property: "og:description", content: "Instant right/wrong feedback with option-wise explanations." },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const { mode, subject, set = 1 } = Route.useSearch();
  const [stored, setStored] = useState<{ name: string; questions: QuizQuestion[] } | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (mode !== "custom" && mode !== "upload") return;
    try {
      const raw = sessionStorage.getItem(`quizforge.${mode}`);
      if (raw) setStored(JSON.parse(raw));
    } catch {
      setStored(null);
    }
  }, [mode]);

  const built = useMemo(() => {
    if (mode === "subject" && subject) {
      const info = subjectBySlug(subject);
      const sets = chunk(questionsForSubject(subject), QUIZ_SIZE);
      const list = sets[set - 1] ?? [];
      return {
        title: `${info?.name ?? subject} — Set ${set}`,
        subtitle: `${list.length} questions · sets of ${QUIZ_SIZE}`,
        questions: list as QuizQuestion[],
      };
    }
    if (mode === "repeated") {
      const sets = chunk(REPEATED, QUIZ_SIZE);
      const list = sets[set - 1] ?? [];
      return {
        title: `Repeated questions — Set ${set}`,
        subtitle: `${list.length} questions that showed up across multiple papers`,
        questions: list as QuizQuestion[],
      };
    }
    return null;
  }, [mode, subject, set]);

  const data =
    built ??
    (stored
      ? {
          title: stored.name,
          subtitle: `${stored.questions.length} questions`,
          questions: stored.questions,
        }
      : null);

  if (!data || data.questions.length === 0) {
    return (
      <div className="panel p-8 text-center">
        <h1 className="font-display text-xl font-bold">This quiz isn&apos;t available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The set may have expired or the link is incomplete.
        </p>
        <Button asChild className="mt-5">
          <Link to="/">Back to library</Link>
        </Button>
      </div>
    );
  }

  return (
    <QuizRunner
      key={`${mode}-${subject}-${set}-${nonce}`}
      title={data.title}
      subtitle={data.subtitle}
      questions={data.questions}
      mode={mode}
      subject={subject}
      onRestart={() => setNonce((n) => n + 1)}
    />
  );
}
