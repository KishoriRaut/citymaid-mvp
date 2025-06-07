import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Khalti configuration
const config = {
  baseUrl: process.env.KHALTI_API_URL || 'https://a.khalti.com/api/v2',
  secretKey: process.env.KHALTI_SECRET_KEY!,
  testMode: process.env.NODE_ENV !== 'production'
};

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No Bearer token provided');
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('Invalid token format');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token format' },
        { status: 401 }
      );
    }

    console.log('Verifying token with Supabase...');

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('Token verification error:', {
        message: authError.message,
        status: authError.status,
        name: authError.name
      });

      if (authError.message?.includes('expired')) {
        return NextResponse.json(
          { error: 'Your session has expired. Please log in again.' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('No user found for token');
      return NextResponse.json(
        { error: 'Unauthorized - User not found' },
        { status: 401 }
      );
    }

    console.log('Token verified successfully for user:', user.id);

    const body = await request.json();
    const { amount, maidId, isTestMode: clientTestMode, plan } = body;

    // Validate required fields
    if (!amount || !maidId || !plan) {
      console.error('Missing required fields:', { amount, maidId, plan });
      return NextResponse.json(
        { error: 'Amount, maidId, and plan are required' },
        { status: 400 }
      );
    }

    // Validate plan
    const validPlans = ['basic', 'standard', 'premium'];
    if (!validPlans.includes(plan)) {
      console.error('Invalid plan:', plan);
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Ensure test mode matches between client and server
    if (clientTestMode !== config.testMode) {
      console.error('Test mode mismatch:', { client: clientTestMode, server: config.testMode });
      return NextResponse.json(
        { error: 'Test mode configuration mismatch' },
        { status: 400 }
      );
    }

    // Get the origin from headers
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

    // Prepare the payment request
    const paymentRequest = {
      return_url: `${origin}/payment/success`,
      website_url: origin,
      amount: amount * 100, // Convert to paisa
      purchase_order_id: `maid_${maidId}_${Date.now()}`,
      purchase_order_name: `Maid Contact Unlock - ${plan} Plan`,
      customer_info: {
        name: user.user_metadata?.full_name || 'Customer',
        email: user.email || 'customer@example.com',
        phone: user.phone || '9800000000'
      }
    };

    console.log('Making request to Khalti API with:', {
      amount: paymentRequest.amount,
      plan,
      maidId,
      userId: user.id
    });

    // Make the request to Khalti
    const response = await fetch(`${config.baseUrl}/epayment/initiate/`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${config.secretKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentRequest)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Khalti API error:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      return NextResponse.json(
        { error: responseData?.detail || 'Payment initiation failed' },
        { status: response.status }
      );
    }

    if (!responseData?.payment_url) {
      console.error('Invalid Khalti response:', responseData);
      return NextResponse.json(
        { error: 'Invalid payment response from Khalti' },
        { status: 500 }
      );
    }

    console.log('Payment initiated successfully');
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate payment' },
      { status: 500 }
    );
  }
} 