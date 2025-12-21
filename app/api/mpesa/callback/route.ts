import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../_lib/firebase';
import { doc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';

// Disable timeout for this endpoint
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // IMMEDIATELY acknowledge to M-Pesa to prevent timeout
    // We'll process the payment in the background
    const body = await request.json();
    
    console.log('=== M-Pesa Callback Received ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Process callback asynchronously (don't wait)
    processCallbackAsync(body).catch(error => {
      console.error('Background callback processing error:', error);
    });

    // Return success IMMEDIATELY (within 1 second)
    const elapsed = Date.now() - startTime;
    console.log(`✅ Acknowledged callback in ${elapsed}ms`);
    
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Success',
    });

  } catch (error) {
    console.error('❌ Callback error:', error);
    
    // Still acknowledge even if there's an error
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
  }
}

// Async function to process callback (non-blocking)
async function processCallbackAsync(body: any) {
  try {
    console.log('Processing callback data...');
    console.log('Full callback:', JSON.stringify(body, null, 2));

    // Extract callback data
    const { Body } = body;
    
    if (!Body || !Body.stkCallback) {
      console.error('❌ Invalid callback structure');
      return;
    }

    const { stkCallback } = Body;
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    console.log('Callback details:', {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    });

    // Find payment document by CheckoutRequestID
    console.log('Looking up payment in database...');
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('mpesaCheckoutRequestId', '==', CheckoutRequestID)
    );
    
    const paymentsSnapshot = await getDocs(paymentsQuery);

    if (paymentsSnapshot.empty) {
      console.warn('⚠️ No payment found for CheckoutRequestID:', CheckoutRequestID);
      console.warn('This might be a test payment or the record was not created yet');
      return;
    }

    const paymentDoc = paymentsSnapshot.docs[0];
    const paymentData = paymentDoc.data();
    
    console.log('Found payment:', {
      id: paymentDoc.id,
      user: paymentData.userEmail,
      amount: paymentData.amount,
      currentStatus: paymentData.paymentStatus,
    });

    // ResultCode 0 = Success
    // ResultCode 1032 = User cancelled
    // Other codes = Failed
    
    if (ResultCode === 0) {
      console.log('✅ Payment SUCCESSFUL!');
      
      // Extract payment details from callback metadata
      const metadata = CallbackMetadata?.Item || [];
      const paymentDetails: any = {};

      metadata.forEach((item: any) => {
        paymentDetails[item.Name] = item.Value;
      });

      console.log('Payment details:', {
        mpesaReceiptNumber: paymentDetails.MpesaReceiptNumber,
        amount: paymentDetails.Amount,
        phoneNumber: paymentDetails.PhoneNumber,
        transactionDate: paymentDetails.TransactionDate,
      });

      // Update payment to PENDING (awaiting admin approval)
      await updateDoc(doc(db, 'payments', paymentDoc.id), {
        paymentStatus: 'pending',  // Admin must approve
        transactionRef: paymentDetails.MpesaReceiptNumber || '',
        paymentDetails: {
          mpesaReceiptNumber: paymentDetails.MpesaReceiptNumber,
          transactionDate: paymentDetails.TransactionDate,
          phoneNumber: paymentDetails.PhoneNumber,
          amount: paymentDetails.Amount,
          resultCode: ResultCode,
          resultDesc: ResultDesc,
        },
        mpesaCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Payment marked as PENDING - awaiting admin approval');
      console.log('Admin can now approve in the Payments tab');
      
    } else if (ResultCode === 1032) {
      console.log('⚠️ Payment CANCELLED by user');
      
      // Delete cancelled payment (don't show in admin panel)
      await updateDoc(doc(db, 'payments', paymentDoc.id), {
        paymentStatus: 'cancelled',
        paymentDetails: {
          resultCode: ResultCode,
          resultDesc: ResultDesc,
        },
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('Payment marked as cancelled (hidden from admin)');
      
    } else {
      console.log('❌ Payment FAILED');
      console.log('Reason:', ResultDesc);
      console.log('Code:', ResultCode);
      
      // Mark as failed (hidden from admin panel)
      await updateDoc(doc(db, 'payments', paymentDoc.id), {
        paymentStatus: 'failed',
        paymentDetails: {
          resultCode: ResultCode,
          resultDesc: ResultDesc,
        },
        failedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('Payment marked as failed (hidden from admin)');
    }

    console.log('=== Callback Processing Complete ===\n');

  } catch (error) {
    console.error('❌ Error in processCallbackAsync:', error);
    throw error;
  }
}

// Test endpoint - GET request
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'M-Pesa callback endpoint is running',
    timestamp: new Date().toISOString(),
    endpoint: '/api/mpesa/callback',
    note: 'This endpoint processes M-Pesa payment callbacks',
  });
}