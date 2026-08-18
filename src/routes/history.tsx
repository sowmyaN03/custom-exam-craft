import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Trash2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { clearHistory, getHistory, stats, type Attempt } from "@/lib/progress";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Progress history — QuizForge" },
      { name: "description", content: "Track your quiz attempts, accuracy and weak topics over time." },
      { property: "og:title", content: "Progress history — QuizForge" },
      { property: "og:description", content: "Every attempt, score and weak spot in one dashboard." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [history, setHistory] = useState<Attempt[]>([]);
  const [s, setS] = useState({ quizzes: 0, answered: 0, accuracy: 0, mastered: 0 });

  useEffect(() => {
    const sync = () => {
      setHistory(getHistory());
      setS(stats());
    };
    sync();
    window.addEventListener("quizforge:progress", sync);
    return () => window.removeEventListener("quizforge:progress", sync);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary">
            <TrendingUp className="size-4" /> Progress
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">Your history</h1>
        </div>
        {history.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              clearHistory();
              setHistory([]);
            }}
          >
            <Trash2 className="size-4" /> Reset
          </Button>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "Quizzes", v: s.quizzes },
          { k: "Answered", v: s.answered },
          { k: "Accuracy", v: `${s.accuracy}%` },
          { k: "Mastered", v: s.mastered },
        ].map((m) => (
          <div key={m.k} className="panel p-4">
            <dt className="text-xs text-muted-foreground">{m.k}</dt>
            <dd className="mt-1 font-display text-2xl font-bold">{m.v}</dd>
          </div>
        ))}
      </dl>

      {history.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No attempts yet — finish a quiz and it will show up here.
          </p>
          <Button asChild className="mt-4">
            <Link to="/">Browse subjects</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((a) => {
            const pct = Math.round((a.correct / a.total) * 100);
            return (
              <div key={a.id} className="panel p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{a.label}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {new Date(a.finishedAt).toLocaleString()} · {Math.round(a.durationMs / 60000)} min
                    </p>
                  </div>
                  <span
                    className={`font-display text-xl font-bold ${
                      pct >= 70 ? "text-success" : pct >= 40 ? "text-warning" : "text-destructive"
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <Progress value={pct} className="mt-3 h-1.5" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {a.correct}/{a.total} correct · {a.mode} mode
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
