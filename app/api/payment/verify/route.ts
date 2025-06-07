import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const KHALTI_CONFIG = {
  test: {
    publicKey: process.env.KHALTI_TEST_PUBLIC_KEY || 'test_public_key_14ee1cbacc264a918ec5811f6e6f7849',
    secretKey: process.env.KHALTI_TEST_SECRET_KEY || 'test_secret_key_987afd74dddb4ef083c60e9701f2e146',
    baseUrl: 'https://a.khalti.com/api/v2'
  },
  live: {
    publicKey: process.env.KHALTI_LIVE_PUBLIC_KEY || 'live_public_key_6e625b0e30734036b528b0c9e4f34e34',
    secretKey: process.env.KHALTI_LIVE_SECRET_KEY || 'live_secret_key_cfec9622263544e08cfe4b14c9685a4a',
    baseUrl: 'https://khalti.com/api/v2'
  }
};

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, amount, maidId, plan, maids, days, userId, isTestMode } = body;

    // Validate required fields
    if (!token || !amount || !maidId || !plan || !maids || !days || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const config = isTestMode ? KHALTI_CONFIG.test : KHALTI_CONFIG.live;

    // First, verify the payment
    const verifyResponse = await fetch(`${config.baseUrl}/epayment/verify/`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${config.secretKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        amount: amount * 100 // Convert to paisa
      })
    });

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      return NextResponse.json(
        { error: verifyData?.detail || 'Payment verification failed' },
        { status: verifyResponse.status }
      );
    }

    // If verification is successful, get the payment details
    const lookupResponse = await fetch(`${config.baseUrl}/epayment/lookup/`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${config.secretKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        token: token
      })
    });

    const lookupData = await lookupResponse.json();

    if (!lookupResponse.ok) {
      return NextResponse.json(
        { error: lookupData?.detail || 'Payment lookup failed' },
        { status: lookupResponse.status }
      );
    }

    // Verify payment status
    if (lookupData.status !== 'Completed') {
      return NextResponse.json(
        { error: 'Payment is not completed' },
        { status: 400 }
      );
    }

    // Store payment information in the database
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          user_id: userId,
          maid_id: maidId,
          khalti_payment_id: lookupData.idx,
          amount: amount,
          plan_type: plan,
          num_maids: parseInt(maids),
          days_valid: parseInt(days),
          status: 'completed',
          expires_at: new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000).toISOString()
        }
      ])
      .select()
      .single();

    if (paymentError) {
      return NextResponse.json(
        { error: 'Failed to store payment information' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'Completed',
      payment_details: lookupData,
      payment_record: paymentData
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 