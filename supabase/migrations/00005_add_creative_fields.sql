-- Add missing fields to creatives table to store full AI output
ALTER TABLE creatives 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS framework TEXT,
ADD COLUMN IF NOT EXISTS strategy_explanation TEXT,
ADD COLUMN IF NOT EXISTS suggested_duration TEXT,
ADD COLUMN IF NOT EXISTS scroll_stop_score NUMERIC,
ADD COLUMN IF NOT EXISTS conversion_potential TEXT,
ADD COLUMN IF NOT EXISTS emotional_trigger TEXT;
