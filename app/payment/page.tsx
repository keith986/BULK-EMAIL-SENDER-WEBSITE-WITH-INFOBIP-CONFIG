"use client";
import Protected from '../_components/Protected';
import { useEffect, useState } from 'react';
import { useUser } from '../_context/UserProvider';
import { toast, ToastContainer } from 'react-toastify';
import { Plus } from 'lucide-react';
import { createPurchaseRequest, fetchUserPurchaseRequests } from '../_utils/firebase-operations';

interface CoinPackage {
  coins: number | string;
  price: string;
  popular: boolean;
  bonus?: number;
  isCustom?: boolean;
  features?: string[];
}

interface CoinTransaction {
  id: string;
  amount: number;
  type: 'purchase' | 'usage' | 'refund';
  description: string;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
}

interface PurchaseRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  packageInfo: string;
  amount: number;
  price: number;
  createdAt: string | number | Date;  // Can be various date formats
  updatedAt?: string | number | Date;
  rejectionReason?: string;
  userId: string;
  userEmail: string;
  userName: string;
  packageId: string;
  // Add any other properties that might be in your Firebase data
}

export default function DashboardClient() {
  const [coins, setCoins] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const { user } = useUser();
  const [pendingRequests, setPendingRequests] = useState<PurchaseRequest[]>([]);

  // Coin packages with CORRECT Kenyan Shilling prices
  const coinPackages: CoinPackage[] = [
    { 
      coins: 2000, 
      price: "Kes. 400", 
      popular: false,
      features: [
        "Limited to 2,000 contacts",
        "Standard support",
        "Valid for 30 days"
      ]
    },
    { 
      coins: 6000, 
      price: "Kes. 1,000", 
      popular: true, 
      bonus: 50,
      features: [
        "Limited to 2,000 contacts",
        "Priority support",
        "Valid for 30 days",
        "+50 Bonus coins"
      ]
    },
    { 
      coins: 10000, 
      price: "Kes. 1,700", 
      popular: false, 
      bonus: 150,
      features: [
        "Limited to 2,000 contacts",
        "24/7 Premium support",
        "Valid for 30 days",
        "+150 Bonus coins"
      ]
    },
    { 
      coins: "Custom", 
      popular: false, 
      price: "Contact Support",
      isCustom: true,
      features: [
        "Unlimited contacts",
        "Dedicated support",
        "Custom validity period",
        "Negotiable pricing"
      ]
    },
  ];

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    fetchUserCoins(uid);
    fetchCoinTransactions(uid);
    fetchPendingRequests(uid);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await fetchCoinTransactionsFromFirebase({ userId }) as any;
      if (result && result.code === 777) {
        setTransactions(result.data?.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err instanceof Error ? err.message : String(err));
    }
  };

 /* 
  const handlePurchaseCoins = async (packageIndex: number) => {
    const uid = user?.uid;
    if (!uid) return toast.error('You must be signed in');

    const pkg = coinPackages[packageIndex];
    
    if (pkg.isCustom) {
      toast.info('Please contact support at support@example.com for custom packages');
      setShowPaymentModal(false);
      return;
    }

    const totalCoins = (typeof pkg.coins === 'number' ? pkg.coins : 0) + (pkg.bonus || 0);

    try {
      const { purchaseCoins } = await import('../_utils/firebase-operations');
      const result = await purchaseCoins({
        userId: uid,
        amount: totalCoins,
        price: parseFloat(pkg.price.replace(/[^\d.-]/g, '')) || 0,
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
*/

const handlePurchaseCoins = async (packageIndex: number) => {
  const uid = user?.uid;
  const email = user?.email;
  const displayName = user?.displayName;
  
  if (!uid) return toast.error('You must be signed in');

  const pkg = coinPackages[packageIndex];
  
  if (pkg.isCustom) {
    toast.info('Please contact support at support@example.com for custom packages');
    setShowPaymentModal(false);
    return;
  }

  const totalCoins = (typeof pkg.coins === 'number' ? pkg.coins : 0) + (pkg.bonus || 0);
  const packageId = `${pkg.coins}c`; // e.g., "2000c", "6000c", "10000c"

  try {
    
    const result = await createPurchaseRequest({
      userId: uid,
      userEmail: email || 'Unknown',
      userName: displayName || 'Unknown User',
      amount: totalCoins,
      price: parseFloat(pkg.price.replace(/[^\d.-]/g, '')) || 0,
      packageInfo: `${pkg.coins} coins${pkg.bonus ? ` + ${pkg.bonus} bonus` : ''}`,
      packageId: packageId
    });

    if (result.code === 777) {
      toast.success('Purchase request submitted! Please wait for admin approval.');
      setShowPaymentModal(false);
      // Optionally refresh transactions to show pending request
      fetchCoinTransactions(uid);
    } else {
      toast.error('Request failed: ' + result.message);
    }
  } catch (err) {
    toast.error('Error submitting request: ' + (err instanceof Error ? err.message : String(err)));
  }
};

const fetchPendingRequests = async (userId: string) => {
  try {
    const result = await fetchUserPurchaseRequests({ userId });
    if (result.code === 777 && result.data) {
      setPendingRequests((result.data.requests || []) as PurchaseRequest[]);
    }
  } catch (err) {
    console.error('Error fetching pending requests:', err);
  }
};

  return (
    <Protected>
      <div className="sm:mt-2 bg-gradient-to-br from-red-200 to-slate-600 min-h-screen p-4">
        <div className="p-4 sm:ml-64 mt-20">
          {/* Hero Section with Coin Balance */}
          <div className="bg-gradient-to-r from-green-600 via-red-100 to-green-700 rounded-2xl shadow-2xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <svg className="w-9 h-9 text-gray-600 dark:text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path fill-rule="evenodd" d="M12 14a3 3 0 0 1 3-3h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4a3 3 0 0 1-3-3Zm3-1a1 1 0 1 0 0 2h4v-2h-4Z" clip-rule="evenodd"/>
                      <path fill-rule="evenodd" d="M12.293 3.293a1 1 0 0 1 1.414 0L16.414 6h-2.828l-1.293-1.293a1 1 0 0 1 0-1.414ZM12.414 6 9.707 3.293a1 1 0 0 0-1.414 0L5.586 6h6.828ZM4.586 7l-.056.055A2 2 0 0 0 3 9v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2h-4a5 5 0 0 1 0-10h4a2 2 0 0 0-1.53-1.945L17.414 7H4.586Z" clip-rule="evenodd"/>
                    </svg>
                    Payment Dashboard
                  </h1>
                  <p className="text-gray-600 text-lg">Manage your credits and purchases</p>
                </div>
                
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 border-2 border-white border-opacity-30">
                  <p className="text-gray-900 text-sm mb-1">Your Balance</p>
                  <p className="text-5xl font-bold text-gray-900">{coins.toLocaleString()}</p>
                  <p className="text-gray-900 text-sm mt-1">Available Coins</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3 flex-wrap">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-6 py-3 bg-white text-amber-600 cursor-pointer rounded-lg hover:bg-amber-50 font-bold shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Buy Coins
                </button>
                <button
                  onClick={() => setShowTransactionsModal(true)}
                  className="px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-gray-900 cursor-pointer rounded-lg hover:bg-opacity-30 font-semibold border-2 border-white border-opacity-30 transform hover:scale-105 transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View Transactions
                </button>
              </div>
            </div>
          </div>
           
          {/* How Coins Work */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              How Coins Work
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="bg-blue-500 rounded-full p-3 flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg mb-1">1 Email = 1 Coin</p>
                  <p className="text-sm text-gray-600">Each email sent costs 1 coin from your balance</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="bg-green-500 rounded-full p-3 flex-shrink-0">
                  <Plus className='text-white'/>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg mb-1">Bulk Discounts</p>
                  <p className="text-sm text-gray-600">Get bonus coins on larger packages</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="bg-purple-500 rounded-full p-3 flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg mb-1">No Expiry</p>
                  <p className="text-sm text-gray-600">Your coins never expire, use them anytime</p>
                </div>
              </div>
            </div>
          </div>

          {pendingRequests.length > 0 && (
  <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mt-8">
    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
      <span className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-full p-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
      Your Purchase Requests
    </h3>
    
    <div className="space-y-4">
      {pendingRequests.map((request) => (
        <div 
          key={request.id} 
          className={`p-6 rounded-xl border-2 ${
            request.status === 'pending' ? 'border-yellow-300 bg-yellow-50' :
            request.status === 'approved' ? 'border-green-300 bg-green-50' :
            'border-red-300 bg-red-50'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-lg font-bold text-gray-800">{request.packageInfo}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  request.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                  request.status === 'approved' ? 'bg-green-200 text-green-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs text-gray-600">Coins</p>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                    </svg>
                    {request.amount.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600">Price</p>
                  <p className="text-sm font-semibold text-gray-800">
                    Kes. {request.price.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600">Submitted</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {request.status === 'pending' && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Awaiting Admin Approval</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Your purchase request is being reviewed. You will receive your coins once approved by an administrator.
                    </p>
                  </div>
                </div>
              )}
              
              {request.status === 'approved' && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-green-100 rounded-lg border border-green-300">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-green-800">Request Approved!</p>
                    <p className="text-xs text-green-600 mt-1">
                      Your coins have been added to your balance.
                    </p>
                  </div>
                </div>
              )}
              
              {request.status === 'rejected' && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-red-100 rounded-lg border border-red-300">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-800">Request Rejected</p>
                    {request.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">
                        Reason: {request.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
          )}

        </div>

        {/* Purchase Coins Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">
                    Choose Your Coin Package
                  </h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {coinPackages.map((pkg, index) => (
                    <div
                      key={index}
                      className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                        selectedPackage === index
                          ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-2xl scale-105'
                          : 'border-gray-200 hover:border-amber-300 hover:shadow-xl'
                      }`}
                      onClick={() => setSelectedPackage(index)}
                    >
                      
                      <div className="text-center">
                        <div className="mb-6 flex justify-center">
                          {pkg.isCustom ? (
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        <p className="text-5xl font-bold text-gray-800 mb-2 font-sans">
                          {typeof pkg.coins === 'number' ? pkg.coins.toLocaleString() : pkg.coins}
                        </p>
                        <p className="text-sm text-gray-600 mb-4 font-medium uppercase tracking-wide font-sans">
                          {pkg.isCustom ? 'Package' : 'coins'}
                        </p>
                        
                        {pkg.bonus && (
                          <div className="mb-4">
                            <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 font-sans py-1.5 rounded-full text-xs font-bold shadow-md">
                              +{pkg.bonus} BONUS
                            </span>
                          </div>
                        )}
                        
                        <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-6 font-sans">
                          {pkg.price}
                        </p>

                        <div className="text-left mb-6 space-y-3 min-h-[140px]">
                          {pkg.features?.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                              </svg>
                              <span className="text-sm text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchaseCoins(index);
                          }}
                          className={`w-full py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg ${
                            selectedPackage === index
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
                              : pkg.isCustom
                              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pkg.isCustom ? 'Contact Support' : 'Select Package'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        )}

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