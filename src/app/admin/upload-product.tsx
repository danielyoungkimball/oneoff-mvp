"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadProduct() {
  const [form, setForm] = useState({
    name: "",
    brand: "",
    price: "",
    tags: "",
    img_url: "",
    source_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          brand: form.brand,
          price: parseFloat(form.price),
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          img_url: form.img_url,
          source_url: form.source_url,
        }),
      });
      if (!res.ok) throw new Error("Failed to upload product");
      setSuccess("Product uploaded!");
      setForm({ name: "", brand: "", price: "", tags: "", img_url: "", source_url: "" });
    } catch (err: any) {
      setError(err.message || "Error uploading product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6">Upload Product (Admin)</h1>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Brand</label>
          <input
            name="brand"
            value={form.brand}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Price</label>
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Tags (comma separated)</label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Image URL</label>
          <input
            name="img_url"
            value={form.img_url}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Source URL</label>
          <input
            name="source_url"
            value={form.source_url}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        {error && <div className="mb-2 text-red-600">{error}</div>}
        {success && <div className="mb-2 text-green-600">{success}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Product"}
        </button>
      </form>
    </div>
  );
} 