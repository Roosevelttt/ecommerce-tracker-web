'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { data: session } = useSession();
  const [url, setUrl] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (session) fetchProducts();
  }, [session]);

  const fetchProducts = async () => {
    const res = await fetch("/api/track");
    const data = await res.json();
    setProducts(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    const res = await fetch("/api/track", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
    
    const data = await res.json();

    if (data.requiresConfirmation) {
        setNotification("Agent added! We sent a confirmation email to your inbox. You MUST click the link inside to start receiving alerts.");
    } else if (data.success) {
        setNotification("Agent active.");
    }

    setUrl("");
    setLoading(false);
    fetchProducts(); // refresh list
  };

  const handleUnsubscribe = async (productUrl: string) => {
    if(!confirm("Stop tracking this item?")) return;
    await fetch("/api/track", {
        method: "DELETE",
        body: JSON.stringify({ url: productUrl }),
      });
    fetchProducts();
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#191917] flex items-center justify-center text-[#FFF]">
        <button 
          onClick={() => signIn("google")}
          className="bg-[#D5FF40] text-[#191917] px-6 py-3 rounded-lg font-bold hover:opacity-90 transition"
        >
          Sign in to access Tracker
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191917] text-[#FFF] p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
            <div className="tracking-tight flex items-center text-xl md:text-2xl">
                <span className="font-bold text-white">Prisynced</span>
                <span className=" mx-2">|</span>
                <span className="text-[#D5FF40] font-bold">AUTOMATED TRACKER</span>
            </div>
          <div className="flex items-center gap-4">
            <span className="text-[#C0C2B8]">{session.user?.email}</span>
            <button onClick={() => signOut()} className="text-sm border border-[#C0C2B8] px-3 py-1 rounded hover:bg-[#C0C2B8] hover:text-[#191917]">
                Sign Out
            </button>
          </div>
        </header>

        {notification && (
            <div className="mb-6 p-4 bg-[#D5FF40] text-[#191917] font-semibold rounded-lg border border-[#D5FF40] bg-opacity-90">
                {notification}
            </div>
        )}

        <section className="mb-12">
          <form onSubmit={handleAdd} className="flex gap-4">
            <input
              type="url"
              placeholder="Paste Amazon Product URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-transparent border border-[#C0C2B8] text-white p-4 rounded-lg focus:outline-none focus:border-[#D5FF40]"
              required
            />
            <button 
              disabled={loading}
              className="bg-[#D5FF40] text-[#191917] font-bold px-8 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Adding..." : "TRACK AGENT"}
            </button>
          </form>
        </section>

        <div className="grid gap-4">
          <h2 className="text-xl font-semibold text-[#C0C2B8] mb-4">Active Agents ({products.length})</h2>
          
          {products.map((p) => (
            <div key={p.product_url} className="border border-[#333] bg-[#222] p-6 rounded-lg flex justify-between items-center">
              <div className="overflow-hidden">
                <a href={p.product_url} target="_blank" className="text-[#D5FF40] hover:underline truncate block max-w-lg">
                  {p.product_url}
                </a>
                <div className="flex gap-6 mt-2 text-sm text-[#C0C2B8]">
                    <span>Last Price: <strong className="text-white">${p.last_price || 'Pending...'}</strong></span>
                    <span>Status: <strong className={p.in_stock ? "text-green-400" : "text-red-400"}>
                        {p.in_stock ? 'In Stock' : 'Out of Stock'}
                    </strong></span>
                    <span>Last Check: {new Date(p.updated_at).toLocaleTimeString()}</span>
                </div>
              </div>
              <button 
                onClick={() => handleUnsubscribe(p.product_url)}
                className="text-red-500 text-sm hover:text-red-400"
              >
                Unsubscribe
              </button>
            </div>
          ))}
          
          {products.length === 0 && (
            <div className="text-[#C0C2B8] text-center py-10 border border-dashed border-[#333] rounded-lg">
                No active agents. Add a URL above to start tracking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}