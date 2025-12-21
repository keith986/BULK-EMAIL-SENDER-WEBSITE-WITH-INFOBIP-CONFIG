"use client";
import { useState, useEffect } from 'react';
import { X, Smartphone, Check, AlertCircle, XCircle, Clock } from 'lucide-react';
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
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'verifying' | 'result'>('details');
  const [checkoutRequestId, setCheckoutRequestId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [statusMessage, setStatusMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds

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

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (paymentStep === 'verifying' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [paymentStep, timeRemaining]);

  // Payment status polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let pollCount = 0;
    const MAX_POLLS = 24; // 24 polls * 5 seconds = 2 minutes
    
    if (paymentStep === 'verifying' && checkoutRequestId && paymentId) {
      interval = setInterval(async () => {
        pollCount++;
        
        if (pollCount >= MAX_POLLS) {
          clearInterval(interval);
          setIsProcessing(false);
          setPaymentStatus('timeout');
          setStatusMessage('Payment not received within 2 minutes. If you completed the payment, it will be verified by admin.');
          setPaymentStep('result');
          
          const { updatePaymentStatus } = await import('../_utils/firebase-operations');
          await updatePaymentStatus({
            paymentId: paymentId,
            status: 'pending',
            paymentDetails: { 
              error: 'Payment verification timeout - awaiting admin approval',
              pollCount: pollCount
            }
          });
          return;
        }
        
        await checkPaymentStatus();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentStep, checkoutRequestId, paymentId]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    setTimeRemaining(120);

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
        setPaymentStep('verifying');
        
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

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/mpesa?checkoutRequestId=${checkoutRequestId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Payment status check failed:', response.status);
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        const { ResultCode, ResultDesc } = data.data;

        if (ResultCode === '0') {
          try {
            const { updatePaymentStatus } = await import('../_utils/firebase-operations');
            
            const callbackMetadata = data.data.CallbackMetadata?.Item || [];
            const mpesaReceiptNumber = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value || '';
            const transactionDate = callbackMetadata.find((item: any) => item.Name === 'TransactionDate')?.Value || '';
            const phoneNumber = callbackMetadata.find((item: any) => item.Name === 'PhoneNumber')?.Value || '';

            // Update payment status to completed but don't allocate coins yet
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
            setIsProcessing(false);

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
            setIsProcessing(false);
          }
        } 
        else if (ResultCode === '1032') {
          // Still pending or cancelled - continue polling
          console.log('Payment pending or cancelled by user');
        }
        else if (ResultCode) {
          // Any other code is a failure
          setPaymentStatus('failed');
          setStatusMessage(ResultDesc || 'Payment was not completed');
          setPaymentStep('result');
          setIsProcessing(false);
          
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
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
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
    setTimeRemaining(120);
  };

  const handleClose = () => {
    if (!isProcessing) {
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
            {!isProcessing && (
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
                disabled={!mpesaPhone || mpesaPhone.length < 9}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Smartphone className="w-5 h-5" />
                Send Payment Prompt
              </button>
            </div>
          )}

          {(paymentStep === 'processing' || paymentStep === 'verifying') && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">
                {paymentStep === 'verifying' ? 'Waiting for Payment...' : 'Sending Request...'}
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                {paymentStep === 'verifying'
                  ? 'Complete the payment on your phone'
                  : 'Check your phone for M-Pesa prompt'}
              </p>
              {paymentStep === 'verifying' && (
                <>
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 mb-2">
                    <Clock className="w-5 h-5" />
                    <span>{formatTime(timeRemaining)}</span>
                  </div>
                  <p className="text-xs text-gray-500">Time remaining to complete payment</p>
                </>
              )}
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
          <div className="px-6 pb-6">
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