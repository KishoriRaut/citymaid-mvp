'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
          // Check if session is about to expire
          const expiresAt = new Date(session.expires_at! * 1000);
          const now = new Date();
          const timeUntilExpiry = expiresAt.getTime() - now.getTime();
          
          if (timeUntilExpiry < 5 * 60 * 1000) { // 5 minutes in milliseconds
            console.log('Session about to expire, refreshing...');
            const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) throw refreshError;
            if (newSession) {
              // Get user role from metadata
              const userRole = newSession.user.user_metadata.role;
              if (userRole === 'employer') {
                router.push('/employer-dashboard');
              } else if (userRole === 'maid') {
                router.push('/maid-dashboard');
              } else {
                router.push('/');
              }
              return;
            }
          }
          
          // Get user role from metadata
          const userRole = session.user.user_metadata.role;
          if (userRole === 'employer') {
            router.push('/employer-dashboard');
          } else if (userRole === 'maid') {
            router.push('/maid-dashboard');
          } else {
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        // Don't set error state here, just let the user log in
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        // Get user role from metadata
        const userRole = data.user.user_metadata.role;
        
        // Check if this is a payment flow (maid_id and plan in URL)
        const maidId = searchParams.get('maid_id');
        const plan = searchParams.get('plan');
        
        if (maidId && plan) {
          // This is a payment flow, redirect back to maid details page
          router.push(`/maid-details/${maidId}?plan=${plan}`);
        } else {
          // Check if profile exists for maids
          if (userRole === 'maid') {
            console.log('Checking maid profile for user ID:', data.user.id);
            console.log('User metadata:', data.user.user_metadata);
            
            const { data: maidProfile, error: profileError } = await supabase
              .from('maids')
              .select('id, email, full_name')  // Select specific fields for debugging
              .eq('id', data.user.id)
              .maybeSingle();

            console.log('Profile check result:', { 
              maidProfile, 
              profileError,
              userId: data.user.id,
              userEmail: data.user.email
            });

            if (profileError) {
              console.error('Profile check error:', profileError);
              throw new Error('Failed to check profile status');
            }

            // If profile exists, go directly to dashboard
            if (maidProfile) {
              console.log('Profile found, redirecting to dashboard');
              router.push('/maid-dashboard');
              return;
            }

            console.log('No profile found, redirecting to profile creation');
            // If no profile exists, redirect to profile creation
            router.push('/maid-profile');
            return;
          }

          // For employers, proceed with role-based redirect
          if (userRole === 'employer') {
            router.push('/employer-dashboard');
          } else {
            router.push('/');
          }
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please sign in to continue
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 