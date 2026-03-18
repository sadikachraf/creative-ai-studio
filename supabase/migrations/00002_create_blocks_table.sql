-- Table: blocks
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    block_number INTEGER,
    block_type TEXT,
    block_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
