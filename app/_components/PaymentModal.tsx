"use client";
import { useState } from 'react';
import { X, Smartphone, Check, AlertCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: {
    coins: number | string;
    price: string;
    packageId: string;
    packageInfo: string;
    bonus?: number;
  };
  userEmail: string;
  userId: string;
  userName: string;
  onPaymentSuccess: () => void;
}

type PaymentStatus = 'pending' | 'success' | 'failed' | 'timeout';

interface MpesaCallbackItem {
  Name: string;
  Value: string | number;
}

export default function PaymentModal({
  isOpen,
  onClose,
  packageData,
  userEmail,
  userId,
  userName,
  onPaymentSuccess
}: PaymentModalProps) {
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'awaiting' | 'verifying' | 'result'>('details');
  const [checkoutRequestId, setCheckoutRequestId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [statusMessage, setStatusMessage] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  if (!isOpen) return null;

  const totalCoins = (typeof packageData.coins === 'number' ? packageData.coins : 0) + (packageData.bonus || 0);
  
  const parseAmount = (priceString: string): number => {
    const cleaned = priceString
      .replace(/kes\.?/gi, '')
      .replace(/ksh\.?/gi, '')
      .replace(/[^\d]/g, '');
    
    const parsed = parseInt(cleaned, 10);
    
    if (isNaN(parsed) || parsed <= 0) {
      console.error('Invalid amount parsed:', parsed, 'from price:', priceString);
      return 0;
    }
    
    return parsed;
  };

  const handleMpesaPayment = async () => {
    if (!mpesaPhone || mpesaPhone.length < 9) {
      toast.error('Please enter a valid phone number');
      return;
    }

    const finalAmount = parseAmount(packageData.price);

    if (finalAmount <= 0) {
      toast.error('Invalid payment amount. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);
    setPaymentStep('processing');
    setPaymentStatus('pending');

    try {
      const { createPaymentRecord, updatePaymentStatus } = await import('../_utils/firebase-operations');
      
      const paymentResult = await createPaymentRecord({
        userId,
        userEmail,
        userName,
        amount: finalAmount,
        coins: totalCoins,
        packageId: packageData.packageId,
        packageInfo: packageData.packageInfo,
        paymentMethod: 'mpesa',
        mpesaPhone
      });

      if (paymentResult.code !== 777) {
        toast.error('Failed to create payment record');
        setPaymentStep('details');
        setIsProcessing(false);
        return;
      }

      const createdPaymentId = paymentResult.paymentId!;
      setPaymentId(createdPaymentId);

      const response = await fetch('/api/mpesa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: mpesaPhone,
          amount: finalAmount,
          accountReference: `COINS-${createdPaymentId.slice(-8)}`,
          transactionDesc: `Purchase ${totalCoins} coins`,
          paymentId: createdPaymentId,
          userId,
          userEmail,
          userName,
          coins: totalCoins,
          packageId: packageData.packageId,
          packageInfo: packageData.packageInfo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await updatePaymentStatus({
          paymentId: createdPaymentId,
          status: 'pending',
          mpesaCheckoutRequestId: data.checkoutRequestId,
          paymentDetails: {
            merchantRequestId: data.merchantRequestId,
            checkoutRequestId: data.checkoutRequestId,
            amountSent: finalAmount,
          }
        });

        setCheckoutRequestId(data.checkoutRequestId);
        setPaymentStep('awaiting');
        setIsProcessing(false);
        
        toast.success('Check your phone for M-Pesa payment prompt!');
      } else {
        setPaymentStatus('failed');
        setStatusMessage(data.message || 'Failed to send M-Pesa prompt. Please try again.');
        setPaymentStep('result');
        
        await updatePaymentStatus({
          paymentId: createdPaymentId,
          status: 'failed',
          paymentDetails: { error: data.message }
        });
        
        setIsProcessing(false);
      }
    } catch (error) {
      setPaymentStatus('failed');
      setStatusMessage('Network error. Please check your connection and try again.');
      setPaymentStep('result');
      setIsProcessing(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!checkoutRequestId) {
      toast.error('No payment request found');
      return;
    }

    setIsCheckingStatus(true);
    setPaymentStep('verifying');

    try {
      const response = await fetch(`/api/mpesa?checkoutRequestId=${checkoutRequestId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();

      if (data.success && data.data) {
        const { ResultCode, ResultDesc } = data.data;

        if (ResultCode === '0') {
          // Payment successful
          try {
            const { updatePaymentStatus } = await import('../_utils/firebase-operations');
            
            const callbackMetadata: MpesaCallbackItem[] = data.data.CallbackMetadata?.Item || [];
            const mpesaReceiptNumber = callbackMetadata.find((item) => item.Name === 'MpesaReceiptNumber')?.Value?.toString() || '';
            const transactionDate = callbackMetadata.find((item) => item.Name === 'TransactionDate')?.Value?.toString() || '';
            const phoneNumber = callbackMetadata.find((item) => item.Name === 'PhoneNumber')?.Value?.toString() || '';

            await updatePaymentStatus({
              paymentId: paymentId,
              status: 'completed',
              transactionRef: mpesaReceiptNumber,
              paymentDetails: {
                resultCode: ResultCode,
                resultDesc: ResultDesc,
                mpesaReceiptNumber: mpesaReceiptNumber,
                transactionDate: transactionDate,
                phoneNumber: phoneNumber,
                callbackMetadata: callbackMetadata,
                awaitingAdminApproval: true
              }
            });

            setPaymentStatus('success');
            setStatusMessage(`Payment received! Receipt: ${mpesaReceiptNumber}. Awaiting admin approval to credit coins.`);
            setPaymentStep('result');
            setIsCheckingStatus(false);

            toast.success('Payment successful! Admin will approve and credit your coins shortly.');
            
            setTimeout(() => {
              onPaymentSuccess();
              onClose();
              resetForm();
            }, 4000);
          } catch (updateError) {
            console.error('Error updating payment:', updateError);
            setPaymentStatus('failed');
            setStatusMessage('Payment received but system error. Contact support immediately.');
            setPaymentStep('result');
            setIsCheckingStatus(false);
          }
        } 
        else if (ResultCode === '1032') {
          // Payment cancelled or still pending
          setPaymentStatus('pending');
          setStatusMessage('Payment not completed yet. Please complete the M-Pesa prompt on your phone and try again.');
          setPaymentStep('awaiting');
          setIsCheckingStatus(false);
          toast.info('Payment still pending. Complete on your phone and click "Complete Payment" again.');
        }
        else {
          // Payment failed
          setPaymentStatus('failed');
          setStatusMessage(ResultDesc || 'Payment was not completed');
          setPaymentStep('result');
          setIsCheckingStatus(false);
          
          const { updatePaymentStatus } = await import('../_utils/firebase-operations');
          await updatePaymentStatus({
            paymentId: paymentId,
            status: 'failed',
            paymentDetails: {
              resultCode: ResultCode,
              resultDesc: ResultDesc,
            }
          });
          
          toast.error(`Payment failed: ${ResultDesc}`);
        }
      } else {
        // No data returned - still pending
        setPaymentStatus('pending');
        setStatusMessage('Payment status unknown. Please complete the M-Pesa prompt and try again.');
        setPaymentStep('awaiting');
        setIsCheckingStatus(false);
        toast.info('Still waiting for payment. Complete on your phone and try again.');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('pending');
      setStatusMessage('Error checking payment. Please try again.');
      setPaymentStep('awaiting');
      setIsCheckingStatus(false);
      toast.error('Error checking payment status. Please try again.');
    }
  };

  const resetForm = () => {
    setMpesaPhone('');
    setPaymentStep('details');
    setIsProcessing(false);
    setCheckoutRequestId('');
    setPaymentId('');
    setPaymentStatus('pending');
    setStatusMessage('');
    setIsCheckingStatus(false);
  };

  const handleClose = () => {
    if (!isProcessing && !isCheckingStatus) {
      resetForm();
      onClose();
    }
  };

  const handleTryAgain = () => {
    setPaymentStep('details');
    setPaymentStatus('pending');
    setStatusMessage('');
    setCheckoutRequestId('');
    setPaymentId('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800">Complete Payment</h3>
            {!isProcessing && !isCheckingStatus && (
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 mb-6 border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Package</span>
              <span className="font-semibold text-gray-800">{packageData.packageInfo}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Coins</span>
              <span className="font-bold text-amber-600">{totalCoins.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-amber-300">
              <span className="text-sm font-medium text-gray-700">Amount to Pay</span>
              <span className="text-2xl font-bold text-gray-900">{packageData.price}</span>
            </div>
          </div>

          {paymentStep === 'details' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Admin Approval Required</p>
                    <p>After successful payment, an admin will verify and credit your coins within few minutes.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  M-Pesa Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">+254</span>
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="7XXXXXXXX"
                    maxLength={9}
                    className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Enter your M-Pesa registered phone number
                </p>
              </div>

              <button
                onClick={handleMpesaPayment}
                disabled={!mpesaPhone || mpesaPhone.length < 9 || isProcessing}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Smartphone className="w-5 h-5" />
                Send Payment Prompt
              </button>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">Sending Request...</h4>
              <p className="text-sm text-gray-600">Please wait while we send the payment prompt</p>
            </div>
          )}

          {paymentStep === 'awaiting' && (
            <div className="text-center py-3">
              <h4 className="text-lg font-bold text-gray-800 mb-2">Check Your Phone</h4>
              <p className="text-sm text-gray-600 mb-2">
                Complete the M-Pesa payment on your phone, then click the button below to verify.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 text-left">
                    <p className="font-semibold mb-1">Important:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Enter your M-Pesa PIN on your phone</li>
                      <li>Confirm the payment amount</li>
                      <li>Wait for M-Pesa confirmation SMS</li>
                      <li>Click on Complete Payment button below</li>
                    </ol>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCompletePayment}
                disabled={isCheckingStatus}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer opacity-70 hover:opacity-90"
              >
                {isCheckingStatus ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking Payment...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Complete Payment
                  </>
                )}
              </button>

              <button
                onClick={handleTryAgain}
                disabled={isCheckingStatus}
                className="w-full mt-3 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium cursor-pointer hover:bg-slate-300 rounded-lg px-4 py-2"
              >
                Cancel & Try Again
              </button>
            </div>
          )}

          {paymentStep === 'verifying' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">Verifying Payment...</h4>
              <p className="text-sm text-gray-600">Please wait while we check your payment status</p>
            </div>
          )}

          {paymentStep === 'result' && (
            <div className="text-center py-8">
              {paymentStatus === 'success' && (
                <>
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h4>
                  <p className="text-gray-600 mb-1">{totalCoins.toLocaleString()} coins will be credited after admin approval</p>
                  <p className="text-sm text-gray-500">{statusMessage}</p>
                </>
              )}

              {paymentStatus === 'failed' && (
                <>
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                    <XCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-red-700 mb-2">Payment Not Completed</h4>
                  <p className="text-gray-600 mb-4">{statusMessage}</p>
                  <button
                    onClick={handleTryAgain}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </>
              )}

              {paymentStatus === 'timeout' && (
                <>
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-4">
                    <Clock className="w-10 h-10 text-amber-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-amber-700 mb-2">Verification Pending</h4>
                  <p className="text-gray-600 mb-4">{statusMessage}</p>
                  <div className="space-y-2">
                    <button
                      onClick={handleTryAgain}
                      className="w-full px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                    <p className="text-xs text-gray-500">
                      If money was deducted, admin will verify and credit your coins
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {paymentStep !== 'processing' && paymentStep !== 'verifying' && paymentStep !== 'result' && (
          <div className="px-6 pb-3">
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
              <p>Your payment is secure. Coins will be credited after admin approval within few minutes.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}