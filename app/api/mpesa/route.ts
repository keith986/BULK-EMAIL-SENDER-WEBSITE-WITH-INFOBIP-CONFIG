// app/api/mpesa/stkpush/route.ts
import { NextRequest, NextResponse } from 'next/server';

// M-Pesa Configuration
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const MPESA_ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox';

// M-Pesa API URLs
const SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
const PRODUCTION_URL = 'https://api.safaricom.co.ke';
const BASE_URL = MPESA_ENVIRONMENT === 'production' ? PRODUCTION_URL : SANDBOX_URL;

// Disable default Next.js timeout for API routes
export const maxDuration = 60; // 60 seconds max
export const dynamic = 'force-dynamic';

// Generate OAuth token with improved error handling
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  
  let retries = 3;
  let lastError: any;

  while (retries > 0) {
    try {
      console.log(`Attempting to get access token (attempt ${4 - retries}/3)...`);
      
      const response = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error('No access token in response');
      }

      console.log('✅ Access token obtained successfully');
      return data.access_token;
      
    } catch (error) {
      lastError = error;
      retries--;
      console.error(`Token fetch failed (attempt ${4 - retries}/3):`, error);
      
      if (retries > 0) {
        const delay = 1000 * (4 - retries); // Progressive delay: 1s, 2s, 3s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to get access token after 3 attempts: ${lastError?.message || 'Unknown error'}`);
}

// Generate timestamp
function getTimestamp(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Generate password
function generatePassword(timestamp: string): string {
  const data = `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(data).toString('base64');
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('=== M-Pesa STK Push Request Started ===');
    
    // Validate M-Pesa configuration
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_PASSKEY) {
      console.error('❌ M-Pesa credentials not configured');
      return NextResponse.json(
        { 
          success: false, 
          message: 'M-Pesa payment is not configured. Please contact support.',
          errorCode: 'CONFIG_ERROR'
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      phone, 
      amount, 
      accountReference, 
      transactionDesc, 
      userId, 
      userEmail, 
      userName, 
      coins, 
      packageId, 
      packageInfo 
    } = body;

    console.log('Request details:', {
      phone: phone?.substring(0, 6) + '****',
      amount,
      user: userEmail,
      package: packageInfo,
    });

    // Validate required fields
    if (!phone || !amount || !accountReference) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate and format amount (M-Pesa requires integer, minimum 1 KES)
    const finalAmount = Math.max(1, Math.floor(Number(amount)));
    
    if (isNaN(finalAmount) || finalAmount < 1) {
      console.error('❌ Invalid amount:', amount);
      return NextResponse.json(
        { success: false, message: 'Invalid amount: must be at least 1 KES' },
        { status: 400 }
      );
    }

    // Format phone number to 254XXXXXXXXX format
    let formattedPhone = phone.trim().replace(/\s+/g, '');
    
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `254${formattedPhone.slice(1)}`;
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('254')) {
      // Already correct
    } else {
      formattedPhone = `254${formattedPhone}`;
    }

    // Validate phone number format (Kenyan numbers)
    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      console.error('❌ Invalid phone number format:', formattedPhone);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid phone number. Use format: 0712345678 or 254712345678',
          errorCode: 'INVALID_PHONE'
        },
        { status: 400 }
      );
    }

    console.log('Formatted phone:', formattedPhone);
    console.log('Final amount:', finalAmount, 'KES');

    // Step 1: Get access token
    console.log('Step 1: Getting access token...');
    let accessToken: string;
    
    try {
      accessToken = await getAccessToken();
    } catch (error: any) {
      console.error('❌ Failed to get access token:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to connect to M-Pesa. Please try again.',
          errorCode: 'TOKEN_ERROR',
          details: error?.message,
        },
        { status: 503 }
      );
    }

    // Step 2: Prepare STK Push request
    console.log('Step 2: Preparing STK Push...');
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    // Use ngrok or your production URL for callback
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;
    console.log('Callback URL:', callbackUrl);

    // STK Push payload
    const stkPushPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: finalAmount,
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference.substring(0, 12), // Max 12 chars
      TransactionDesc: (transactionDesc || 'Payment for coins').substring(0, 13), // Max 13 chars
    };

    console.log('STK Push payload prepared:', {
      ...stkPushPayload,
      Password: '***hidden***',
      CallBackURL: callbackUrl,
    });

    // Step 3: Send STK Push request
    console.log('Step 3: Sending STK Push to M-Pesa...');
    
    let mpesaResponse: Response;
    
    try {
      mpesaResponse = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stkPushPayload),
        cache: 'no-store',
      });

      console.log('M-Pesa API response status:', mpesaResponse.status);

    } catch (error: any) {
      console.error('❌ STK Push request failed:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to send payment request. Please check your internet connection.',
          errorCode: 'NETWORK_ERROR',
          details: error?.message,
        },
        { status: 503 }
      );
    }

    // Parse M-Pesa response
    let mpesaData: any;
    
    try {
      mpesaData = await mpesaResponse.json();
      console.log('M-Pesa Response:', JSON.stringify(mpesaData, null, 2));
    } catch (error) {
      console.error('❌ Failed to parse M-Pesa response');
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid response from M-Pesa. Please try again.',
          errorCode: 'PARSE_ERROR',
        },
        { status: 500 }
      );
    }

    // Step 4: Handle M-Pesa response
    if (mpesaData.ResponseCode === '0') {
      console.log('✅ STK Push sent successfully!');
      console.log('CheckoutRequestID:', mpesaData.CheckoutRequestID);
      console.log('MerchantRequestID:', mpesaData.MerchantRequestID);
      
      // Step 5: Create payment record in Firebase (non-blocking)
      console.log('Step 4: Creating payment record in Firebase...');
      
      // Don't wait for Firebase - return success immediately
      createPaymentRecordAsync({
        userId: userId || 'unknown',
        userEmail: userEmail || 'unknown',
        userName: userName || 'Unknown User',
        amount: finalAmount,
        coins: coins || 0,
        packageId: packageId || 'unknown',
        packageInfo: packageInfo || 'Unknown Package',
        formattedPhone,
        checkoutRequestId: mpesaData.CheckoutRequestID,
        merchantRequestId: mpesaData.MerchantRequestID,
        responseDescription: mpesaData.ResponseDescription,
      }).catch(error => {
        console.error('Warning: Payment record creation failed (non-critical):', error);
      });

      const elapsed = Date.now() - startTime;
      console.log(`✅ Request completed in ${elapsed}ms`);
      console.log('=== STK Push Request Successful ===\n');

      return NextResponse.json({
        success: true,
        message: 'Payment request sent successfully. Check your phone to complete payment.',
        checkoutRequestId: mpesaData.CheckoutRequestID,
        merchantRequestId: mpesaData.MerchantRequestID,
        responseDescription: mpesaData.ResponseDescription,
        customerMessage: mpesaData.CustomerMessage,
      });
      
    } else {
      // STK Push failed
      const errorMessage = mpesaData.ResponseDescription || mpesaData.errorMessage || 'Failed to initiate payment';
      console.log('❌ STK Push failed:', errorMessage);
      console.log('Error Code:', mpesaData.ResponseCode || mpesaData.errorCode);
      
      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          errorCode: mpesaData.ResponseCode || mpesaData.errorCode || 'STK_FAILED',
          details: mpesaData,
        },
        { status: 400 }
      );
    }
    
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ STK Push error after ${elapsed}ms:`, error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error. Please try again.',
        errorCode: 'SERVER_ERROR',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Async function to create payment record (non-blocking)
async function createPaymentRecordAsync(data: {
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  coins: number;
  packageId: string;
  packageInfo: string;
  formattedPhone: string;
  checkoutRequestId: string;
  merchantRequestId: string;
  responseDescription: string;
}) {
  try {
    const { createPaymentRecord, updatePaymentStatus } = await import('@/app/_utils/firebase-operations');
    
    // Create payment record
    const paymentResult = await createPaymentRecord({
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      amount: data.amount,
      coins: data.coins,
      packageId: data.packageId,
      packageInfo: data.packageInfo,
      paymentMethod: 'mpesa',
      mpesaPhone: data.formattedPhone,
    });

    if (paymentResult.code === 777 && paymentResult.paymentId) {
      console.log('✅ Payment record created:', paymentResult.paymentId);
      
      // Link to M-Pesa checkout request
      await updatePaymentStatus({
        paymentId: paymentResult.paymentId,
        status: 'pending',
        mpesaCheckoutRequestId: data.checkoutRequestId,
        paymentDetails: {
          merchantRequestId: data.merchantRequestId,
          checkoutRequestId: data.checkoutRequestId,
          responseDescription: data.responseDescription,
          initiatedAt: new Date().toISOString(),
        }
      });
      
      console.log('✅ Payment linked to CheckoutRequestID');
    } else {
      console.error('❌ Failed to create payment record:', paymentResult.message);
    }
  } catch (error) {
    console.error('❌ Error in createPaymentRecordAsync:', error);
    throw error;
  }
}

// Query STK Push status (for checking payment status)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const checkoutRequestId = searchParams.get('checkoutRequestId');

    if (!checkoutRequestId) {
      return NextResponse.json(
        { success: false, message: 'Missing checkoutRequestId parameter' },
        { status: 400 }
      );
    }

    console.log('Querying payment status for:', checkoutRequestId);

    // Get access token
    let accessToken: string;
    try {
      accessToken = await getAccessToken();
    } catch (error) {
      console.error('Failed to get access token for status check:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to check payment status',
          errorCode: 'TOKEN_ERROR'
        },
        { status: 503 }
      );
    }
    
    // Generate timestamp and password
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    // Query payload
    const queryPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    // Query M-Pesa
    const response = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryPayload),
      cache: 'no-store',
    });

    const data = await response.json();
    console.log('Payment status response:', data);

    return NextResponse.json({
      success: response.ok,
      data: data,
    });

  } catch (error: any) {
    console.error('Status query error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error checking payment status',
        errorCode: 'QUERY_ERROR',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}