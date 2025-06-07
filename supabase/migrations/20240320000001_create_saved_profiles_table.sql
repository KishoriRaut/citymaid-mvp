-- Create saved_profiles table
CREATE TABLE IF NOT EXISTS saved_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    maid_id UUID NOT NULL REFERENCES maids(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, maid_id)
);

-- Enable Row Level Security
ALTER TABLE saved_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved profiles"
    ON saved_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved profiles"
    ON saved_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved profiles"
    ON saved_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER saved_profiles_updated_at
    BEFORE UPDATE ON saved_profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at(); 