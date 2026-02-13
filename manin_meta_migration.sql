-- Create manin_meta table for persistent generic values (like feature votes)
CREATE TABLE IF NOT EXISTS public.manin_meta (
    key TEXT PRIMARY KEY,
    value_int BIGINT DEFAULT 0,
    value_text TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.manin_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service_role full access" ON public.manin_meta FOR ALL TO service_role USING (true);
CREATE POLICY "Allow anon read" ON public.manin_meta FOR SELECT TO anon USING (true);

-- Seed initial non-zero values for feature previews
INSERT INTO public.manin_meta (key, value_int) 
VALUES ('votes_paper_trading', 1240)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.manin_meta (key, value_int) 
VALUES ('votes_strategy_backtesting', 892)
ON CONFLICT (key) DO NOTHING;
