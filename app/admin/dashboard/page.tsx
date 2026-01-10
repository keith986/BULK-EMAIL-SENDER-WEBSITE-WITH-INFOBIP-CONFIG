"use client";
import { useState, useEffect } from 'react';
import { Users, Mail, BarChart3, Settings, Search, Trash2, Ban, Shield, Activity, MapPin, Monitor, CheckCircle, AlertCircle,Smartphone, Download, RefreshCw, TrendingUp, Clock, TrendingDown, Key, DollarSign, CreditCard, X, Eye, EyeOff } from 'lucide-react';
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../_lib/firebase';
import AdminProtected  from '../../_components/AdminProtected'
import { fetchAllPayments, fetchSystemSettings, saveSystemSettings, deleteOldCampaigns, exportAllData, fetchAdminLoginLogs, getAdminLoginStats, deleteOldAdminLogs, deleteOldPayments } from '../../_utils/firebase-operations';

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

interface Payment {
  id: string,
  userId: string,
  userEmail: string,
  userName: string,
  amount: number,
  coins: number
  packageInfo: string,
  packageId: string,
  paymentMethod: string,
  paymentStatus: string,
  transactionRef: string,
  mpesaPhone: string,
  mpesaCheckoutRequestId: string,
  rejectionReason: string,
}

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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'campaigns' | 'billing' | 'payments' | 'logs' | 'settings'>('overview');
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
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminLogs, setAdminLogs] = useState<Array<{
  adminEmail: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  status: 'success' | 'failed' | 'otp_sent' | 'otp_verified';
  failureReason?: string;
  timestamp: Date;
  }>>([]);
  const [loginStats, setLoginStats] = useState<{
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  uniqueAdmins: number;
  recentActivity: number;
  }>({
  totalLogins: 0,
  successfulLogins: 0,
  failedLogins: 0,
  uniqueAdmins: 0,
  recentActivity: 0
  });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [adminPaymentPage, setAdminPaymentPage] = useState(1);
  const ADMIN_PAYMENTS_PER_PAGE = 5;
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 5;
  const [campaignPage, setCampaignPage] = useState(1);
  const CAMPAIGNS_PER_PAGE = 5;
  const [logsPage, setLogsPage] = useState(1);
  const LOGS_PER_PAGE = 5;
  const [showPaymentReviewModal, setShowPaymentReviewModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
  type: 'payment' | 'user' | 'apikey';
  id: string;
  name?: string;
  email?: string;
  } | null>(null);
const [systemSettings, setSystemSettings] = useState<{
  maxRecipientsPerCampaign: number;
  registrationEnabled: boolean;
  autoApprovePayments?: boolean;
}>({
  maxRecipientsPerCampaign: 2000,
  registrationEnabled: true,
  autoApprovePayments: false
});

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  // Reset pagination when search query changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setUserPage(1);
    setCampaignPage(1);
  };

useEffect(() => {
  loadDataFromFirebase();
  loadAdminLogs();
  loadPayments();
  loadSystemSettings();

  // Auto-delete old payments (older than 1 month) and logs in background
  deleteOldPayments({ monthsOld: 1 }).catch(err => {
    console.error('Background payment cleanup failed:', err);
  });
  deleteOldAdminLogs({ daysOld: 7 }).catch(err => {
    console.error('Background log cleanup failed:', err);
  });

  // Set up periodic cleanup every hour while dashboard is open
  const cleanupInterval = setInterval(async () => {
    try {
      await deleteOldPayments({ monthsOld: 1 });
      await deleteOldAdminLogs({ daysOld: 7 });
    } catch (error) {
      console.error('Periodic cleanup failed:', error);
    }
  }, 3600000); // Run every hour (3600000 ms)

  return () => {
    clearInterval(cleanupInterval); // Cleanup interval on unmount
  };

}, []);

const loadAdminLogs = async () => {
  try {
    
    // Automatically delete logs older than 7 days (keeps only current week)
    // This runs silently in the background
    deleteOldAdminLogs({ daysOld: 7 }).catch(err => {
      console.error('Background log cleanup failed:', err);
    });
    
    const logsResult = await fetchAdminLoginLogs({ limitCount: 100 });
    if (logsResult.code === 777 && logsResult.data) {
      setAdminLogs(logsResult.data);
    }

    const statsResult = await getAdminLoginStats();
    if (statsResult.code === 777 && statsResult.data) {
      setLoginStats(statsResult.data);
    }
  } catch (error) {
    console.error('Error loading admin logs:', error);
    showToast('Error loading admin activity logs', 'error');
  }
};

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
      setUserPage(1);

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
      setCampaignPage(1);

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

  const handleRevokeApiKey = (userId: string, email: string) => {
  setDeleteTarget({
    type: 'apikey',
    id: userId,
    email: email
  });
  setShowDeleteModal(true);
  };

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
      loginEnabled: false,
      suspendedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: 'suspended' as const } : u
    ));
    showToast('User suspended successfully. Login access disabled.', 'success');
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
      loginEnabled: true,
      reactivatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: 'active' as const } : u
    ));
    showToast('User activated successfully. Login access enabled.', 'success');
  } catch (error) {
    console.error('Error activating user:', error);
    showToast('Error activating user', 'error');
  }
  };

  const handleDeleteUser = (userId: string, email: string, displayName: string) => {
  setDeleteTarget({
    type: 'user',
    id: userId,
    email: email,
    name: displayName
  });
  setShowDeleteModal(true);
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCampaigns = campaigns.filter(c =>
    c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );


const loadPayments = async () => {
  try {
    const result = await fetchAllPayments();
    if (result.code === 777 && result.data) {
      // Filter out cancelled, failed, and zero-coin payments - only show valid pending and completed
      console.log(result.data)
      const filteredPayments = result.data.payments.filter(
        (p: any) => p.paymentStatus !== 'cancelled' && p.paymentStatus !== 'failed' && (p.coins || 0) > 0
      );
      
      // Sort by most recent first
      const sortedPayments = filteredPayments.sort((a: any, b: any) => {
        const dateA = a.mpesaCompletedAt || a.approvedAt || a.createdAt || 0;
        const dateB = b.mpesaCompletedAt || b.approvedAt || b.createdAt || 0;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      
      setPayments(sortedPayments);
      setAdminPaymentPage(1);
    }
  } catch (error) {
    console.error('Error loading payments:', error);
    showToast('Error loading payments', 'error');
  }
};

// Helper to format various Firestore timestamp shapes
const formatPaymentDate = (d: any) => {
  try {
    if (!d) return '-';
    // Firestore Timestamp has toDate()
    if (typeof d.toDate === 'function') return d.toDate().toLocaleString();
    // Object with seconds
    if (d.seconds) return new Date(d.seconds * 1000).toLocaleString();
    // ISO string
    if (typeof d === 'string') return new Date(d).toLocaleString();
    // JS Date
    if (d instanceof Date) return d.toLocaleString();
    return String(d);
  } catch (err) {
    return '-';
  }
};

// Add handlers
const handleReviewPayment = (payment: Payment) => {
  setSelectedPayment(payment);
  setShowPaymentReviewModal(true);
};

const confirmApprovePayment = async () => {
  if (!selectedPayment) return;

  try {
    console.log('Admin confirming approve for payment:', selectedPayment);
    const { approvePayment } = await import('../../_utils/firebase-operations');
    const result = await approvePayment({
      paymentId: selectedPayment.id,
      userId: selectedPayment.userId,
      coins: selectedPayment.coins,
      packageId: selectedPayment.packageId,
      packageInfo: selectedPayment.packageInfo
    });

    console.log('approvePayment result:', result);
    if (result.code === 777) {
      showToast('Payment approved and coins credited successfully!', 'success');
      setShowPaymentReviewModal(false);
      setSelectedPayment(null);
      loadPayments();
      loadDataFromFirebase(); // Refresh user data to show updated coins
    } else {
      showToast('Failed to approve payment: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error approving payment:', error);
    showToast('Error approving payment', 'error');
  }
};

const handleRejectPayment = async (payment: Payment) => {
  const reason = prompt('Rejection reason (optional):');

  try {
    const { rejectPayment } = await import('../../_utils/firebase-operations');
    const result = await rejectPayment({
      paymentId: payment.id,
      rejectionReason: reason || 'Rejected by admin'
    });

    if (result.code === 777) {
      showToast('Payment rejected', 'success');
      loadPayments();
      loadDataFromFirebase(); // refresh user coins/subscription
    } else {
      showToast('Failed to reject payment: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error rejecting payment:', error);
    showToast('Error rejecting payment', 'error');
  }
};

const handleDeletePayment = (paymentId: string, userName?: string) => {
  setDeleteTarget({
    type: 'payment',
    id: paymentId,
    name: userName
  });
  setShowDeleteModal(true);
};

const confirmDelete = async () => {
  if (!deleteTarget) return;

  try {
    switch (deleteTarget.type) {
      case 'payment':
        await deleteDoc(doc(db, 'payments', deleteTarget.id));
        showToast('Payment deleted successfully', 'success');
        loadPayments();
        break;

      case 'user':
        await deleteDoc(doc(db, 'clients', deleteTarget.id));

        const apiKeyQuery = query(collection(db, 'apikeys'), where('userId', '==', deleteTarget.id));
        const apiKeySnapshot = await getDocs(apiKeyQuery);
        for (const docSnapshot of apiKeySnapshot.docs) {
          await deleteDoc(docSnapshot.ref);
        }

        const coinsQuery = query(collection(db, 'coins'), where('userId', '==', deleteTarget.id));
        const coinsSnapshot = await getDocs(coinsQuery);
        for (const docSnapshot of coinsSnapshot.docs) {
          await deleteDoc(docSnapshot.ref);
        }

        setUsers(users.filter(u => u.id !== deleteTarget.id));
        showToast('User deleted successfully', 'success');
        break;

      case 'apikey':
        const apiQuery = query(collection(db, 'apikeys'), where('userId', '==', deleteTarget.id));
        const apiSnapshot = await getDocs(apiQuery);

        if (!apiSnapshot.empty) {
          const docRef = apiSnapshot.docs[0].ref;
          await updateDoc(docRef, {
            apiKey: '',
            updatedAt: serverTimestamp()
          });
        }

        setUsers(users.map(u => 
          u.id === deleteTarget.id ? { ...u, apiKey: undefined, hasApiKey: false } : u
        ));
        showToast('API Key revoked successfully', 'success');
        break;
    }
  } catch (error) {
    console.error('Error during deletion:', error);
    showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
  } finally {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }
};

const loadSystemSettings = async () => {
  try {
    const result = await fetchSystemSettings();
    if (result.code === 777 && result.data) {
      console.log('📋 System settings loaded from Firestore:', {
        maxRecipientsPerCampaign: result.data.maxRecipientsPerCampaign,
        registrationEnabled: result.data.registrationEnabled,
        autoApprovePayments: result.data.autoApprovePayments,
        autoApprovePaymentsType: typeof result.data.autoApprovePayments
      });
      setSystemSettings(result.data);
    }
  } catch (error) {
    console.error('Error loading system settings:', error);
    showToast('Error loading system settings', 'error');
  }
};

const handleSaveSettings = async () => {
  setLoading(true);
  try {
    console.log('💾 Saving system settings:', {
      maxRecipientsPerCampaign: systemSettings.maxRecipientsPerCampaign,
      registrationEnabled: systemSettings.registrationEnabled,
      autoApprovePayments: systemSettings.autoApprovePayments,
      autoApprovePaymentsType: typeof systemSettings.autoApprovePayments
    });
    const result = await saveSystemSettings({ settings: systemSettings });
    
    if (result.code === 777) {
      console.log('✅ Settings saved successfully to Firestore');
      showToast('Settings saved successfully', 'success');
    } else {
      showToast('Failed to save settings: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Error saving settings', 'error');
  } finally {
    setLoading(false);
  }
};

const handleExportData = async () => {
  setLoading(true);
  try {
    const result = await exportAllData();
    
    if (result.code === 777 && result.data) {
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `admin-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast('Data exported successfully', 'success');
    } else {
      showToast('Failed to export data: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    showToast('Error exporting data', 'error');
  } finally {
    setLoading(false);
  }
};

async function handleDeleteOldCampaigns() {
  if (!confirm('Are you sure you want to delete all campaigns older than 90 days? This action cannot be undone.')) {
    return;
  }
  
  setLoading(true);
  try {
    const result = await deleteOldCampaigns();
    
    if (result.code === 777) {
      showToast(`Successfully deleted ${result.deletedCount || 0} old campaign(s)`, 'success');
      loadDataFromFirebase();
    } else {
      showToast('Failed to delete campaigns: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error deleting campaigns:', error);
    showToast('Error deleting old campaigns', 'error');
  } finally {
    setLoading(false);
  }
}

  return (
    <AdminProtected>
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="mb-6">
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
          { id: 'payments', icon: DollarSign, label: 'Payments' },
          {id: 'logs', icon: Shield, label: 'Admin Activity'},
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

{activeTab === 'users' && (
  <div className="space-y-4">
    {/* Search */}
    <div className="bg-white rounded-lg p-4 shadow-md">
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
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
            {filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE).map((user) => {
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
                          onClick={() => handleRevokeApiKey(user.id, user.email)}
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
                      onClick={() => handleDeleteUser(user.id, user.email, user.displayName)}
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

      {/* Pagination */}
      {filteredUsers.length > USERS_PER_PAGE && (
        <div className="bg-white rounded-lg p-4 shadow-md flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((userPage - 1) * USERS_PER_PAGE) + 1} to {Math.min(userPage * USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setUserPage(Math.max(1, userPage - 1))}
              disabled={userPage === 1}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.ceil(filteredUsers.length / USERS_PER_PAGE) }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setUserPage(i + 1)}
                className={`px-3 py-2 rounded transition-colors ${
                  userPage === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => setUserPage(Math.min(Math.ceil(filteredUsers.length / USERS_PER_PAGE), userPage + 1))}
              disabled={userPage === Math.ceil(filteredUsers.length / USERS_PER_PAGE)}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
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
                onChange={(e) => handleSearchChange(e.target.value)}
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
                  {filteredCampaigns.slice((campaignPage - 1) * CAMPAIGNS_PER_PAGE, campaignPage * CAMPAIGNS_PER_PAGE).map((campaign) => {
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

          {/* Campaigns Pagination */}
          {filteredCampaigns.length > CAMPAIGNS_PER_PAGE && (
            <div className="bg-white rounded-lg p-4 shadow-md flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing {((campaignPage - 1) * CAMPAIGNS_PER_PAGE) + 1} to {Math.min(campaignPage * CAMPAIGNS_PER_PAGE, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCampaignPage(Math.max(1, campaignPage - 1))}
                  disabled={campaignPage === 1}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {Array.from({ length: Math.ceil(filteredCampaigns.length / CAMPAIGNS_PER_PAGE) }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCampaignPage(i + 1)}
                    className={`px-3 py-2 rounded transition-colors ${
                      campaignPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCampaignPage(Math.min(Math.ceil(filteredCampaigns.length / CAMPAIGNS_PER_PAGE), campaignPage + 1))}
                  disabled={campaignPage === Math.ceil(filteredCampaigns.length / CAMPAIGNS_PER_PAGE)}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      )}

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
                {plan.bonus} BONUS
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
         </div>
        )}
        
      {/* Settings Tab */}
      {activeTab === 'settings' && (
  <div className="space-y-4">
    <div className="flex gap-4 flex-col lg:flex-row">
    <div className="w-full bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">System Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Recipients per Campaign
          </label>
          <input
            type="number"
            value={systemSettings.maxRecipientsPerCampaign}
            onChange={(e) => setSystemSettings({...systemSettings, maxRecipientsPerCampaign: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Maximum recipients allowed in a single campaign</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enable User Registration
          </label>
          <select 
            value={systemSettings.registrationEnabled ? 'enabled' : 'disabled'}
            onChange={(e) => setSystemSettings({...systemSettings, registrationEnabled: e.target.value === 'enabled'})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Allow new users to register on the platform</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Auto-Approve Payments
          </label>
          <select 
            value={systemSettings.autoApprovePayments !== false ? 'enabled' : 'disabled'}
            onChange={(e) => setSystemSettings({...systemSettings, autoApprovePayments: e.target.value === 'enabled'})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="enabled">Enabled (Auto-approve on successful payment)</option>
            <option value="disabled">Disabled (Manual admin approval required)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            When enabled, successful M-Pesa payments are automatically approved and coins credited immediately. 
            When disabled, admin must manually approve payments.
          </p>
          <p className={`text-xs mt-2 px-2 py-1 rounded ${systemSettings.autoApprovePayments === false ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
            Current setting: {systemSettings.autoApprovePayments === false ? '❌ Manual Approval Required' : '✅ Auto-Approve Enabled'}
          </p>
        </div>

        <button 
          onClick={handleSaveSettings}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Settings className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>

    <div className="w-full h-[100%] bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
      
      <div className="space-y-3 flex gap-4 justify-between flex-col md:flex-row">
        <button 
          onClick={handleExportData}
          disabled={loading}
          className="w-half-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export All Data
        </button>
        
        <button 
          onClick={handleDeleteOldCampaigns}
          disabled={loading}
          className="w-half-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Old Campaigns (90+ days)
        </button>
      </div>
    </div>
    </div>
    {/* Settings Info */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Settings className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-blue-900">System Configuration</h4>
          <p className="text-sm text-blue-800 mt-1">
            Changes to system settings will take effect immediately for all users. Be careful when modifying these values.
          </p>
        </div>
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

{activeTab === 'payments' && (
  <div className="space-y-4">
    {/* Payment Statistics */}
    <div className="flex gap-4 w-full">
      <div className="bg-white rounded-lg p-4 shadow-md w-full">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Payments</p>
            <p className="text-2xl font-bold text-gray-800">{payments.length}</p>
            <p className="text-xs text-gray-500 mt-1">All transactions</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-md w-full">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Awaiting Review</p>
            <p className="text-2xl font-bold text-gray-800">
              {payments.filter(p => p.paymentStatus === 'pending').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Need admin action</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-md w-full">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-gray-800">
              {payments.filter(p => p.paymentStatus === 'completed').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Coins credited</p>
          </div>
        </div>
      </div>
    </div>

       {/* Search */}
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns by name or email..."
                className="flex-1 outline-none text-gray-700"
              />
            </div>
          </div>

    {/* Payments Table */}
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Payment Transactions</h3>
          <button
            onClick={loadPayments}
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
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Payment Method</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Coins</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              payments
                .slice((adminPaymentPage - 1) * ADMIN_PAYMENTS_PER_PAGE, adminPaymentPage * ADMIN_PAYMENTS_PER_PAGE)
                .map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{payment.userName}</p>
                      <p className="text-xs text-gray-500">{payment.userEmail}</p>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-800">{payment.packageInfo}</p>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {payment.paymentMethod === 'mpesa' ? (
                        <>
                          <div className="bg-green-100 p-1.5 rounded">
                            <Smartphone className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">M-Pesa</p>
                            {payment.mpesaPhone && (
                              <p className="text-xs text-gray-500">+{payment.mpesaPhone}</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-blue-100 p-1.5 rounded">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">system error</p>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <p className="text-sm font-bold text-gray-800">
                      Kes. {payment.amount.toLocaleString()}
                    </p>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-sm font-bold text-amber-600">
                        {payment.coins.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">{formatPaymentDate(payment.mpesaCompletedAt || payment.approvedAt || payment.createdAt)}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      payment.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      payment.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)}
                    </span>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {/* Review Button - Always show for pending and completed */}
                      <button
                        onClick={() => handleReviewPayment(payment)}
                        className={`p-2 rounded transition-colors cursor-pointer ${
                          payment.paymentStatus === 'pending' 
                            ? 'text-blue-600 hover:bg-blue-50' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        title={payment.paymentStatus === 'pending' ? 'Review & Approve' : 'View Details'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeletePayment(payment.id, payment.userName)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Delete payment"
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

      {/* Pagination Controls */}
      {payments.length > ADMIN_PAYMENTS_PER_PAGE && (
        <div className="flex items-center justify-between mt-6 p-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {(adminPaymentPage - 1) * ADMIN_PAYMENTS_PER_PAGE + 1} to {Math.min(adminPaymentPage * ADMIN_PAYMENTS_PER_PAGE, payments.length)} of {payments.length} payments
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setAdminPaymentPage(p => Math.max(1, p - 1))}
              disabled={adminPaymentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(payments.length / ADMIN_PAYMENTS_PER_PAGE) }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setAdminPaymentPage(i + 1)}
                  className={`px-3 py-2 rounded-lg ${
                    adminPaymentPage === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setAdminPaymentPage(p => Math.min(Math.ceil(payments.length / ADMIN_PAYMENTS_PER_PAGE), p + 1))}
              disabled={adminPaymentPage === Math.ceil(payments.length / ADMIN_PAYMENTS_PER_PAGE)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}

{/* Payment Review Modal */}
{showPaymentReviewModal && selectedPayment && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${
            selectedPayment.paymentStatus === 'pending' ? 'bg-yellow-100' :
            selectedPayment.paymentStatus === 'completed' ? 'bg-green-100' :
            'bg-red-100'
          }`}>
            {selectedPayment.paymentStatus === 'pending' ? (
              <Clock className="w-6 h-6 text-yellow-600" />
            ) : selectedPayment.paymentStatus === 'completed' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <X className="w-6 h-6 text-red-600" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Payment Review</h3>
            <p className="text-sm text-gray-500">
              {selectedPayment.paymentStatus === 'pending' 
                ? 'Review and approve this payment' 
                : 'Payment details'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            setShowPaymentReviewModal(false);
            setSelectedPayment(null);
          }} 
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Payment Status Badge */}
      <div className="mb-6">
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
          selectedPayment.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          selectedPayment.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          Status: {selectedPayment.paymentStatus.toUpperCase()}
        </span>
      </div>

      {/* User Information */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-3">User Information</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-blue-700">Name</p>
            <p className="text-sm font-medium text-blue-900">{selectedPayment.userName}</p>
          </div>
          <div>
            <p className="text-xs text-blue-700">Email</p>
            <p className="text-sm font-medium text-blue-900">{selectedPayment.userEmail}</p>
          </div>
          <div>
            <p className="text-xs text-blue-700">User ID</p>
            <p className="text-sm font-mono text-blue-900">{selectedPayment.userId}</p>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Payment Details</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Package</span>
            <span className="text-sm font-semibold text-gray-900">{selectedPayment.packageInfo}</span>
          </div>
          
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Amount Paid</span>
            <span className="text-lg font-bold text-gray-900">Kes. {selectedPayment.amount.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Coins to Credit</span>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
              </svg>
              <span className="text-lg font-bold text-amber-600">
                {selectedPayment.coins.toLocaleString()} coins
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Payment Method</span>
            <div className="flex items-center gap-2">
              {selectedPayment.paymentMethod === 'mpesa' ? (
                <>
                  <Smartphone className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">M-Pesa</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Card</span>
                </>
              )}
            </div>
          </div>

          {selectedPayment.mpesaPhone && (
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">M-Pesa Phone</span>
              <span className="text-sm font-mono text-gray-900">+{selectedPayment.mpesaPhone}</span>
            </div>
          )}

          {selectedPayment.transactionRef && (
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Transaction Reference</span>
              <span className="text-sm font-mono text-gray-900 bg-gray-200 px-2 py-1 rounded">
                {selectedPayment.transactionRef}
              </span>
            </div>
          )}

          {selectedPayment.mpesaCheckoutRequestId && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Checkout Request ID</span>
              <span className="text-xs font-mono text-gray-600 bg-gray-200 px-2 py-1 rounded max-w-xs truncate" title={selectedPayment.mpesaCheckoutRequestId}>
                {selectedPayment.mpesaCheckoutRequestId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Warning/Info Messages */}
      {selectedPayment.paymentStatus === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-900">Review Required</h4>
              <p className="text-sm text-yellow-800 mt-1">
                Please verify the transaction reference and payment details before approving. 
                Once approved, {selectedPayment.coins.toLocaleString()} coins will be immediately credited to the user's account.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedPayment.paymentStatus === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-green-900">Payment Approved</h4>
              <p className="text-sm text-green-800 mt-1">
                This payment has been approved and {selectedPayment.coins.toLocaleString()} coins have been credited to the user's account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            setShowPaymentReviewModal(false);
            setSelectedPayment(null);
          }}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
        
        {selectedPayment.paymentStatus === 'pending' && (
          <button
            onClick={confirmApprovePayment}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Approve & Credit Coins
          </button>
        )}
      </div>
    </div>
  </div>
)}

{activeTab === 'logs' && (
  <div className="space-y-6">
    {/* Add auto-cleanup status banner at the top */}
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-green-900">Automatic Log Cleanup Active</h4>
          <p className="text-sm text-green-800 mt-1">
            Admin login logs older than 7 days are automatically deleted to maintain optimal database performance. 
            Only the current week activity is retained.
          </p>
        </div>
      </div>
    </div>

    {/* Login Statistics */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* ... existing stats cards ... */}
    </div>

    {/* Success Rate Chart */}
    <div className="bg-white rounded-lg p-6 shadow-md">
      {/* ... existing chart ... */}
    </div>

    {/* Activity Log Table */}
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Admin Login Activity</h3>
          <p className="text-sm text-gray-500 mt-1">
            Recent admin access attempts (Last 7 days only)
          </p>
        </div>
        <button
          onClick={loadAdminLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Timestamp</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Admin Email</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">IP Address</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Location</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Device</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Details</th>
            </tr>
          </thead>
          <tbody>
            {adminLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  No admin activity logs found in the last 7 days
                </td>
              </tr>
            ) : (
              adminLogs.slice((logsPage - 1) * LOGS_PER_PAGE, logsPage * LOGS_PER_PAGE).map((log, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm text-gray-800">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded">
                        <Shield className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {log.adminEmail}
                      </span>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${
                      log.status === 'success' ? 'bg-green-100 text-green-800' :
                      log.status === 'failed' ? 'bg-red-100 text-red-800' :
                      log.status === 'otp_sent' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {log.status === 'success' && <CheckCircle className="w-3 h-3" />}
                      {log.status === 'failed' && <X className="w-3 h-3" />}
                      {log.status === 'otp_sent' && <Mail className="w-3 h-3" />}
                      {log.status === 'otp_verified' && <Shield className="w-3 h-3" />}
                      {log.status.replace('_', ' ').charAt(0).toUpperCase() + log.status.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 font-mono">
                        {log.ipAddress || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {log.location || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="max-w-xs">
                      <p className="text-xs text-gray-500 truncate" title={log.userAgent}>
                        {log.userAgent || 'Unknown'}
                      </p>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    {log.failureReason ? (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-red-600">
                          {log.failureReason}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Logs Pagination */}
    {adminLogs.length > LOGS_PER_PAGE && (
      <div className="bg-white rounded-lg p-4 shadow-md flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing {((logsPage - 1) * LOGS_PER_PAGE) + 1} to {Math.min(logsPage * LOGS_PER_PAGE, adminLogs.length)} of {adminLogs.length} logs
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setLogsPage(Math.max(1, logsPage - 1))}
            disabled={logsPage === 1}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {Array.from({ length: Math.ceil(adminLogs.length / LOGS_PER_PAGE) }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setLogsPage(i + 1)}
              className={`px-3 py-2 rounded transition-colors ${
                logsPage === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setLogsPage(Math.min(Math.ceil(adminLogs.length / LOGS_PER_PAGE), logsPage + 1))}
            disabled={logsPage === Math.ceil(adminLogs.length / LOGS_PER_PAGE)}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    )}

    {/* Security Alerts */}
    {loginStats.failedLogins > 5 && (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-800">Security Alert</h4>
            <p className="text-sm text-red-700 mt-1">
              Multiple failed login attempts detected ({loginStats.failedLogins} failures). 
              Please review the activity log for suspicious activity.
            </p>
          </div>
        </div>
      </div>
    )}
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
          onClick={handleRejectPayment}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Reject Request
        </button>
      </div>
    </div>
  </div>
)}

{/* Delete Confirmation Modal */}
{showDeleteModal && deleteTarget && (
  <div className="fixed inset-0 backdrop-blur-[10px] bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-slate-100 rounded-lg p-6 max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Confirm {deleteTarget.type === 'apikey' ? 'Revocation' : 'Deletion'}
          </h3>
        </div>
        <button 
          onClick={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }} 
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Warning Content */}
      <div className="mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-red-900 mb-2">
            {deleteTarget.type === 'payment' && ' Delete Payment Record'}
            {deleteTarget.type === 'user' && ' Delete User Account'}
            {deleteTarget.type === 'apikey' && ' Revoke API Key'}
          </p>
          <p className="text-sm text-red-800">
            {deleteTarget.type === 'payment' && 
              'This will permanently remove the payment record from the database.'
            }
            {deleteTarget.type === 'user' && 
              'This will permanently delete the user account, all associated data, API keys, and coin balance. This action cannot be undone.'
            }
            {deleteTarget.type === 'apikey' && 
              'This will revoke the user\'s API key. They will lose access to API features until a new key is assigned.'
            }
          </p>
        </div>

        {/* Item Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-2">
            {deleteTarget.type === 'payment' && 'Payment for:'}
            {deleteTarget.type === 'user' && 'User Details:'}
            {deleteTarget.type === 'apikey' && 'Revoking API key for:'}
          </p>
          {deleteTarget.name && (
            <p className="text-sm font-medium text-gray-900">{deleteTarget.name}</p>
          )}
          {deleteTarget.email && (
            <p className="text-sm text-gray-700 mt-1">{deleteTarget.email}</p>
          )}
          <p className="text-xs text-gray-500 mt-2 font-mono">ID: {deleteTarget.id.substring(0, 16)}...</p>
        </div>
      </div>

      {/* Confirmation Text */}
      <div className="mb-6">
        <p className="text-sm text-gray-700">
          {deleteTarget.type === 'payment' && 'Are you sure you want to delete this payment record?'}
          {deleteTarget.type === 'user' && 'Type "DELETE" below to confirm you want to permanently delete this user account:'}
          {deleteTarget.type === 'apikey' && 'Are you sure you want to revoke this API key?'}
        </p>
        
        {deleteTarget.type === 'user' && (
          <input
            type="text"
            placeholder="Type DELETE to confirm"
            className="w-full mt-3 px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            id="deleteConfirmInput"
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        
        <button
          onClick={() => {
            if (deleteTarget.type === 'user') {
              const input = document.getElementById('deleteConfirmInput') as HTMLInputElement;
              if (input && input.value !== 'DELETE') {
                showToast('Please type DELETE to confirm', 'error');
                return;
              }
            }
            confirmDelete();
          }}
          className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            deleteTarget.type === 'apikey' 
              ? 'bg-orange-600 hover:bg-orange-700' 
              : 'bg-red-600 hover:bg-red-700'
          } text-white`}
        >
          {deleteTarget.type === 'payment' && (
            <>
              <Trash2 className="w-4 h-4" />
              Delete Payment
            </>
          )}
          {deleteTarget.type === 'user' && (
            <>
              <Trash2 className="w-4 h-4" />
              Delete User
            </>
          )}
          {deleteTarget.type === 'apikey' && (
            <>
              <Key className="w-4 h-4" />
              Revoke API Key
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
    </AdminProtected>
  );
}