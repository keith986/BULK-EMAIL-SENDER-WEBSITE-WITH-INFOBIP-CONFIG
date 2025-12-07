"use client";
import { useState, useEffect } from 'react';
import { Users, Mail, BarChart3, Settings, Search, Trash2, Ban, CheckCircle, Download, RefreshCw, TrendingUp, TrendingDown, Key, DollarSign, CreditCard, X, Eye, EyeOff } from 'lucide-react';
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../_lib/firebase';
import AdminProtected from '@/app/_components/AdminProtected';

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
  subscriptionStatus: 'free' | 'basic' | 'pro' | 'enterprise';
  subscriptionExpiry?: string;
  emailsRemaining: number;
  totalEmailsAllowed: number;
  coins?: number;
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
  price: number;
  emailLimit: number;
  features: string[];
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    emailLimit: 500,
    features: ['500 emails/month', 'Basic templates', 'Email support']
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    emailLimit: 10000,
    features: ['10,000 emails/month', 'All templates', 'Priority support', 'Analytics']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    emailLimit: 50000,
    features: ['50,000 emails/month', 'Advanced templates', '24/7 support', 'API access', 'Custom domains']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    emailLimit: 200000,
    features: ['200,000 emails/month', 'Unlimited templates', 'Dedicated support', 'Full API access', 'White label']
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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'campaigns' | 'billing' | 'settings'>('overview');
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

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    loadDataFromFirebase();
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
        return sum + (plan?.price || 0);
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
          subscriptionStatus: selectedPlan as any,
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

  const getSubscriptionBadgeColor = (status: string) => {
    switch(status) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'pro': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
      
      <div className="mb-6 ">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage users, campaigns, and billing</p>
          </div>
          <button
            onClick={loadDataFromFirebase}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
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
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-300 ${
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

      {/* Billing & Plans Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Pricing Plans Overview */}
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

          {/* Revenue Overview */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">${stats.totalRevenue}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{stats.activeSubscriptions}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Average Revenue per User</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  ${stats.activeSubscriptions > 0 ? (stats.totalRevenue / stats.activeSubscriptions).toFixed(2) : '0'}
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
    </div>
  </AdminProtected>
  );
}