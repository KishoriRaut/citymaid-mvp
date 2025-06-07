import { supabase } from '@/lib/supabaseClient';

// Khalti API Configuration
const KHALTI_CONFIG = {
  test: {
    publicKey: 'test_public_key_14ee1cbacc264a918ec5811f6e6f7849',
    secretKey: 'test_secret_key_987afd74dddb4ef083c60e9701f2e146',
    baseUrl: 'https://a.khalti.com/api/v2'
  },
  live: {
    publicKey: 'live_public_key_6e625b0e30734036b528b0c9e4f34e34',
    secretKey: 'live_secret_key_cfec9622263544e08cfe4b14c9685a4a',
    baseUrl: 'https://khalti.com/api/v2'
  }
};

// Force test mode for now
const isTestMode = true;
const config = isTestMode ? KHALTI_CONFIG.test : KHALTI_CONFIG.live;

interface PaymentResponse {
  payment_url: string;
  error?: string;
}

// Initialize Khalti payment
export const initializeKhaltiPayment = async (amount: number, maidId: string): Promise<PaymentResponse> => {
  try {
    // Validate inputs
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }
    if (!maidId) {
      throw new Error('Maid ID is required');
    }

    // Get the current session and refresh if needed
    const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication error. Please try logging in again.');
    }

    if (!initialSession) {
      throw new Error('No active session found. Please log in again.');
    }

    let session = initialSession;

    // Check if session is about to expire (within 5 minutes)
    const expiresAt = new Date(session.expires_at! * 1000);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    
    if (timeUntilExpiry < 5 * 60 * 1000) { // 5 minutes in milliseconds
      console.log('Session about to expire, refreshing...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Session refresh error:', refreshError);
        throw new Error('Session expired. Please log in again.');
      }
      if (!refreshData.session) {
        throw new Error('Failed to refresh session. Please log in again.');
      }
      session = refreshData.session;
    }

    console.log('Making payment request with session:', {
      hasToken: !!session.access_token,
      expiresAt: new Date(session.expires_at! * 1000).toISOString()
    });

    // Use relative URL to ensure same-origin request
    const response = await fetch('/api/payment/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ 
        amount, 
        maidId,
        isTestMode,
        plan: 'basic' // Add plan information
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Payment initiation error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });

      if (response.status === 401) {
        // Try to refresh the session one more time
        console.log('Attempting final session refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          throw new Error('Session expired. Please log in again.');
        }
        
        // Retry the request with the new session
        console.log('Retrying payment request with new session');
        const retryResponse = await fetch('/api/payment/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshData.session.access_token}`
          },
          body: JSON.stringify({ 
            amount, 
            maidId,
            isTestMode,
            plan: 'basic'
          })
        });
        
        if (!retryResponse.ok) {
          const retryErrorData = await retryResponse.json();
          throw new Error(retryErrorData.error || 'Payment initialization failed');
        }
        
        const retryData = await retryResponse.json();
        if (!retryData.payment_url) {
          throw new Error('Invalid payment response: Missing payment URL');
        }
        return retryData;
      }
      throw new Error(errorData.error || 'Payment initialization failed');
    }

    const data = await response.json();
    
    if (!data.payment_url) {
      throw new Error('Invalid payment response: Missing payment URL');
    }

    return data;
  } catch (error: any) {
    console.error('Error initializing payment:', error);
    throw new Error(error.message || 'Failed to initialize payment');
  }
};

// Verify Khalti payment
export const verifyKhaltiPayment = async (
  token: string,
  amount: number,
  maidId: string,
  plan: string,
  maids: number,
  days: number,
  userId: string
) => {
  try {
    if (!token) {
      throw new Error('Payment token is required');
    }

    console.log('Verifying payment with:', { 
      token, 
      amount, 
      maidId, 
      plan, 
      maids, 
      days, 
      userId,
      isTestMode 
    });

    const response = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        amount,
        maidId,
        plan,
        maids,
        days,
        userId,
        isTestMode
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Payment verification error:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(data?.error || 'Payment verification failed');
    }

    // Check both verification and payment details
    if (!data.status || !data.payment_details || !data.payment_record) {
      console.error('Invalid verification response:', data);
      throw new Error('Invalid payment verification response');
    }

    // Verify the payment amount matches
    const paymentAmount = data.payment_details.amount / 100; // Convert from paisa to rupees
    if (paymentAmount !== amount) {
      console.error('Payment amount mismatch:', { expected: amount, received: paymentAmount });
      throw new Error('Payment amount mismatch');
    }

    console.log('Payment verification successful:', data);
    return data;
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    throw new Error(error.message || 'Failed to verify payment');
  }
}; 