"use client";
import Protected from '../_components/Protected';
import { useEffect, useState } from 'react';
import { fetchRecipientsFromFirebase } from '../_utils/firebase-operations';
import { useUser } from '../_context/UserProvider';
import { toast, ToastContainer } from 'react-toastify';

interface Recipient {
  name: string;
  email: string;
}

interface CoinTransaction {
  id: string;
  amount: number;
  type: 'purchase' | 'usage' | 'refund';
  description: string;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
}

export default function DashboardClient() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [coins, setCoins] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const { user } = useUser();

  // Coin packages
  const coinPackages = [
    { coins: 2000, price: "Kes. 400", popular: false },
    { coins: 6000, price: "Kes. 1000", popular: true, bonus: 20 },
    { coins: 10000, price: "Kes. 1700", popular: false, bonus: 50 },
    { coins: "Custom", popular: false, price: "contact support", bonus: 150},
  ];

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    // Fetch recipients
    fetchRecipientsFromFirebase({ userId: uid })
      .then(data => {
        if (data && data.data && data.data.rawText) {
          setRecipients(data.data.recipients || []);
        } else {
          setRecipients([]); 
        }
      })
      .catch(err => console.error('Error fetching recipients:', err.message));

    // Fetch coins and transactions from Firebase
    fetchUserCoins(uid);
    fetchCoinTransactions(uid);
  }, [user?.uid]);

  const fetchUserCoins = async (userId: string) => {
    try {
      const { fetchUserCoinsFromFirebase } = await import('../_utils/firebase-operations');
      const result = await fetchUserCoinsFromFirebase({ userId });
      if (result.code === 777) {
        setCoins(result.data?.coins || 0);
      }
    } catch (err) {
      console.error('Error fetching coins:', err);
    }
  };

  const fetchCoinTransactions = async (userId: string) => {
    try {
      const { fetchCoinTransactionsFromFirebase } = await import('../_utils/firebase-operations');
      const result = await fetchCoinTransactionsFromFirebase({ userId });
      if (result.code === 777) {
        setTransactions(result.data?.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const handlePurchaseCoins = async (packageIndex: number) => {
    const uid = user?.uid;
    if (!uid) return toast.error('You must be signed in');

    const pkg = coinPackages[packageIndex];
    const totalCoins = pkg.coins + (pkg.bonus || 0);

    try {
      // In production, integrate with payment gateway (Stripe, PayPal, etc.)
      // For now, we'll simulate the purchase
      const { purchaseCoins } = await import('../_utils/firebase-operations');
      const result = await purchaseCoins({
        userId: uid,
        amount: totalCoins,
        price: pkg.price,
        packageInfo: `${pkg.coins} coins${pkg.bonus ? ` + ${pkg.bonus} bonus` : ''}`
      });

      if (result.code === 777) {
        setCoins(result.data?.newBalance || 0);
        toast.success(`Kindly wait for customer support to approve your ${totalCoins} coins!`);
        setShowPaymentModal(false);
        fetchCoinTransactions(uid);
      } else {
        toast.error('Purchase failed: ' + result.message);
      }
    } catch (err) {
      toast.error('Error purchasing coins: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <Protected>
      <div className="sm:mt-2 bg-gradient-to-br from-red-200 to-slate-500 min-h-screen p-4">
        <div className="p-4 sm:ml-64 mt-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Payment</h2>
              <p className="mt-1 text-sm text-gray-600">Welcome to your payment page. Manage your credits.</p>
            </div>
            
            {/* Coins Display */}
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg shadow-md px-4 py-3 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Available Coins</p>
                    <p className="text-2xl font-bold text-gray-800">{coins}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Buy Coins
              </button>
              <button
                onClick={() => setShowTransactionsModal(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Transactions
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col items-center justify-center h-24 rounded-lg bg-white shadow-md">
              <p className="text-sm sm:text-lg text-gray-600 font-medium">Total Campaigns</p>
              <p className="text-3xl font-bold text-gray-800">0</p>
            </div>
            <div className="flex flex-col items-center justify-center h-24 rounded-lg bg-white shadow-md">
              <p className="text-sm sm:text-lg text-gray-600 font-medium">Success Rate</p>
              <p className="text-3xl font-bold text-gray-800">0%</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4 mt-8">
            <div className="flex flex-col items-center justify-center h-24 rounded-lg bg-white shadow-md">
              <p className="text-sm sm:text-lg text-gray-600 font-medium">Recipients</p>
              <p className="text-3xl font-bold text-gray-800">{recipients.length > 0 ? recipients.length : 0}</p>
            </div>
            <div className="flex flex-col items-center justify-center h-24 rounded-lg bg-white shadow-md">
              <p className="text-sm sm:text-lg text-gray-600 font-medium">Sent</p>
              <p className="text-3xl font-bold text-green-600">0</p>
            </div>
            <div className="flex flex-col items-center justify-center h-24 rounded-lg bg-white shadow-md">
              <p className="text-sm sm:text-lg text-gray-600 font-medium">Failed</p>
              <p className="text-3xl font-bold text-red-600">0</p>
            </div>
          </div>

          {/* Coin Usage Info */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">How Coins Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">1 Email = 1 Coin</p>
                  <p className="text-sm text-gray-600">Each email sent costs 1 coin</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Bulk Discounts</p>
                  <p className="text-sm text-gray-600">Get bonus coins on larger packages</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 rounded-full p-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">No Expiry</p>
                  <p className="text-sm text-gray-600">Your coins never expire</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Coins Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Purchase Coins</h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {coinPackages.map((pkg, index) => (
                    <div
                      key={index}
                      className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                        selectedPackage === index
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      } ${pkg.popular ? 'ring-2 ring-blue-400' : ''}`}
                      onClick={() => setSelectedPackage(index)}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            MOST POPULAR
                          </span>
                        </div>
                      )}
                      
                      <div className="text-center">
                        <p className="text-4xl font-bold text-gray-800 mb-1">{pkg.coins}</p>
                        <p className="text-sm text-gray-600 mb-3">coins</p>
                        {pkg.bonus && (
                          <div className="mb-3">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                              +{pkg.bonus} BONUS
                            </span>
                          </div>
                        )}
                        <p className="text-2xl font-bold text-blue-600 mb-4">{pkg.price}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchaseCoins(index);
                          }}
                          className={`w-full py-2 rounded-lg font-medium transition-colors ${
                            selectedPackage === index
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                
              </div>
            </div>
          </div>
        )}

        {/* Transactions Modal */}
        {showTransactionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Transaction History</h3>
                  <button
                    onClick={() => setShowTransactionsModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'purchase' ? 'bg-green-100' :
                            transaction.type === 'usage' ? 'bg-blue-100' : 'bg-orange-100'
                          }`}>
                            {transaction.type === 'purchase' ? (
                              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            ) : transaction.type === 'usage' ? (
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            transaction.type === 'purchase' || transaction.type === 'refund' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'purchase' || transaction.type === 'refund' ? '+' : '-'}{transaction.amount}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick draggable pauseOnHover theme="light" />
      </div>
    </Protected>
  );
}