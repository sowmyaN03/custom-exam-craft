CREATE TABLE public.explanations (
  question_id TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.explanations TO anon;
GRANT SELECT ON public.explanations TO authenticated;
GRANT ALL ON public.explanations TO service_role;
ALTER TABLE public.explanations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Explanations are readable by everyone" ON public.explanations FOR SELECT TO anon, authenticated USING (true);