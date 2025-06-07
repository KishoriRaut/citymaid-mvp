-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Clear data from tables (without dropping them)
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