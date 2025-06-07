-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Clear all related tables
TRUNCATE TABLE maids CASCADE;
TRUNCATE TABLE employers CASCADE;
TRUNCATE TABLE auth.users CASCADE;
TRUNCATE TABLE auth.identities CASCADE;
TRUNCATE TABLE auth.sessions CASCADE;
TRUNCATE TABLE auth.refresh_tokens CASCADE;
TRUNCATE TABLE auth.mfa_factors CASCADE;
TRUNCATE TABLE auth.mfa_challenges CASCADE;
TRUNCATE TABLE auth.mfa_amr_claims CASCADE;
TRUNCATE TABLE auth.flow_state CASCADE;
TRUNCATE TABLE auth.sso_providers CASCADE;
TRUNCATE TABLE auth.sso_domains CASCADE;
TRUNCATE TABLE auth.saml_providers CASCADE;
TRUNCATE TABLE auth.saml_relay_states CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Drop and recreate the user creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auth.handle_new_user();

-- Create new function to handle user creation
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get the user's role from metadata
    user_role := NEW.raw_user_meta_data->>'role';
    
    -- If role is not set, default to employer
    IF user_role IS NULL THEN
        user_role := 'employer';
        NEW.raw_user_meta_data = NEW.raw_user_meta_data || jsonb_build_object('role', user_role);
    END IF;
    
    -- Create profile based on role
    IF user_role = 'maid' THEN
        INSERT INTO maids (id, email, full_name)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', '')
        );
    ELSIF user_role = 'employer' THEN
        INSERT INTO employers (id, email, full_name)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', '')
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.handle_new_user(); 