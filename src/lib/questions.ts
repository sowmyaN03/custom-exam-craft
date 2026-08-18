import raw from "@/data/questions.json";

export type Question = {
  id: string;
  question: string;
  options: string[];
  correct: number[];
  explanation: string;
  subject: string;
  section: string;
  source: string;
  repeatCount: number;
  fromRepeatedPaper: boolean;
  recall?: boolean;
};

export const QUESTIONS = raw as Question[];

export const QUIZ_SIZE = 30;

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const SECTION_ORDER = [
  "Frontend Foundations",
  "Java & Spring",
  "Backend & Data",
  "DevOps & Cloud",
  "Mixed Practice",
];

export type SubjectInfo = { name: string; slug: string; count: number; sets: number };
export type SectionInfo = { name: string; slug: string; count: number; subjects: SubjectInfo[] };

export const SECTIONS: SectionInfo[] = (() => {
  const bySection = new Map<string, Map<string, Question[]>>();
  for (const q of QUESTIONS) {
    if (!bySection.has(q.section)) bySection.set(q.section, new Map());
    const subj = bySection.get(q.section)!;
    if (!subj.has(q.subject)) subj.set(q.subject, []);
    subj.get(q.subject)!.push(q);
  }
  return [...bySection.entries()]
    .map(([name, subjects]) => ({
      name,
      slug: slug(name),
      count: [...subjects.values()].reduce((a, b) => a + b.length, 0),
      subjects: [...subjects.entries()]
        .map(([sname, list]) => ({
          name: sname,
          slug: slug(sname),
          count: list.length,
          sets: Math.ceil(list.length / QUIZ_SIZE),
        }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => {
      const ai = SECTION_ORDER.indexOf(a.name);
      const bi = SECTION_ORDER.indexOf(b.name);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
})();

export const SUBJECTS: SubjectInfo[] = SECTIONS.flatMap((s) => s.subjects);

export const REPEATED = QUESTIONS.filter((q) => q.repeatCount > 1 || q.fromRepeatedPaper);

export function subjectBySlug(s: string) {
  return SUBJECTS.find((x) => x.slug === s);
}

export function sectionBySlug(s: string) {
  return SECTIONS.find((x) => x.slug === s);
}

export function questionsForSubject(subjectSlug: string) {
  return QUESTIONS.filter((q) => slug(q.subject) === subjectSlug);
}

export function chunk<T>(list: T[], size = QUIZ_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export function shuffle<T>(list: T[], seed = Date.now()): T[] {
  const arr = [...list];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function searchQuestions(term: string, limit = 60): Question[] {
  const t = term.trim().toLowerCase();
  if (t.length < 2) return [];
  const words = t.split(/\s+/);
  const scored: { q: Question; score: number }[] = [];
  for (const q of QUESTIONS) {
    const hay = (q.question + " " + q.options.join(" ") + " " + q.subject).toLowerCase();
    let score = 0;
    for (const w of words) if (hay.includes(w)) score += hay.indexOf(w) < 60 ? 2 : 1;
    if (score >= words.length) scored.push({ q, score });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.q);
}

export const TOTALS = {
  questions: QUESTIONS.length,
  subjects: SUBJECTS.length,
  sections: SECTIONS.length,
  repeated: REPEATED.length,
};
