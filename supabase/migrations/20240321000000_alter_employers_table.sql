-- First, drop the existing primary key constraint
ALTER TABLE employers DROP CONSTRAINT IF EXISTS employers_pkey;
 
-- Then modify the id column to reference auth.users
ALTER TABLE employers 
    ALTER COLUMN id DROP DEFAULT,
    ADD CONSTRAINT employers_pkey PRIMARY KEY (id),
    ADD CONSTRAINT employers_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE; 