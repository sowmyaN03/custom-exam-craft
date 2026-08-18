import { Link } from "@tanstack/react-router";
import { Search, History, Upload, Sparkles, Layers, Repeat2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { SearchDialog } from "./SearchDialog";

const NAV = [
  { to: "/", label: "Library", icon: Layers },
  { to: "/repeated", label: "Repeated", icon: Repeat2 },
  { to: "/custom", label: "Custom exam", icon: Sparkles },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/history", label: "Progress", icon: History },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="mr-2 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary glow-ring">
              <Sparkles className="size-4" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Quiz<span className="text-gradient">Forge</span>
            </span>
          </Link>

          <nav className="hide-scrollbar ml-auto flex items-center gap-1 overflow-x-auto md:ml-0">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                <span className="flex items-center gap-2">
                  <n.icon className="size-4" />
                  <span className="hidden sm:inline">{n.label}</span>
                </span>
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search questions"
            className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
          >
            <Search className="size-4" />
            <span className="hidden lg:inline">Search questions</span>
            <kbd className="hidden rounded border border-border px-1.5 text-[10px] lg:inline">⌘K</kbd>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-xs text-muted-foreground">
        Built from your question papers — Angular topics excluded.
      </footer>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
