'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import ProductManager from '../components/ProductManager';
import UserProfile from '../components/UserProfile';
import Feed from '../components/Feed';
import FriendRecommendations from '../components/FriendRecommendations';

export default function Home() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'feed' | 'products' | 'recommendations' | 'profile'>('feed');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[var(--border)] pb-2 mb-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center pt-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">OneOff</h1>
          <div className="flex items-center gap-4 mt-2 self-end w-full justify-end pr-2">
            <span className="text-base text-gray-600">
              Welcome, {profile?.name || user.email}
            </span>
            <button
              onClick={signOut}
              className="px-4 py-2 border border-red-400 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="max-w-4xl mx-auto flex justify-center mb-8">
        <div className="flex gap-8">
          {['feed', 'products', 'recommendations', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'feed' | 'products' | 'recommendations' | 'profile')}
              className={`pb-2 text-lg font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[var(--accent)] text-black'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
              style={{ minWidth: 100 }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <main className="max-w-4xl mx-auto px-2">
        {activeTab === 'feed' && <Feed />}
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'recommendations' && <FriendRecommendations />}
        {activeTab === 'profile' && <UserProfile />}
      </main>
    </div>
  );
}
