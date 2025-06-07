'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyKhaltiPayment } from '@/lib/khalti';
import { supabase } from '@/lib/supabaseClient';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const token = searchParams.get('token');
        const amount = searchParams.get('amount');
        const maidId = searchParams.get('maid_id');
        const plan = searchParams.get('plan');
        const maids = searchParams.get('maids');
        const days = searchParams.get('days');

        console.log('Payment verification parameters:', {
          token,
          amount,
          maidId,
          plan,
          maids,
          days
        });

        if (!token || !amount || !maidId || !plan || !maids || !days) {
          throw new Error('Missing payment information');
        }

        // Get the current user's ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('User not authenticated');
        }

        const result = await verifyKhaltiPayment(
          token,
          parseFloat(amount),
          maidId,
          plan,
          parseInt(maids),
          parseInt(days),
          user.id
        );

        // Check both the verification status and payment details
        if (result.status === 'Completed' && result.payment_details?.status === 'Completed') {
          setStatus('success');
          setMessage('Payment successful! You can now view the contact information.');
          
          // Store the subscription details in localStorage
          const subscriptionDetails = {
            maidId,
            plan,
            maids: parseInt(maids),
            days: parseInt(days),
            expiresAt: result.payment_record.expires_at,
            remainingMaids: parseInt(maids),
            paymentId: result.payment_record.khalti_payment_id,
            paymentDate: result.payment_record.payment_date
          };
          
          console.log('Storing subscription details:', subscriptionDetails);
          
          localStorage.setItem(`subscription_${maidId}`, JSON.stringify(subscriptionDetails));
          localStorage.setItem(`payment_${maidId}`, 'completed');
          
          // Redirect back to maid details page after 3 seconds
          setTimeout(() => {
            router.push(`/maid-details/${maidId}`);
          }, 3000);
        } else {
          console.error('Payment verification failed:', result);
          throw new Error('Payment verification failed: Invalid payment status');
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Payment verification failed. Please try again.');
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          )}
          {status === 'success' && (
            <div className="text-green-500 text-5xl mb-4">✓</div>
          )}
          {status === 'error' && (
            <div className="text-red-500 text-5xl mb-4">✕</div>
          )}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {status === 'loading' && 'Verifying Payment...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'error' && 'Payment Failed'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
          {status === 'error' && (
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 