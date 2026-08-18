import { useNavigate } from "@tanstack/react-router";
import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { searchQuestions, slug } from "@/lib/questions";

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const results = useMemo(() => searchQuestions(term, 40), [term]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="sr-only">Search questions</DialogTitle>
          <div className="flex items-center gap-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search 400+ questions, options, topics…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {term.trim().length < 2 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Type at least two characters to search.
            </p>
          )}
          {term.trim().length >= 2 && results.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">No matches found.</p>
          )}
          {results.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                onOpenChange(false);
                navigate({ to: "/subject/$subject", params: { subject: slug(q.subject) } });
              }}
              className="mb-1 w-full rounded-lg px-3 py-3 text-left transition-colors hover:bg-secondary"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug">{q.question}</p>
                <span className="shrink-0 rounded-md bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">
                  {q.subject}
                </span>
              </div>
              <ul className="mt-2 space-y-0.5">
                {q.options.map((o, i) => (
                  <li
                    key={i}
                    className={
                      q.correct.includes(i)
                        ? "flex items-center gap-1.5 text-xs text-success"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {q.correct.includes(i) && <Check className="size-3" />}
                    {String.fromCharCode(65 + i)}. {o}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
