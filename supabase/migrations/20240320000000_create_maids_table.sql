-- Create maids table
CREATE TABLE IF NOT EXISTS public.maids (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    preferred_location TEXT,
    specific_area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.maids ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Maids can view their own profile"
    ON public.maids FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Maids can update their own profile"
    ON public.maids FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Maids can insert their own profile"
    ON public.maids FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Grant access to authenticated users
GRANT ALL ON public.maids TO authenticated;
GRANT ALL ON public.maids TO service_role; 