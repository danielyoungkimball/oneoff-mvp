'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, UserPreferences } from '../types/db';

export default function UserProfile() {
  const { profile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    avatar_url: '',
  });
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [newSearchTerm, setNewSearchTerm] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/users/me/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        await refreshProfile();
      } else {
        setMessage('Failed to update profile');
      }
    } catch (error) {
      setMessage('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferences = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/users/me/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setMessage('Preferences updated successfully!');
      } else {
        setMessage('Failed to update preferences');
      }
    } catch (error) {
      setMessage('Error updating preferences');
    } finally {
      setLoading(false);
    }
  };

  const addSearchTerm = async () => {
    if (!newSearchTerm.trim()) return;

    const updatedPreferences = {
      ...preferences,
      search_history: [
        ...(preferences.search_history || []),
        newSearchTerm.trim()
      ].slice(-10) // Keep only last 10 searches
    };

    setPreferences(updatedPreferences);
    setNewSearchTerm('');
  };

  const removeSearchTerm = (index: number) => {
    const updatedPreferences = {
      ...preferences,
      search_history: preferences.search_history?.filter((_, i) => i !== index) || []
    };
    setPreferences(updatedPreferences);
  };

  const clearSearchHistory = () => {
    const updatedPreferences = {
      ...preferences,
      search_history: []
    };
    setPreferences(updatedPreferences);
  };

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">User Profile</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('success') 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{profile.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{profile.name || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Avatar</label>
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-full mt-2"
                  />
                ) : (
                  <p className="text-gray-500">No avatar set</p>
                )}
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* User Preferences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={preferences.theme || 'light'}
                onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as 'light' | 'dark' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.notifications || false}
                  onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Enable Notifications</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favorite Brands (comma-separated)
              </label>
              <input
                type="text"
                value={preferences.favorite_brands?.join(', ') || ''}
                onChange={(e) => setPreferences({ 
                  ...preferences, 
                  favorite_brands: e.target.value.split(',').map(brand => brand.trim()).filter(Boolean)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Apple, Samsung, Sony"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Price
                </label>
                <input
                  type="number"
                  value={preferences.price_range?.min || ''}
                  onChange={(e) => setPreferences({ 
                    ...preferences, 
                    price_range: { 
                      ...preferences.price_range, 
                      min: parseFloat(e.target.value) || 0 
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  value={preferences.price_range?.max || ''}
                  onChange={(e) => setPreferences({ 
                    ...preferences, 
                    price_range: { 
                      ...preferences.price_range, 
                      max: parseFloat(e.target.value) || 0 
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleUpdatePreferences}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>

      {/* Search History */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Search History</h2>
        <p className="text-sm text-gray-600 mb-4">
          Your recent searches help improve product recommendations in your feed.
        </p>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSearchTerm}
              onChange={(e) => setNewSearchTerm(e.target.value)}
              placeholder="Add a search term..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyPress={(e) => e.key === 'Enter' && addSearchTerm()}
            />
            <button
              onClick={addSearchTerm}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add
            </button>
          </div>

          {preferences.search_history && preferences.search_history.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Recent Searches ({preferences.search_history.length})
                </span>
                <button
                  onClick={clearSearchHistory}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.search_history.map((term, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full"
                  >
                    <span className="text-sm text-gray-700">{term}</span>
                    <button
                      onClick={() => removeSearchTerm(index)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No search history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
} 