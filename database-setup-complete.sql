-- Complete V2 Database Setup
-- Run this in Supabase SQL Editor

-- Create groups table if not exists
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#FFED00',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add columns to items table if they don't exist
DO $$ 
BEGIN
  -- Add group_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='items' AND column_name='group_id') THEN
    ALTER TABLE items ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE SET NULL;
  END IF;
  
  -- Add image column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='items' AND column_name='image') THEN
    ALTER TABLE items ADD COLUMN image TEXT;
  END IF;
END $$;

-- Enable RLS on groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all operations for groups" ON groups;

-- Create policies for groups
CREATE POLICY "Enable all operations for groups" ON groups FOR ALL USING (true) WITH CHECK (true);

-- Create default "Ungrouped" group if it doesn't exist
INSERT INTO groups (id, name, color, sort_order) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Ungrouped', '#575F60', 999)
ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Database setup complete!';
END $$;
