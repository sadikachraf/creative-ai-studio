-- Add creative management fields to the creatives table
ALTER TABLE creatives
  ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add a trigger to auto-update updated_at on row update
CREATE OR REPLACE FUNCTION update_creatives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS creatives_updated_at_trigger ON creatives;
CREATE TRIGGER creatives_updated_at_trigger
  BEFORE UPDATE ON creatives
  FOR EACH ROW EXECUTE PROCEDURE update_creatives_updated_at();
