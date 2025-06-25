"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Product } from "../../types/product";
import { FriendRecWithDetails } from "../../types/friendRecs";

interface FeedItem {
  id: string;
  product: Product;
  recSource: string;
}

export default function FeedPage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      // Fetch personalized feed (with rec source info)
      const response = await fetch("/api/feed");
      const data = await response.json();
      // Assume API returns: { products: Product[], recommendations?: FriendRecWithDetails[] }
      let items: FeedItem[] = [];
      if (data.recommendations && data.recommendations.length > 0) {
        // Show friend recs first
        items = data.recommendations.map((rec: FriendRecWithDetails) => ({
          id: rec.id,
          product: rec.product,
          recSource: `Recommended by ${rec.sender?.name || "a friend"}`,
        }));
      }
      // Add fallback products (from AI feed)
      if (data.products && data.products.length > 0) {
        items = items.concat(
          data.products.map((p: Product) => ({
            id: p.id,
            product: p,
            recSource: "AI Recommendation",
          }))
        );
      }
      setFeed(items);
    } catch {
      setFeed([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (product: Product) => {
    // TODO: Implement save logic
    alert(`Saved: ${product.name}`);
  };

  const handleBuy = (product: Product) => {
    // TODO: Implement buy/checkout logic
    alert(`Buy Now: ${product.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center">
      <div className="w-full max-w-md mx-auto flex-1 overflow-y-scroll snap-y snap-mandatory" style={{ height: "100vh" }}>
        {loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-screen text-gray-400">
            <span className="text-2xl mb-2">No recommendations yet</span>
            <span className="text-sm">Try updating your preferences or adding products</span>
          </div>
        ) : (
          feed.map((item) => (
            <div
              key={item.id}
              className="relative snap-center flex flex-col justify-center items-center min-h-screen py-8 px-2"
              style={{ scrollSnapAlign: "center" }}
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col items-center">
                {/* Product Image */}
                {item.product.img_url ? (
                  <div className="relative w-full h-80">
                    <Image
                      src={item.product.img_url}
                      alt={item.product.name}
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                ) : (
                  <div className="w-full h-80 bg-gray-200 flex items-center justify-center text-4xl text-gray-400">
                    🛒
                  </div>
                )}
                {/* Info */}
                <div className="p-6 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900">{item.product.brand || "Brand"}</span>
                    <span className="text-lg font-semibold text-green-600">${item.product.price?.toFixed(2) || "-"}</span>
                  </div>
                  <div className="text-xl font-semibold text-gray-800 mb-2">{item.product.name}</div>
                  <div className="text-sm text-gray-500 mb-4">{item.recSource}</div>
                </div>
                {/* Floating Buttons */}
                <div className="absolute bottom-10 right-8 flex flex-col gap-4 z-10">
                  <button
                    onClick={() => handleSave(item.product)}
                    className="bg-white shadow-lg rounded-full p-4 hover:bg-indigo-100 transition border border-gray-200"
                  >
                    <span className="sr-only">Save</span>
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleBuy(item.product)}
                    className="bg-indigo-600 shadow-lg rounded-full p-4 hover:bg-indigo-700 transition text-white border-2 border-white"
                  >
                    <span className="sr-only">Buy Now</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m13-9l2 9m-5-9V6a2 2 0 10-4 0v3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 