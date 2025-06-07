-- Create admin table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policies for admin table
CREATE POLICY "Admins can view all admin profiles"
    ON public.admins FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can update their own profile"
    ON public.admins FOR UPDATE
    USING (auth.uid() = id);

-- Create admin_messages table
CREATE TABLE IF NOT EXISTS public.admin_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sender_type TEXT NOT NULL DEFAULT 'admin' CHECK (sender_type IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_messages_admin_id ON admin_messages(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_user_id ON admin_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at ON admin_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_messages_sender_type ON admin_messages(sender_type);

-- Enable Row Level Security
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_messages
CREATE POLICY "Admins can view all messages"
    ON public.admin_messages FOR SELECT
    USING (
        auth.uid() IN (SELECT id FROM public.admins) OR
        auth.uid() = user_id
    );

CREATE POLICY "Admins can send messages"
    ON public.admin_messages FOR INSERT
    WITH CHECK (
        auth.uid() IN (SELECT id FROM public.admins) AND
        sender_type = 'admin'
    );

CREATE POLICY "Users can send messages to admin"
    ON public.admin_messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        sender_type = 'user'
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_admin_messages_updated_at
    BEFORE UPDATE ON admin_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_messages_updated_at();

-- Grant access to authenticated users
GRANT ALL ON public.admins TO authenticated;
GRANT ALL ON public.admin_messages TO authenticated;
GRANT ALL ON public.admins TO service_role;
GRANT ALL ON public.admin_messages TO service_role; 