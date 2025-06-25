'use client';

import { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { UserPreferences } from '../types/db';

interface FeedResponse {
  products: Product[];
  userPreferences: UserPreferences;
  total: number;
}

export default function Feed() {
  const [feedData, setFeedData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/feed');
      
      if (!response.ok) {
        throw new Error('Failed to fetch feed');
      }

      const data = await response.json();
      setFeedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshFeed = () => {
    fetchFeed();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading personalized recommendations...</p>
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
            onClick={refreshFeed}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!feedData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center text-gray-500">No feed data available</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Your Personalized Feed</h1>
          <button
            onClick={refreshFeed}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>
        
        {/* User Preferences Summary */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Based on Your Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Theme:</span>
              <span className="ml-2 text-gray-600 capitalize">
                {feedData.userPreferences.theme || 'light'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Favorite Brands:</span>
              <span className="ml-2 text-gray-600">
                {feedData.userPreferences.favorite_brands?.length 
                  ? feedData.userPreferences.favorite_brands.join(', ')
                  : 'None set'
                }
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Price Range:</span>
              <span className="ml-2 text-gray-600">
                {feedData.userPreferences.price_range?.min && feedData.userPreferences.price_range?.max
                  ? `$${feedData.userPreferences.price_range.min} - $${feedData.userPreferences.price_range.max}`
                  : 'Not set'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Recommended for You ({feedData.total} products)
        </h2>
        
        {feedData.products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              No personalized recommendations available yet.
            </p>
            <p className="text-sm text-gray-400">
              Try updating your preferences in your profile to get better recommendations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedData.products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                {product.img_url && (
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                    <img
                      src={product.img_url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-2">
                    {product.brand}
                  </p>
                  
                  {product.price && (
                    <p className="text-green-600 font-semibold text-lg mb-3">
                      ${product.price.toFixed(2)}
                    </p>
                  )}
                  
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {product.source_url && (
                      <a
                        href={product.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 bg-indigo-600 text-white text-center text-sm rounded-md hover:bg-indigo-700"
                      >
                        View Product
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feed Info */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="mb-2">
          <strong>How it works:</strong> This feed uses your preferences and search history to find products that match your style and interests.
        </p>
        <p>
          Recommendations are based on your favorite brands, price range, and recent searches using AI-powered vector similarity.
        </p>
      </div>
    </div>
  );
} 