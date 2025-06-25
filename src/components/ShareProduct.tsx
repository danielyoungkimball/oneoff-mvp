'use client';

import { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { CreateFriendRecInput } from '../types/friendRecs';

interface ShareProductProps {
  product: Product;
  onClose: () => void;
  onSuccess?: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export default function ShareProduct({ product, onClose, onSuccess }: ShareProductProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/search');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      fetchUsers();
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user to share with');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const promises = selectedUsers.map(userId => {
        const shareData: CreateFriendRecInput = {
          receiver_id: userId,
          product_id: product.id,
          message: message.trim() || undefined,
        };

        return fetch('/api/friend-recs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(shareData),
        });
      });

      const responses = await Promise.all(promises);
      const failedResponses = responses.filter(response => !response.ok);

      if (failedResponses.length > 0) {
        throw new Error('Some shares failed');
      }

      setSuccess(`Successfully shared with ${selectedUsers.length} user(s)!`);
      setSelectedUsers([]);
      setMessage('');
      
      if (onSuccess) {
        onSuccess();
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setError('Failed to share product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Share Product</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Product Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
            {product.brand && (
              <p className="text-gray-600 text-sm mb-2">{product.brand}</p>
            )}
            {product.price && (
              <p className="text-green-600 font-semibold">${product.price.toFixed(2)}</p>
            )}
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/500 characters
            </p>
          </div>

          {/* User Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Users to Share With
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search users by name or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            />

            {/* User List */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
              {users.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No users found
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedUsers.includes(user.id) ? 'bg-indigo-50' : ''
                    }`}
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="mr-3"
                    />
                    <div className="flex items-center flex-1">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                          <span className="text-sm text-gray-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={loading || selectedUsers.length === 0}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sharing...' : `Share with ${selectedUsers.length} user(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 