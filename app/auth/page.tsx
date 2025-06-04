'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type AuthMode = 'login' | 'register' | 'forgot-password';
type UserRole = 'employer' | 'maid';

export default function Auth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole>('employer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'forgot-password') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset-password`,
        });

        if (resetError) throw resetError;

        setSuccessMessage('Password reset instructions have been sent to your email.');
        return;
      }

      if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        let authData;
        try {
          console.log('Starting registration process...');
          
          // First create the auth user
          const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                role: role,
                full_name: fullName
              },
              emailRedirectTo: `${window.location.origin}/auth?mode=login`
            }
          });

          console.log('Auth signup response:', { data, error: authError });

          if (authError) {
            console.error('Auth error details:', authError);
            if (authError.message.includes('already registered')) {
              throw new Error('This email is already registered. Please log in instead.');
            }
            throw new Error(`Registration failed: ${authError.message}`);
          }

          if (!data?.user) {
            console.error('No user data returned from signup');
            throw new Error('Failed to create user account. Please try again.');
          }

          // Check if email confirmation is required
          if (data.user.identities?.length === 0) {
            setSuccessMessage('Registration successful! Please check your email to verify your account before logging in.');
            setMode('login');
            return;
          }

          authData = data;
          const userId = data.user.id;
          console.log('Auth user created successfully:', userId);

          // Wait a moment to ensure the auth user is fully created
          console.log('Waiting for auth user to be fully created...');
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Check if profile was created by trigger
          console.log('Checking if profile was created...');
          const { data: profile, error: profileError } = await supabase
            .from(role === 'employer' ? 'employers' : 'maids')
            .select()
            .eq('id', userId)
            .maybeSingle();

          if (profileError) {
            console.error('Profile check error:', profileError);
            throw new Error(`Failed to check profile status: ${profileError.message}`);
          }

          if (!profile) {
            console.error('Profile not created by trigger');
            // Instead of trying to delete the user, just show an error
            throw new Error('Failed to create user profile. Please try again or contact support if the issue persists.');
          }

          console.log('Registration completed successfully');
          setSuccessMessage('Registration successful! Logging you in...');
          
          // Automatically log in the user
          console.log('Attempting auto-login...');
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (signInError) {
            console.error('Auto-login error:', signInError);
            setMode('login');
            return;
          }

          if (!signInData.user) {
            console.error('No user data returned from auto-login');
            setMode('login');
            return;
          }

          console.log('Auto-login successful, user data:', signInData.user);

          // Get user role from metadata
          const userRole = signInData.user.user_metadata.role;
          console.log('User role:', userRole);

          // Direct role-based redirect
          if (userRole === 'maid') {
            console.log('Redirecting to maid dashboard...');
            router.push('/maid-dashboard');
            return;
          } else if (userRole === 'employer') {
            console.log('Redirecting to employer dashboard...');
            router.push('/employer-dashboard');
            return;
          }

          // Fallback
          console.log('Redirecting to home page...');
          router.push('/');
          return;
        } catch (error: any) {
          console.error('Registration error:', error);
          if (error.message.includes('already registered') || error.message.includes('duplicate key')) {
            setError('This email is already registered. Logging you in...');
            
            // Attempt to log in automatically
            try {
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
              });

              if (signInError) {
                throw signInError;
              }

              if (!signInData.user) {
                throw new Error('Login failed');
              }

              // Get user role from metadata
              const userRole = signInData.user.user_metadata.role;
              console.log('Auto-login successful, user role:', userRole);

              // Redirect to appropriate dashboard
              if (userRole === 'maid') {
                router.push('/maid-dashboard');
              } else if (userRole === 'employer') {
                router.push('/employer-dashboard');
              } else {
                router.push('/');
              }
            } catch (loginError: any) {
              console.error('Auto-login error:', loginError);
              setError('Please log in manually with your password.');
              setMode('login');
              setEmail(email);
            }
            return;
          }
          throw new Error(`Registration failed: ${error.message}`);
        }
      } else {
        // Login existing user
        console.log('Starting login process...');
        console.log('Attempting login with email:', email);
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          console.error('Login error details:', signInError);
          if (signInError.message.includes('Email not confirmed')) {
            throw new Error('Please verify your email address before logging in. Check your inbox for the verification link.');
          } else if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please try again or use the "Forgot Password" option if you cannot remember your password.');
          }
          throw signInError;
        }

        if (!signInData.user) {
          console.error('No user data returned from login');
          throw new Error('Login failed. Please try again.');
        }

        console.log('Login successful, user data:', {
          id: signInData.user.id,
          email: signInData.user.email,
          metadata: signInData.user.user_metadata
        });

        // Get user role from metadata
        const userRole = signInData.user.user_metadata.role;
        console.log('User role:', userRole);

        // Direct role-based redirect
        if (userRole === 'maid') {
          console.log('Redirecting to maid dashboard...');
          router.push('/maid-dashboard');
          return;
        } else if (userRole === 'employer') {
          console.log('Redirecting to employer dashboard...');
          router.push('/employer-dashboard');
          return;
        }

        // Fallback
        console.log('Redirecting to home page...');
        router.push('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'login' ? 'Sign in to your account' : 
           mode === 'register' ? 'Create your account' : 
           'Reset your password'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {mode === 'login' ? (
            <>
              Or{' '}
              <button
                onClick={() => setMode('register')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                create a new account
              </button>
            </>
          ) : mode === 'register' ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Remember your password?{' '}
              <button
                onClick={() => setMode('login')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                {successMessage}
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    I am a
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('employer')}
                      className={`${
                        role === 'employer'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      } border border-gray-300 rounded-md py-2 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      Employer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('maid')}
                      className={`${
                        role === 'maid'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      } border border-gray-300 rounded-md py-2 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      Maid
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {mode !== 'forgot-password' && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {mode === 'login' ? 'Signing in...' : 
                     mode === 'register' ? 'Creating account...' : 
                     'Sending reset instructions...'}
                  </span>
                ) : (
                  mode === 'login' ? 'Sign in' : 
                  mode === 'register' ? 'Create account' : 
                  'Send reset instructions'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 