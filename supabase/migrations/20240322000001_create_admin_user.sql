-- Create admin user with proper UUID
DO $$
DECLARE
    admin_id UUID := gen_random_uuid();
BEGIN
    -- Insert into auth.users
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        raw_user_meta_data,
        created_at,
        updated_at,
        email_confirmed_at,
        instance_id
    ) VALUES (
        admin_id,
        'admin@example.com',
        crypt('admin123', gen_salt('bf')),
        '{"role": "admin"}',
        NOW(),
        NOW(),
        NOW(),
        '00000000-0000-0000-0000-000000000000'
    );

    -- Insert into public.admins
    INSERT INTO public.admins (
        id,
        email,
        full_name
    ) VALUES (
        admin_id,
        'admin@example.com',
        'Admin User'
    );
END $$; 