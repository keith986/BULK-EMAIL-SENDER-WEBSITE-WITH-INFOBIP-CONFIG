import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../_lib/firebase';
import { doc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';

// Disable timeout for this endpoint
export const maxDuration = 120; // 120 seconds to handle processing safely
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

      // Persist transaction details to payment doc (don't mark completed yet)
      await updateDoc(doc(db, 'payments', paymentDoc.id), {
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

      console.log('✅ Payment callback details saved; checking auto-approve setting');

      // Check system setting to determine if auto-approve is enabled
      try {
        const { fetchSystemSettings } = await import('../../../_utils/firebase-operations');
        const settingsResult = await fetchSystemSettings();
        const autoApprove = settingsResult.data?.autoApprovePayments === true; // only auto-approve if explicitly true

        console.log('🔧 System Settings Check:', {
          settingsData: settingsResult.data,
          autoApprovePayments: settingsResult.data?.autoApprovePayments,
          autoApprovePaymentsType: typeof settingsResult.data?.autoApprovePayments,
          willAutoApprove: autoApprove
        });

        if (autoApprove) {
          // Auto-approve and credit coins using existing helper (idempotent check inside)
          try {
            const { approvePayment } = await import('../../../_utils/firebase-operations');

            const approveResult = await approvePayment({
              paymentId: paymentDoc.id,
              userId: paymentData.userId,
              coins: paymentData.coins || 0,
              packageId: paymentData.packageId || '',
              packageInfo: paymentData.packageInfo || ''
            });

            if (approveResult?.code === 777) {
              console.log('✅ Auto-approve succeeded:', approveResult.message);
            } else {
              console.warn('⚠️ Auto-approve failed or deferred:', approveResult?.message || approveResult);
            }
          } catch (err) {
            console.error('❌ Error while auto-approving payment:', err);
          }
        } else {
          // Auto-approve disabled: mark as pending for manual admin approval
          await updateDoc(doc(db, 'payments', paymentDoc.id), {
            paymentStatus: 'pending',
            updatedAt: new Date().toISOString(),
          });
          console.log('⏳ Auto-approve disabled: payment marked as pending for manual approval');
        }
      } catch (err) {
        console.error('❌ Error checking auto-approve setting:', err);
        // Default to auto-approve on error
        try {
          const { approvePayment } = await import('../../../_utils/firebase-operations');
          await approvePayment({
            paymentId: paymentDoc.id,
            userId: paymentData.userId,
            coins: paymentData.coins || 0,
            packageId: paymentData.packageId || '',
            packageInfo: paymentData.packageInfo || ''
          });
        } catch (e) {
          console.error('Error in default auto-approve:', e);
        }
      }
      
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