-- Create employers table
CREATE TABLE IF NOT EXISTS employers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    preferred_location TEXT,
    specific_area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own employer profile"
    ON employers FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own employer profile"
    ON employers FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own employer profile"
    ON employers FOR UPDATE
    USING (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER employers_updated_at
    BEFORE UPDATE ON employers
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at(); 