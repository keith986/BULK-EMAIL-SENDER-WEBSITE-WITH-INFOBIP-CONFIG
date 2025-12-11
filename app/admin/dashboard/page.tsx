"use client";
import { useState, useEffect } from 'react';
import { Users, Mail, BarChart3, Settings, Search, Trash2, Ban, CheckCircle, Download, RefreshCw, TrendingUp, Clock, TrendingDown, Key, DollarSign, CreditCard, X, Eye, EyeOff } from 'lucide-react';
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../_lib/firebase';

interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  status: 'active' | 'suspended';
  campaignsSent: number;
  lastActive: string;
  apiKey?: string;
  hasApiKey: boolean;
  subscriptionStatus: 'free' | '2000c' | '6000c' | '10000c' | 'customc';
  subscriptionExpiry?: string;
  emailsRemaining: number;
  totalEmailsAllowed: number;
  coins?: number;
}

interface PurchaseRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  price: number;
  packageInfo: string;
  packageId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  rejectionReason?: string;
}

interface Campaign {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  recipientsCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  status: 'completed' | 'failed' | 'pending';
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalCampaigns: number;
  totalEmailsSent: number;
  successRate: number;
  newUsersThisMonth: number;
  campaignsThisMonth: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number | string;
  coins: number | string;
  emailLimit: number | string;
  features: string[];
  bonus?: number;
}

const pricingPlans: PricingPlan[] = [
  {
    id: '2000c',
    name: '2000 Coins',
    price: 400,
    coins: 2000,
    emailLimit: 2000,
    features: [
      'Limited to 2,000 contacts',
      'Standard support',
      'Valid for 30 days',
      '1 Email = 1 Coin'
    ]
  },
  {
    id: '6000c',
    name: '6000 Coins',
    price: 1000,
    coins: 6000,
    emailLimit: 6000,
    bonus: 50,
    features: [
      'Limited to 2,000 contacts',
      'Priority support',
      'Valid for 30 days',
      '+50 Bonus coins',
      '1 Email = 1 Coin'
    ]
  },
  {
    id: '10000c',
    name: '10000 Coins',
    price: 1700,
    coins: 10000,
    emailLimit: 10000,
    bonus: 150,
    features: [
      'Limited to 2,000 contacts',
      '24/7 Premium support',
      'Valid for 30 days',
      '+150 Bonus coins',
      '1 Email = 1 Coin'
    ]
  },
  {
    id: 'customc',
    name: 'Custom Package',
    price: 'Contact Support',
    coins: 'Custom',
    emailLimit: 'Custom',
    features: [
      'Unlimited contacts',
      'Dedicated support',
      'Custom validity period',
      'Negotiable pricing',
      'Bulk discounts available'
    ]
  }
];

// Toast Notification Component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2`}>
      {type === 'success' && <CheckCircle className="w-5 h-5" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'campaigns' | 'billing' | 'requests' | 'settings'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalCampaigns: 0,
    totalEmailsSent: 0,
    successRate: 0,
    newUsersThisMonth: 0,
    campaignsThisMonth: 0,
    totalRevenue: 0,
    activeSubscriptions: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [customEmailLimit, setCustomEmailLimit] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState<{ usersTrend: 'up' | 'down'; campaignsTrend: 'up' | 'down' }>({ 
    usersTrend: 'up', 
    campaignsTrend: 'up' 
  });
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

// Update loadDataFromFirebase to also load purchase requests
useEffect(() => {
  loadDataFromFirebase();
  loadPurchaseRequests();
}, []);

  const loadDataFromFirebase = async () => {
    setLoading(true);
    try {
      const clientsSnapshot = await getDocs(collection(db, 'clients'));
      const clientsData: User[] = [];

      for (const clientDoc of clientsSnapshot.docs) {
        const clientData = clientDoc.data();
        
        const apiKeyQuery = query(collection(db, 'apikeys'), where('userId', '==', clientDoc.id));
        const apiKeySnapshot = await getDocs(apiKeyQuery);
        const apiKeyData = apiKeySnapshot.docs[0]?.data();

        const coinsQuery = query(collection(db, 'coins'), where('userId', '==', clientDoc.id));
        const coinsSnapshot = await getDocs(coinsQuery);
        const coinsData = coinsSnapshot.docs[0]?.data();

        const campaignsQuery = query(collection(db, 'campaigns'), where('userId', '==', clientDoc.id));
        const campaignsSnapshot = await getDocs(campaignsQuery);

        let lastActive = clientData.createdAt?.toDate?.() || new Date();
        if (campaignsSnapshot.docs.length > 0) {
          const latestCampaign = campaignsSnapshot.docs[0].data();
          if (latestCampaign.createdAt) {
            lastActive = latestCampaign.createdAt.toDate?.() || lastActive;
          }
        }

        const user: User = {
          id: clientDoc.id,
          email: clientData.email || '',
          displayName: clientData.displayName || 'Unknown',
          createdAt: clientData.createdAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          status: clientData.status || 'active',
          campaignsSent: campaignsSnapshot.docs.length,
          lastActive: lastActive.toISOString().split('T')[0],
          apiKey: apiKeyData?.apiKey || '',
          hasApiKey: !!apiKeyData?.apiKey,
          subscriptionStatus: clientData.subscriptionStatus || 'free',
          subscriptionExpiry: clientData.subscriptionExpiry || '',
          emailsRemaining: clientData.emailsRemaining || 500,
          totalEmailsAllowed: clientData.totalEmailsAllowed || 500,
          coins: coinsData?.coins || 0
        };
        
        clientsData.push(user);
      }

      setUsers(clientsData);

      const campaignsSnapshot = await getDocs(collection(db, 'campaigns'));
      const campaignsData: Campaign[] = [];

      for (const campaignDoc of campaignsSnapshot.docs) {
        const campaignData = campaignDoc.data();
        const userEmail = clientsData.find(u => u.id === campaignData.userId)?.email || 'Unknown';

        const campaign: Campaign = {
          id: campaignDoc.id,
          userId: campaignData.userId || '',
          userEmail: userEmail,
          subject: campaignData.subject || 'No Subject',
          recipientsCount: campaignData.recipientsCount || campaignData.stats?.total || 0,
          sentCount: campaignData.stats?.sent || 0,
          failedCount: campaignData.stats?.failed || 0,
          createdAt: campaignData.createdAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          status: campaignData.status || 'completed'
        };

        campaignsData.push(campaign);
      }

      setCampaigns(campaignsData);

      const totalEmailsSent = campaignsData.reduce((sum, c) => sum + c.sentCount, 0);
      const totalEmailsAttempted = campaignsData.reduce((sum, c) => sum + c.recipientsCount, 0);
      const activeSubscriptions = clientsData.filter(u => u.subscriptionStatus !== 'free').length;
      const totalRevenue = clientsData.reduce((sum, u) => {
      const plan = pricingPlans.find(p => p.id === u.subscriptionStatus);
      const price = typeof plan?.price === 'number' ? plan.price : 0;
      return sum + price;
      }, 0);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const newUsersThisMonth = clientsData.filter(u => {
        const createdDate = new Date(u.createdAt);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }).length;

      const newUsersPreviousMonth = clientsData.filter(u => {
        const createdDate = new Date(u.createdAt);
        return createdDate.getMonth() === previousMonth && createdDate.getFullYear() === previousMonthYear;
      }).length;

      const campaignsThisMonth = campaignsData.filter(c => {
        const createdDate = new Date(c.createdAt);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }).length;

      const campaignsPreviousMonth = campaignsData.filter(c => {
        const createdDate = new Date(c.createdAt);
        return createdDate.getMonth() === previousMonth && createdDate.getFullYear() === previousMonthYear;
      }).length;

      const usersTrend = newUsersThisMonth >= newUsersPreviousMonth ? 'up' : 'down';
      const campaignsTrend = campaignsThisMonth >= campaignsPreviousMonth ? 'up' : 'down';

      setStats({
        totalUsers: clientsData.length,
        activeUsers: clientsData.filter(u => u.status === 'active').length,
        suspendedUsers: clientsData.filter(u => u.status === 'suspended').length,
        totalCampaigns: campaignsData.length,
        totalEmailsSent,
        successRate: totalEmailsAttempted > 0 ? (totalEmailsSent / totalEmailsAttempted) * 100 : 0,
        newUsersThisMonth,
        campaignsThisMonth,
        totalRevenue,
        activeSubscriptions
      });

      setTrends({ usersTrend, campaignsTrend });
      showToast('Data loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Error loading data from Firebase', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignApiKey = async () => {
    if (!selectedUser) return;
    
    if (!newApiKey.trim()) {
      showToast('Please enter an API key', 'error');
      return;
    }
    
    try {
      const apiKeyQuery = query(collection(db, 'apikeys'), where('userId', '==', selectedUser.id));
      const apiKeySnapshot = await getDocs(apiKeyQuery);

      if (!apiKeySnapshot.empty) {
        const docRef = apiKeySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          apiKey: newApiKey,
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(doc(collection(db, 'apikeys')), {
          userId: selectedUser.id,
          apiKey: newApiKey,
          createdAt: serverTimestamp()
        });
      }

      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, apiKey: newApiKey, hasApiKey: true } : u
      ));

      showToast(`API Key assigned to ${selectedUser.email}`, 'success');
      setShowApiModal(false);
      setSelectedUser(null);
      setNewApiKey('');
      setShowApiKey(false);
    } catch (error) {
      console.error('Error assigning API key:', error);
      showToast('Error assigning API key', 'error');
    }
  };

  const handleRevokeApiKey = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;

    try {
      const apiKeyQuery = query(collection(db, 'apikeys'), where('userId', '==', userId));
      const apiKeySnapshot = await getDocs(apiKeyQuery);

      if (!apiKeySnapshot.empty) {
        const docRef = apiKeySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          apiKey: '',
          updatedAt: serverTimestamp()
        });
      }

      setUsers(users.map(u => 
        u.id === userId ? { ...u, apiKey: undefined, hasApiKey: false } : u
      ));
      showToast('API Key revoked successfully', 'success');
    } catch (error) {
      console.error('Error revoking API key:', error);
      showToast('Error revoking API key', 'error');
    }
  };

/*
  const handleUpdateSubscription = async () => {
    if (!selectedUser || !selectedPlan) {
      showToast('Please select a plan', 'error');
      return;
    }

    const plan = pricingPlans.find(p => p.id === selectedPlan);
    if (!plan) return;

    const emailLimit = customEmailLimit ? parseInt(customEmailLimit) : plan.emailLimit;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    try {
      const userDocRef = doc(db, 'clients', selectedUser.id);
      await updateDoc(userDocRef, {
        subscriptionStatus: selectedPlan,
        subscriptionExpiry: expiryDate.toISOString().split('T')[0],
        totalEmailsAllowed: emailLimit,
        emailsRemaining: emailLimit,
        updatedAt: serverTimestamp()
      });

      setUsers(users.map(u => 
        u.id === selectedUser.id ? { 
          ...u, 
          subscriptionStatus: selectedPlan as 'free' | '2000c' | '6000c' | '10000c' | 'customc',
          subscriptionExpiry: expiryDate.toISOString().split('T')[0],
          totalEmailsAllowed: emailLimit,
          emailsRemaining: emailLimit
        } : u
      ));

      showToast(`Subscription updated for ${selectedUser.email}`, 'success');
      setShowSubscriptionModal(false);
      setSelectedUser(null);
      setSelectedPlan('');
      setCustomEmailLimit('');
    } catch (error) {
      console.error('Error updating subscription:', error);
      showToast('Error updating subscription', 'error');
    }
  };
*/

const handleUpdateSubscription = async () => {
  try {
    if (!selectedUser) return;

    const userDocRef = doc(db, 'clients', selectedUser.id);
    
    const plan = pricingPlans.find(p => p.id === selectedPlan);
    if (!plan) return;

    const emailLimit = customEmailLimit 
      ? parseInt(customEmailLimit) 
      : (typeof plan.emailLimit === 'number' ? plan.emailLimit : 0);
    
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    // Update the user's subscription in clients collection
    await updateDoc(userDocRef, {
      subscriptionStatus: selectedPlan,
      subscriptionExpiry: expiryDate.toISOString().split('T')[0],
      totalEmailsAllowed: emailLimit,
      emailsRemaining: emailLimit,
      updatedAt: serverTimestamp()
    });

    // Update coins balance
    const coinsQuery = query(collection(db, 'coins'), where('userId', '==', selectedUser.id));
    const coinsSnapshot = await getDocs(coinsQuery);

    if (!coinsSnapshot.empty) {
      // Update existing coins document
      const coinsDoc = coinsSnapshot.docs[0];
      await updateDoc(doc(db, 'coins', coinsDoc.id), {
        coins: emailLimit,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new coins document if it doesn't exist
      await addDoc(collection(db, 'coins'), {
        userId: selectedUser.id,
        coins: emailLimit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // Create transaction record for tracking
    await addDoc(collection(db, 'transactions'), {
      userId: selectedUser.id,
      amount: emailLimit,
      type: 'purchase',
      description: `Admin updated subscription to ${selectedPlan.toUpperCase()} - ${emailLimit} coins allocated`,
      date: serverTimestamp(),
      status: 'completed',
      packageInfo: `${selectedPlan} plan`,
      price: 0,
      adminUpdated: true
    });

    // Update local state
    setUsers(users.map(u =>
      u.id === selectedUser.id ? {
        ...u,
        subscriptionStatus: selectedPlan as 'free' | '2000c' | '6000c' | '10000c' | 'customc',
        subscriptionExpiry: expiryDate.toISOString().split('T')[0],
        totalEmailsAllowed: emailLimit,
        emailsRemaining: emailLimit,
        coins: emailLimit
      } : u
    ));

    showToast(`Subscription updated for ${selectedUser.email}. Coins balance set to ${emailLimit}.`, 'success');
    setShowSubscriptionModal(false);
    setSelectedUser(null);
  } catch (error) {
    console.error('Error updating subscription:', error);
    showToast('Error updating subscription: ' + (error instanceof Error ? error.message : String(error)), 'error');
  }
};

  const handleSuspendUser = async (userId: string) => {
    try {
      const userDocRef = doc(db, 'clients', userId);
      await updateDoc(userDocRef, {
        status: 'suspended',
        updatedAt: serverTimestamp()
      });

      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: 'suspended' as const } : u
      ));
      showToast('User suspended successfully', 'success');
    } catch (error) {
      console.error('Error suspending user:', error);
      showToast('Error suspending user', 'error');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const userDocRef = doc(db, 'clients', userId);
      await updateDoc(userDocRef, {
        status: 'active',
        updatedAt: serverTimestamp()
      });

      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: 'active' as const } : u
      ));
      showToast('User activated successfully', 'success');
    } catch (error) {
      console.error('Error activating user:', error);
      showToast('Error activating user', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'clients', userId));

      const apiKeyQuery = query(collection(db, 'apikeys'), where('userId', '==', userId));
      const apiKeySnapshot = await getDocs(apiKeyQuery);
      for (const docSnapshot of apiKeySnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
      }

      const coinsQuery = query(collection(db, 'coins'), where('userId', '==', userId));
      const coinsSnapshot = await getDocs(coinsQuery);
      for (const docSnapshot of coinsSnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
      }

      setUsers(users.filter(u => u.id !== userId));
      showToast('User deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Error deleting user', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCampaigns = campaigns.filter(c =>
    c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

// fetch purchase requests
  const loadPurchaseRequests = async () => {
  try {
    const { fetchAllPurchaseRequests } = await import('../../_utils/firebase-operations');
    const result = await fetchAllPurchaseRequests();
    
    if (result.code === 777 && result.data) {
      setPurchaseRequests(result.data.requests as PurchaseRequest[]);
    }
  } catch (error) {
    console.error('Error loading purchase requests:', error);
    showToast('Error loading purchase requests', 'error');
  }
  };

  // Add handler functions for approve/reject
const handleApprovePurchaseRequest = async (request: PurchaseRequest) => {
  if (!confirm(`Approve ${request.amount} coins purchase for ${request.userEmail}?`)) return;

  try {
    const { approvePurchaseRequest } = await import('../../_utils/firebase-operations');
    const result = await approvePurchaseRequest({
      requestId: request.id,
      userId: request.userId,
      amount: request.amount,
      price: request.price,
      packageInfo: request.packageInfo,
      packageId: request.packageId
    });

    if (result.code === 777) {
      showToast('Purchase request approved successfully', 'success');
      loadPurchaseRequests();
      loadDataFromFirebase(); // Refresh user data
    } else {
      showToast('Failed to approve request: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error approving request:', error);
    showToast('Error approving request', 'error');
  }
};

const handleRejectPurchaseRequest = async (request: PurchaseRequest) => {
  setSelectedRequest(request);
  setShowRequestDetailsModal(true);
};

const confirmRejectRequest = async () => {
  if (!selectedRequest) return;

  try {
    const { rejectPurchaseRequest } = await import('../../_utils/firebase-operations');
    const result = await rejectPurchaseRequest({
      requestId: selectedRequest.id,
      rejectionReason: rejectionReason || 'No reason provided'
    });

    if (result.code === 777) {
      showToast('Purchase request rejected', 'success');
      loadPurchaseRequests();
      setShowRequestDetailsModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } else {
      showToast('Failed to reject request: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error rejecting request:', error);
    showToast('Error rejecting request', 'error');
  }
};

const handleDeletePurchaseRequest = async (requestId: string) => {
  if (!confirm('Delete this purchase request? This action cannot be undone.')) return;

  try {
    const { deletePurchaseRequest } = await import('../../_utils/firebase-operations');
    const result = await deletePurchaseRequest({ requestId });

    if (result.code === 777) {
      showToast('Purchase request deleted', 'success');
      loadPurchaseRequests();
    } else {
      showToast('Failed to delete request: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error deleting request:', error);
    showToast('Error deleting request', 'error');
  }
};

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="mb-6 mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage users, campaigns, and billing</p>
          </div>
          <button
            onClick={loadDataFromFirebase}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-300 overflow-x-auto">
        {[
          { id: 'overview', icon: BarChart3, label: 'Overview' },
          { id: 'users', icon: Users, label: 'Users' },
          { id: 'campaigns', icon: Mail, label: 'Campaigns' },
          { id: 'billing', icon: DollarSign, label: 'Billing & Plans' },
          { id: 'requests', icon: CreditCard, label: 'Purchase Requests' },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'users' | 'campaigns' | 'billing' | 'settings')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap hover:bg-gray-200 dark:hover:bg-gray-300 cursor-pointer ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalUsers}</p>
                </div>
                <Users className="w-12 h-12 text-blue-500" />
              </div>
              <div className="flex items-center gap-2 mt-3">
                {trends.usersTrend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${trends.usersTrend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.newUsersThisMonth} new this month
                </span>
              </div>
            </div>


            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Campaigns</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalCampaigns}</p>
                </div>
                <Mail className="w-12 h-12 text-purple-500" />
              </div>
              <div className="flex items-center gap-2 mt-3">
                {trends.campaignsTrend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${trends.campaignsTrend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.campaignsThisMonth} this month
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Emails Sent</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalEmailsSent.toLocaleString()}</p>
                </div>
                <BarChart3 className="w-12 h-12 text-teal-500" />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">{stats.successRate.toFixed(1)}% success rate</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Campaigns</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Subject</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Recipients</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Sent</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Failed</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Success Rate</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 10).map((campaign) => {
                    const successRate = campaign.recipientsCount > 0 ? (campaign.sentCount / campaign.recipientsCount) * 100 : 0;
                    return (
                      <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-800">{campaign.userEmail}</td>
                        <td className="py-3 px-4 text-sm text-gray-800 max-w-xs truncate">{campaign.subject}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{campaign.recipientsCount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-green-600">{campaign.sentCount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-red-600">{campaign.failedCount}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{successRate.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{campaign.createdAt}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {campaign.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

{/*
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by email or name..."
                className="flex-1 outline-none text-gray-700"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Plan</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Emails Left</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Coins</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">API Key</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{user.displayName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getSubscriptionBadgeColor(user.subscriptionStatus)}`}>
                          {user.subscriptionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-gray-800">{user.emailsRemaining.toLocaleString()} / {user.totalEmailsAllowed.toLocaleString()}</p>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${(user.emailsRemaining / user.totalEmailsAllowed) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {user.hasApiKey ? (
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-gray-600 font-mono">{user.apiKey?.substring(0, 15)}...</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No API Key</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowSubscriptionModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Manage subscription"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          {user.hasApiKey ? (
                            <button
                              onClick={() => handleRevokeApiKey(user.id)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Revoke API key"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowApiModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Assign API key"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                          )}
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleSuspendUser(user.id)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Suspend user"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateUser(user.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Activate user"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
*/}

{activeTab === 'users' && (
  <div className="space-y-4">
    {/* Search */}
    <div className="bg-white rounded-lg p-4 shadow-md">
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users by email or name..."
          className="flex-1 outline-none text-gray-700"
        />
      </div>
    </div>

    {/* Users Table */}
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Package</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Coins Balance</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Emails Sent</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">API Key</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const packageInfo = pricingPlans.find(p => p.id === user.subscriptionStatus);
              const coinsUsed = (user.totalEmailsAllowed || 0) - (user.emailsRemaining || 0);
              const usagePercentage = user.coins ? ((coinsUsed / (user.coins + coinsUsed)) * 100) : 0;
              
              return (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{user.displayName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {user.subscriptionStatus === 'free' ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          Free
                        </span>
                      ) : (
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.subscriptionStatus === '2000c' ? 'bg-blue-100 text-blue-800' :
                            user.subscriptionStatus === '6000c' ? 'bg-amber-100 text-amber-800' :
                            user.subscriptionStatus === '10000c' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {packageInfo?.name || user.subscriptionStatus}
                          </span>
                          {user.subscriptionExpiry && (
                            <p className="text-xs text-gray-500 mt-1">
                              Expires: {new Date(user.subscriptionExpiry).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-lg font-bold text-amber-600">
                          {(user.coins || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            usagePercentage > 80 ? 'bg-red-500' :
                            usagePercentage > 50 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${100 - usagePercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {coinsUsed.toLocaleString()} coins used
                      </p>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {user.campaignsSent.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">campaigns</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Last: {new Date(user.lastActive).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    {user.hasApiKey ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
                          <Key className="w-3 h-3 text-green-600" />
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-xs text-gray-600 font-mono">
                          {user.apiKey?.substring(0, 8)}...
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No API Key</span>
                    )}
                  </td>
                  
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {/* Manage Subscription/Package */}
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowSubscriptionModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title="Manage package"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      
                      {/* API Key Management */}
                      {user.hasApiKey ? (
                        <button
                          onClick={() => handleRevokeApiKey(user.id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer"
                          title="Revoke API key"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowApiModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer"
                          title="Assign API key"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Suspend/Activate */}
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleSuspendUser(user.id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer"
                          title="Suspend user"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateUser(user.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer"
                          title="Activate user"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* User Statistics Summary */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.status === 'active').length}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 rounded-lg">
            <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Coins</p>
            <p className="text-2xl font-bold text-gray-800">
              {users.reduce((sum, u) => sum + (u.coins || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <Key className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">API Keys Issued</p>
            <p className="text-2xl font-bold text-gray-800">
              {users.filter(u => u.hasApiKey).length}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Mail className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Paid Packages</p>
            <p className="text-2xl font-bold text-gray-800">
              {users.filter(u => u.subscriptionStatus !== 'free').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns by subject or user..."
                className="flex-1 outline-none text-gray-700"
              />
            </div>
          </div>

          {/* Campaigns Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Subject</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Recipients</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Sent</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Failed</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Success Rate</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => {
                    const successRate = (campaign.sentCount / campaign.recipientsCount) * 100;
                    return (
                      <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-800">{campaign.userEmail}</td>
                        <td className="py-3 px-4 text-sm text-gray-800 max-w-xs truncate">{campaign.subject}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{campaign.recipientsCount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-green-600">{campaign.sentCount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-red-600">{campaign.failedCount}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{successRate.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{campaign.createdAt}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {campaign.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Billing & Plans Tab 
      {activeTab === 'billing' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pricingPlans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-lg p-6 shadow-md border-2 border-gray-200 hover:border-blue-500 transition-colors">
                <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 font-medium">{plan.emailLimit.toLocaleString()} emails/month</p>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    {users.filter(u => u.subscriptionStatus === plan.id).length} active users
                  </p>
                </div>
              </div>
            ))}
          </div>
        */}

        {activeTab === 'billing' && (
         <div className="space-y-6">
    {/* Pricing Plans Overview */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {pricingPlans.map((plan) => (
        <div 
          key={plan.id} 
          className={`bg-white rounded-lg p-6 shadow-md border-2 transition-all ${
            plan.bonus ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50' : 'border-gray-200 hover:border-blue-500'
          }`}
        >
          {plan.bonus && (
            <div className="mb-3">
              <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                POPULAR - +{plan.bonus} BONUS
              </span>
            </div>
          )}
          
          <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
          
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900">
              {typeof plan.price === 'number' ? `Kes. ${plan.price.toLocaleString()}` : plan.price}
            </span>
            {typeof plan.price === 'number' && (
              <span className="text-gray-600">/package</span>
            )}
          </div>
          
          <div className="mt-4 space-y-1">
            <p className="text-sm font-semibold text-gray-800">
              {typeof plan.coins === 'number' ? `${plan.coins.toLocaleString()}${plan.bonus ? ` + ${plan.bonus}` : ''} coins` : plan.coins}
            </p>
            <p className="text-xs text-gray-500">
              ≈ {typeof plan.emailLimit === 'number' ? `${plan.emailLimit.toLocaleString()} emails` : 'Custom emails'}
            </p>
          </div>
          
          <ul className="mt-6 space-y-3">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {users.filter(u => u.subscriptionStatus === plan.id).length} active users
            </p>
          </div>
        </div>
      ))}
    </div>

    {/* Revenue Overview */}
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue & Statistics</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">Total Revenue (KES)</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            Kes. {stats.totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Monthly recurring</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">Active Packages</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{stats.activeSubscriptions}</p>
          <p className="text-xs text-gray-500 mt-1">Paid users</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600">Avg Revenue/User</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            Kes. {stats.activeSubscriptions > 0 ? (stats.totalRevenue / stats.activeSubscriptions).toFixed(0) : '0'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Per user average</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
          <p className="text-sm text-gray-600">Total Coins Sold</p>
          <p className="text-2xl font-bold text-amber-600 mt-2">
            {users.reduce((sum, u) => sum + (u.coins || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>
      </div>
    </div>

    {/* Package Distribution */}
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Package Distribution</h3>
      <div className="space-y-3">
        {pricingPlans.map((plan) => {
          const userCount = users.filter(u => u.subscriptionStatus === plan.id).length;
          const percentage = stats.totalUsers > 0 ? (userCount / stats.totalUsers) * 100 : 0;
          
          return (
            <div key={plan.id} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{plan.name}</span>
                  <span className="text-sm text-gray-600">{userCount} users ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      plan.id === '2000c' ? 'bg-blue-500' :
                      plan.id === '6000c' ? 'bg-amber-500' :
                      plan.id === '10000c' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-right min-w-[100px]">
                <p className="text-sm font-semibold text-gray-800">
                  {typeof plan.price === 'number' ? `Kes. ${(plan.price * userCount).toLocaleString()}` : '-'}
                </p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Coin Usage Analytics */}
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Coin Usage Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Coins in Circulation</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {users.reduce((sum, u) => sum + (u.coins || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">Coins Used (Emails Sent)</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {stats.totalEmailsSent.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-gray-600">Average Coins per User</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {stats.totalUsers > 0 ? Math.round(users.reduce((sum, u) => sum + (u.coins || 0), 0) / stats.totalUsers).toLocaleString() : '0'}
          </p>
        </div>
      </div>
    </div>
         </div>
        )}
        
      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Daily Email Limit
                </label>
                <input
                  type="number"
                  defaultValue="10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Recipients per Campaign
                </label>
                <input
                  type="number"
                  defaultValue="50000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enable User Registration
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Enabled</option>
                  <option>Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Gateway
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Stripe</option>
                  <option>PayPal</option>
                  <option>Both</option>
                </select>
              </div>

              <button 
                onClick={() => showToast('Settings saved successfully', 'success')}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => showToast('Data export started', 'info')}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export All Data
              </button>
              
              <button 
                onClick={() => showToast('Cache cleared successfully', 'success')}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Clear Cache
              </button>
              
              <button 
                onClick={() => showToast('Old campaigns deleted', 'success')}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Old Campaigns (90+ days)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Assignment Modal */}
      {showApiModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Assign API Key</h3>
              <button 
                onClick={() => {
                  setShowApiModal(false);
                  setNewApiKey('');
                  setShowApiKey(false);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Assign API key to:</p>
              <p className="text-lg font-medium text-gray-800 mt-1">{selectedUser.email}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key *
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="Enter API key (e.g., sk_live_...)"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This API key will be used for the user API configuration
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The API key you enter will be assigned to this user. They will be able to use this key to access the API programmatically.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowApiModal(false);
                  setNewApiKey('');
                  setShowApiKey(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignApiKey}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                Assign API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Management Modal */}
      {showSubscriptionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Manage Subscription</h3>
              <button 
                onClick={() => {
                  setShowSubscriptionModal(false);
                  setSelectedPlan('');
                  setCustomEmailLimit('');
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600">Managing subscription for:</p>
              <p className="text-lg font-medium text-gray-800 mt-1">{selectedUser.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Current Plan: <span className="font-semibold capitalize">{selectedUser.subscriptionStatus}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pricingPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        selectedPlan === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-semibold text-gray-800">{plan.name}</p>
                      <p className="text-sm text-gray-600 mt-1">${plan.price}/month</p>
                      <p className="text-xs text-gray-500 mt-1">{plan.emailLimit.toLocaleString()} emails</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Email Limit (Optional)
                </label>
                <input
                  type="number"
                  value={customEmailLimit}
                  onChange={(e) => setCustomEmailLimit(e.target.value)}
                  placeholder="Leave empty to use plan default"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Override the plan default email limit</p>
              </div>

              {selectedPlan && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Summary:</strong> User will be upgraded to{' '}
                    <span className="font-semibold capitalize">{selectedPlan}</span> plan
                    {customEmailLimit && ` with ${parseInt(customEmailLimit).toLocaleString()} emails/month`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowSubscriptionModal(false);
                  setSelectedPlan('');
                  setCustomEmailLimit('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubscription}
                disabled={!selectedPlan}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Update Subscription
              </button>
            </div>
          </div>
        </div>
      )}

{/*Add the Purchase Requests Tab content*/}
{activeTab === 'requests' && (
  <div className="space-y-4">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-gray-800">
              {purchaseRequests.filter(r => r.status === 'pending').length}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-gray-800">
              {purchaseRequests.filter(r => r.status === 'approved').length}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-lg">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Rejected</p>
            <p className="text-2xl font-bold text-gray-800">
              {purchaseRequests.filter(r => r.status === 'rejected').length}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-gray-800">
              Kes. {purchaseRequests
                .filter(r => r.status === 'pending')
                .reduce((sum, r) => sum + r.price, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Requests Table */}
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Purchase Requests</h3>
          <button
            onClick={loadPurchaseRequests}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Package</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Coins</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Price</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  No purchase requests found
                </td>
              </tr>
            ) : (
              purchaseRequests.map((request) => (
                <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{request.userName}</p>
                      <p className="text-xs text-gray-500">{request.userEmail}</p>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-800">{request.packageInfo}</p>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-sm font-bold text-amber-600">
                        {request.amount.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <p className="text-sm font-semibold text-gray-800">
                      Kes. {request.price.toLocaleString()}
                    </p>
                  </td>
                  
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">
                      {request.createdAt.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {request.createdAt.toLocaleTimeString()}
                    </p>
                  </td>
                  
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprovePurchaseRequest(request)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer"
                            title="Approve request"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectPurchaseRequest(request)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Reject request"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeletePurchaseRequest(request.id)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                        title="Delete request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

{/* Rejection Modal */}
{showRequestDetailsModal && selectedRequest && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Reject Purchase Request</h3>
        <button 
          onClick={() => {
            setShowRequestDetailsModal(false);
            setSelectedRequest(null);
            setRejectionReason('');
          }} 
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">User:</p>
        <p className="text-lg font-medium text-gray-800">{selectedRequest.userEmail}</p>
        <p className="text-sm text-gray-600 mt-2">Package:</p>
        <p className="text-sm font-medium text-gray-800">{selectedRequest.packageInfo}</p>
        <p className="text-sm text-gray-600 mt-2">Amount:</p>
        <p className="text-sm font-medium text-gray-800">Kes. {selectedRequest.price.toLocaleString()}</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rejection Reason (Optional)
        </label>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Provide a reason for rejection..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={() => {
            setShowRequestDetailsModal(false);
            setSelectedRequest(null);
            setRejectionReason('');
          }}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={confirmRejectRequest}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Reject Request
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}