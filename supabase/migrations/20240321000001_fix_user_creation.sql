-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auth.handle_new_user();

-- Create new function to handle user creation
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    table_exists BOOLEAN;
BEGIN
    -- Set default role if not provided
    IF NEW.raw_user_meta_data->>'role' IS NULL THEN
        NEW.raw_user_meta_data = NEW.raw_user_meta_data || jsonb_build_object('role', 'employer');
    END IF;
    
    -- Get the user's role
    user_role := NEW.raw_user_meta_data->>'role';
    
    -- Check if the target table exists
    IF user_role = 'employer' THEN
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'employers'
        ) INTO table_exists;
        
        IF table_exists THEN
            -- Use service role to insert
            SET LOCAL ROLE service_role;
            INSERT INTO employers (id, email, full_name)
            VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
            RESET ROLE;
        ELSE
            RAISE LOG 'employers table does not exist';
        END IF;
    ELSIF user_role = 'maid' THEN
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'maids'
        ) INTO table_exists;
        
        IF table_exists THEN
            -- Use service role to insert
            SET LOCAL ROLE service_role;
            INSERT INTO maids (id, email, full_name)
            VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
            RESET ROLE;
        ELSE
            RAISE LOG 'maids table does not exist';
        END IF;
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