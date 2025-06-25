'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';

export default function UserProfile() {
  const { user, profile, updateProfile } = useAuth();
  console.log(user);
  const [name, setName] = useState(profile?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [preferences, setPreferences] = useState<string[]>(profile?.preferences || []);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  

  useEffect(() => {
    setName(profile?.name || '');
    setAvatarUrl(profile?.avatar_url || '');
    setPreferences(profile?.preferences || []);
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    setSuccess('');
    try {
      if (!user?.id || !user?.email || !user?.created_at || !user?.updated_at) {
        throw new Error('Missing required user data');
      }
      await updateProfile({ 
        id: user.id,
        email: user.email, 
        created_at: user.created_at,
        updated_at: user.updated_at,
        name,
        avatar_url: avatarUrl,
        preferences 
      });
      setSuccess('Profile updated!');
    } catch {
      setSuccess('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">User Profile</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-6">
          {avatarUrl ? (
            <div className="relative w-16 h-16 mr-4">
              <Image
                src={avatarUrl}
                alt={name}
                fill
                className="rounded-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gray-300 rounded-full mr-4 flex items-center justify-center">
              <span className="text-2xl text-gray-600">{name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xl font-semibold border-b border-gray-300 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Avatar URL"
              className="block mt-2 text-sm border-b border-gray-300 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-2">Preferences (comma separated)</label>
          <input
            type="text"
            value={preferences.join(', ')}
            onChange={(e) => setPreferences(e.target.value.split(',').map((p) => p.trim()).filter(Boolean))}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        {success && <div className="mb-2 text-green-600">{success}</div>}
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
} 