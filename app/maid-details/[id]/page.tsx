'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { initializeKhaltiPayment } from '@/lib/khalti';
import PlaceholderProfile from '@/components/PlaceholderProfile';
import Link from 'next/link';
import BackButton from '../../components/BackButton';

interface Maid {
  id: string;
  full_name: string;
  age_group: string;
  gender: string;
  marital_status: string;
  email: string;
  phone: string;
  years_experience: string;
  available_from: string;
  preferred_working_time: string;
  expected_salary: string;
  preferred_location: string;
  specific_area: string;
  nationality: string;
  religion: string;
  education_level: string;
  available_documents: string;
  languages_spoken: string[];
  skills: string[];
  about_me: string;
  photo_url: string;
  created_at: string;
}

export default function MaidDetails() {
  const params = useParams();
  const router = useRouter();
  const [maid, setMaid] = useState<Maid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isContactUnlocked, setIsContactUnlocked] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'standard' | 'premium' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  useEffect(() => {
    return () => {
      setSelectedPlan(null);
      setProcessingPayment(false);
      setPaymentInitiated(false);
      setPlanError(null);
    };
  }, []);

  useEffect(() => {
    const initializePage = async () => {
      try {
        await checkAuth();
        await fetchMaidDetails();
        
        const paymentStatus = localStorage.getItem(`payment_${params.id}`);
        if (paymentStatus === 'completed') {
          setIsContactUnlocked(true);
        }

        const searchParams = new URLSearchParams(window.location.search);
        const plan = searchParams.get('plan') as 'basic' | 'standard' | 'premium' | null;
        if (plan && isAuthenticated) {
          await handleUnlockContact(plan);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setError('Failed to initialize page. Please refresh and try again.');
      }
    };

    initializePage();
  }, [params.id]);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session) {
        const expiresAt = new Date(session.expires_at! * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        
        if (timeUntilExpiry < 5 * 60 * 1000) {
          console.log('Session about to expire, refreshing...');
          const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) throw refreshError;
          if (newSession) {
            setIsAuthenticated(true);
            return;
          }
        }
        
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const fetchMaidDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('maids')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setMaid(data);
    } catch (error) {
      console.error('Error fetching maid details:', error);
      setError('Failed to load maid details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = () => {
    setImageLoadError(true);
  };

  const getPlanDetails = (plan: 'basic' | 'standard' | 'premium') => {
    switch (plan) {
      case 'basic':
        return { price: 500, maids: 1, days: 7 };
      case 'standard':
        return { price: 1000, maids: 3, days: 14 };
      case 'premium':
        return { price: 1500, maids: 5, days: 21 };
      default:
        return { price: 0, maids: 0, days: 0 };
    }
  };

  const handlePlanSelection = (plan: 'basic' | 'standard' | 'premium') => {
    if (processingPayment || paymentInitiated) return;
    setSelectedPlan(plan);
    setPlanError(null);
  };

  const handleUnlockContact = async (plan: 'basic' | 'standard' | 'premium') => {
    try {
      if (processingPayment || paymentInitiated) {
        console.log('Payment already in progress');
        return;
      }

      setPlanError(null);
      setPaymentInitiated(true);

      // Check authentication first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication error. Please log in again.');
      }

      if (!session) {
        const returnUrl = encodeURIComponent(window.location.pathname);
        router.push(`/login?returnUrl=${returnUrl}&maid_id=${params.id}&plan=${plan}`);
        return;
      }

      // Check if session is about to expire
      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      
      if (timeUntilExpiry < 5 * 60 * 1000) { // 5 minutes
        console.log('Session about to expire, refreshing...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          throw new Error('Session expired. Please log in again.');
        }
        if (!refreshData.session) {
          throw new Error('Failed to refresh session. Please log in again.');
        }
      }

      setProcessingPayment(true);
      const planDetails = getPlanDetails(plan);
      
      if (!planDetails.price || !planDetails.maids || !planDetails.days) {
        throw new Error('Invalid plan details');
      }

      console.log('Initiating payment for plan:', {
        plan,
        planDetails,
        maidId: params.id
      });

      const result = await initializeKhaltiPayment(planDetails.price, params.id as string);
      
      if (!result || !result.payment_url) {
        console.error('Invalid payment response:', result);
        throw new Error('Failed to initialize payment - no payment URL received');
      }

      const paymentUrl = new URL(result.payment_url);
      paymentUrl.searchParams.append('maid_id', params.id as string);
      paymentUrl.searchParams.append('amount', planDetails.price.toString());
      paymentUrl.searchParams.append('plan', plan);
      paymentUrl.searchParams.append('maids', planDetails.maids.toString());
      paymentUrl.searchParams.append('days', planDetails.days.toString());
      paymentUrl.searchParams.append('return_url', `${window.location.origin}/payment/success`);
      paymentUrl.searchParams.append('cancel_url', `${window.location.origin}/payment/cancel`);
      
      console.log('Redirecting to payment URL:', paymentUrl.toString());
      
      localStorage.setItem(`payment_initiated_${params.id}`, JSON.stringify({
        plan,
        timestamp: new Date().toISOString(),
        maidId: params.id
      }));
      
      window.location.href = paymentUrl.toString();
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      setPlanError(error.message || 'Failed to process payment. Please try again.');
      if (error.message?.includes('session') || error.message?.includes('unauthorized')) {
        setIsAuthenticated(false);
        router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      }
    } finally {
      setProcessingPayment(false);
      setPaymentInitiated(false);
    }
  };

  useEffect(() => {
    const checkPaymentStatus = () => {
      const paymentInitiated = localStorage.getItem(`payment_initiated_${params.id}`);
      if (paymentInitiated) {
        const { timestamp } = JSON.parse(paymentInitiated);
        const initiatedTime = new Date(timestamp).getTime();
        const now = new Date().getTime();
        
        if (now - initiatedTime > 30 * 60 * 1000) {
          localStorage.removeItem(`payment_initiated_${params.id}`);
        }
      }
    };

    checkPaymentStatus();
  }, [params.id]);

  if (isCheckingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !maid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || 'Maid not found'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <BackButton href="/find-maids" label="Back to Search" />
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Photo Section */}
          <div className="md:w-1/3 bg-gray-100 p-6">
            <div className="aspect-w-3 aspect-h-4 relative">
              {maid.photo_url && !imageLoadError ? (
                <img
                  src={maid.photo_url}
                  alt={maid.full_name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                  <PlaceholderProfile />
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="md:w-2/3 p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{maid.full_name}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Basic Information</h2>
                <div className="space-y-2">
                  <p><span className="font-medium">Age Group:</span> {maid.age_group}</p>
                  <p><span className="font-medium">Gender:</span> {maid.gender}</p>
                  <p><span className="font-medium">Marital Status:</span> {maid.marital_status}</p>
                  <p><span className="font-medium">Nationality:</span> {maid.nationality}</p>
                  <p><span className="font-medium">Religion:</span> {maid.religion}</p>
                </div>
              </div>

              {/* Work Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Work Information</h2>
                <div className="space-y-2">
                  <p><span className="font-medium">Experience:</span> {maid.years_experience}</p>
                  <p><span className="font-medium">Available From:</span> {maid.available_from}</p>
                  <p><span className="font-medium">Working Time:</span> {maid.preferred_working_time}</p>
                  <p><span className="font-medium">Expected Salary:</span> {maid.expected_salary}</p>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Location</h2>
                <div className="space-y-2">
                  <p><span className="font-medium">Preferred Location:</span> {maid.preferred_location}</p>
                  <p><span className="font-medium">Specific Area:</span> {maid.specific_area}</p>
                </div>
              </div>

              {/* Education & Documents */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Education & Documents</h2>
                <div className="space-y-2">
                  <p><span className="font-medium">Education Level:</span> {maid.education_level}</p>
                  <p><span className="font-medium">Available Documents:</span> {maid.available_documents}</p>
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="mt-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Languages</h2>
              <div className="flex flex-wrap gap-2">
                {maid.languages_spoken.map((language, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="mt-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {maid.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* About */}
            {maid.about_me && (
              <div className="mt-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">About</h2>
                <p className="text-gray-600">{maid.about_me}</p>
              </div>
            )}

            {/* Contact Information */}
            {isContactUnlocked ? (
              <div className="mt-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Contact Information</h2>
                <div className="space-y-2">
                  <p><span className="font-medium">Email:</span> {maid.email}</p>
                  <p><span className="font-medium">Phone:</span> {maid.phone}</p>
                </div>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Choose a Plan</h2>
                {planError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {planError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Basic Plan */}
                  <div 
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedPlan === 'basic' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-blue-500'
                    }`}
                  >
                    <h3 className="text-lg font-semibold mb-2">Basic Plan</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-2">NPR 500</p>
                    <ul className="space-y-2 mb-4">
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        1 Maid Contact
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        7 Days Access
                      </li>
                    </ul>
                    <button
                      onClick={() => {
                        handlePlanSelection('basic');
                        handleUnlockContact('basic');
                      }}
                      disabled={processingPayment}
                      className={`w-full px-4 py-2 rounded-md transition-colors ${
                        selectedPlan === 'basic'
                          ? 'bg-blue-700 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:bg-blue-400`}
                    >
                      {processingPayment && selectedPlan === 'basic' ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        selectedPlan === 'basic' ? 'Selected' : 'Select Plan'
                      )}
                    </button>
                  </div>

                  {/* Standard Plan */}
                  <div 
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedPlan === 'standard' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-blue-500'
                    }`}
                  >
                    <h3 className="text-lg font-semibold mb-2">Standard Plan</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-2">NPR 1000</p>
                    <ul className="space-y-2 mb-4">
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        3 Maid Contacts
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        14 Days Access
                      </li>
                    </ul>
                    <button
                      onClick={() => {
                        handlePlanSelection('standard');
                        handleUnlockContact('standard');
                      }}
                      disabled={processingPayment}
                      className={`w-full px-4 py-2 rounded-md transition-colors ${
                        selectedPlan === 'standard'
                          ? 'bg-blue-700 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:bg-blue-400`}
                    >
                      {processingPayment && selectedPlan === 'standard' ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        selectedPlan === 'standard' ? 'Selected' : 'Select Plan'
                      )}
                    </button>
                  </div>

                  {/* Premium Plan */}
                  <div 
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedPlan === 'premium' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-blue-500'
                    }`}
                  >
                    <h3 className="text-lg font-semibold mb-2">Premium Plan</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-2">NPR 1500</p>
                    <ul className="space-y-2 mb-4">
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        5 Maid Contacts
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        21 Days Access
                      </li>
                    </ul>
                    <button
                      onClick={() => {
                        handlePlanSelection('premium');
                        handleUnlockContact('premium');
                      }}
                      disabled={processingPayment}
                      className={`w-full px-4 py-2 rounded-md transition-colors ${
                        selectedPlan === 'premium'
                          ? 'bg-blue-700 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:bg-blue-400`}
                    >
                      {processingPayment && selectedPlan === 'premium' ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        selectedPlan === 'premium' ? 'Selected' : 'Select Plan'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 