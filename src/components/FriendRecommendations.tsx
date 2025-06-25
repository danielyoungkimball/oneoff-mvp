'use client';

import { useState, useEffect } from 'react';
import { FriendRecWithDetails, FriendRecsResponse } from '../types/friendRecs';

export default function FriendRecommendations() {
  const [recommendations, setRecommendations] = useState<FriendRecsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [activeTab]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/friend-recs?type=${activeTab}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteRecommendation = async (id: string) => {
    try {
      const response = await fetch(`/api/friend-recs/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRecommendations();
      } else {
        throw new Error('Failed to delete recommendation');
      }
    } catch (error) {
      console.error('Error deleting recommendation:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Friend Recommendations</h1>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'received'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Received ({recommendations?.total || 0})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sent ({recommendations?.total || 0})
          </button>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="bg-white rounded-lg shadow">
        {!recommendations || recommendations.recommendations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              {activeTab === 'received' ? (
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              ) : (
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} recommendations
            </h3>
            <p className="text-gray-500">
              {activeTab === 'received' 
                ? "When friends share products with you, they'll appear here."
                : "Share products with friends to see your sent recommendations here."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {recommendations.recommendations.map((rec) => (
              <div key={rec.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* User Info */}
                    <div className="flex items-center mb-3">
                      {activeTab === 'received' ? (
                        <>
                          {rec.sender.avatar_url ? (
                            <img
                              src={rec.sender.avatar_url}
                              alt={rec.sender.name}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                              <span className="text-sm text-gray-600">
                                {rec.sender.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {rec.sender.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              shared with you {new Date(rec.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          {rec.receiver.avatar_url ? (
                            <img
                              src={rec.receiver.avatar_url}
                              alt={rec.receiver.name}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                              <span className="text-sm text-gray-600">
                                {rec.receiver.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {rec.receiver.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(rec.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Message */}
                    {rec.message && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-700 italic">"{rec.message}"</p>
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="flex items-center space-x-4">
                      {rec.product.img_url && (
                        <img
                          src={rec.product.img_url}
                          alt={rec.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{rec.product.name}</h3>
                        {rec.product.brand && (
                          <p className="text-gray-600 text-sm">{rec.product.brand}</p>
                        )}
                        {rec.product.price && (
                          <p className="text-green-600 font-semibold">
                            ${rec.product.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      {rec.product.source_url && (
                        <a
                          href={rec.product.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                        >
                          View Product
                        </a>
                      )}
                      {activeTab === 'sent' && (
                        <button
                          onClick={() => deleteRecommendation(rec.id)}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 