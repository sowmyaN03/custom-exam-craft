export type Attempt = {
  id: string;
  label: string;
  mode: "subject" | "repeated" | "custom" | "upload";
  subject?: string;
  total: number;
  correct: number;
  durationMs: number;
  finishedAt: number;
  wrongIds: string[];
};

const KEY = "quizforge.history.v1";
const SEEN = "quizforge.seen.v1";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable */
  }
}

export function getHistory(): Attempt[] {
  return read<Attempt[]>(KEY, []).sort((a, b) => b.finishedAt - a.finishedAt);
}

export function saveAttempt(a: Attempt) {
  const list = read<Attempt[]>(KEY, []);
  list.push(a);
  write(KEY, list.slice(-300));
  window.dispatchEvent(new Event("quizforge:progress"));
}

export function clearHistory() {
  write(KEY, []);
  write(SEEN, {});
  window.dispatchEvent(new Event("quizforge:progress"));
}

/** per-question stats: { [id]: [attempts, correct] } */
export function getSeen(): Record<string, [number, number]> {
  return read<Record<string, [number, number]>>(SEEN, {});
}

export function recordAnswer(id: string, wasCorrect: boolean) {
  const seen = getSeen();
  const cur = seen[id] ?? [0, 0];
  seen[id] = [cur[0] + 1, cur[1] + (wasCorrect ? 1 : 0)];
  write(SEEN, seen);
}

export function stats() {
  const history = getHistory();
  const seen = getSeen();
  const answered = Object.values(seen).reduce((a, b) => a + b[0], 0);
  const right = Object.values(seen).reduce((a, b) => a + b[1], 0);
  return {
    quizzes: history.length,
    answered,
    accuracy: answered ? Math.round((right / answered) * 100) : 0,
    mastered: Object.values(seen).filter((s) => s[1] > 0 && s[1] === s[0]).length,
    weakIds: Object.entries(seen)
      .filter(([, s]) => s[1] / s[0] < 0.5)
      .map(([id]) => id),
  };
}
