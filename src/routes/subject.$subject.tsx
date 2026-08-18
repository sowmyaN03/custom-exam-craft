import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ListChecks, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QUIZ_SIZE, chunk, questionsForSubject, subjectBySlug } from "@/lib/questions";

export const Route = createFileRoute("/subject/$subject")({
  loader: ({ params }) => {
    const info = subjectBySlug(params.subject);
    if (!info) throw notFound();
    return { name: info.name, count: info.count };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "Subject";
    return {
      meta: [
        { title: `${name} MCQ practice — QuizForge` },
        { name: "description", content: `Practice ${name} exam questions in sets of ${QUIZ_SIZE} with instant feedback.` },
        { property: "og:title", content: `${name} MCQ practice — QuizForge` },
        { property: "og:description", content: `Timed-free ${name} practice sets with option-wise explanations.` },
      ],
    };
  },
  component: SubjectPage,
});

function SubjectPage() {
  const { subject } = Route.useParams();
  const { name, count } = Route.useLoaderData();
  const sets = chunk(questionsForSubject(subject), QUIZ_SIZE);

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Library
      </Link>

      <div>
        <h1 className="font-display text-3xl font-bold">{name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count} questions · {sets.length} {sets.length === 1 ? "quiz" : "quizzes"} of up to {QUIZ_SIZE}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sets.map((s, i) => (
          <div key={i} className="panel flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2 text-primary">
              <ListChecks className="size-4" />
              <span className="font-display font-semibold">Set {i + 1}</span>
            </div>
            <p className="text-xs text-muted-foreground">{s.length} questions</p>
            <Button asChild className="mt-auto w-full">
              <Link to="/quiz" search={{ mode: "subject", subject, set: i + 1 }}>
                <Play className="size-4" /> Start
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
