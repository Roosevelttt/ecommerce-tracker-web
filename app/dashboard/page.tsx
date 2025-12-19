'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { data: session } = useSession();
  const [url, setUrl] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authError, setAuthError] = useState("");

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
        setNotification("Agent added! Check your email to confirm alerts.");
    } else if (data.success) {
        setNotification("Agent active.");
    }

    setUrl("");
    setLoading(false);
    fetchProducts();
  };

  const handleUnsubscribe = async (productUrl: string) => {
    if(!confirm("Stop tracking this item?")) return;
    await fetch("/api/track", {
        method: "DELETE",
        body: JSON.stringify({ url: productUrl }),
      });
    fetchProducts();
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);

    if (isRegistering) {
        const res = await fetch("/api/register", {
            method: "POST",
            body: JSON.stringify({ email: authEmail, password: authPass }),
        });
        
        if (res.ok) {
            const result = await signIn("credentials", {
                redirect: false,
                email: authEmail,
                password: authPass
            });
            if (result?.error) setAuthError("Registration successful, but failed to auto-login.");
        } else {
            const data = await res.json();
            setAuthError(data.error || "Registration failed");
        }
    } else {
        const result = await signIn("credentials", {
            redirect: false,
            email: authEmail,
            password: authPass
        });
        if (result?.error) {
            setAuthError("Invalid email or password");
        }
    }
    setLoading(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#191917] flex items-center justify-center text-[#FFF] p-4">
        <div className="w-full max-w-md bg-[#222] border border-[#333] p-8 rounded-xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center">
                {isRegistering ? "Create Account" : "Welcome Back"}
            </h2>

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                <input 
                    type="email" 
                    placeholder="Email" 
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="bg-[#191917] border border-[#333] p-3 rounded text-white focus:border-[#D5FF40] outline-none"
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    required
                    value={authPass}
                    onChange={(e) => setAuthPass(e.target.value)}
                    className="bg-[#191917] border border-[#333] p-3 rounded text-white focus:border-[#D5FF40] outline-none"
                />
                
                {authError && <p className="text-red-400 text-sm">{authError}</p>}

                <button 
                    disabled={loading}
                    className="bg-[#D5FF40] text-[#191917] font-bold py-3 rounded hover:opacity-90 mt-2"
                >
                    {loading ? "Processing..." : (isRegistering ? "Sign Up" : "Sign In")}
                </button>
            </form>

            <div className="my-6 flex items-center gap-4">
                <div className="h-1 bg-[#333] flex-1"></div>
                <span className="text-[#666] text-sm">OR</span>
                <div className="h-1 bg-[#333] flex-1"></div>
            </div>

            <button 
                onClick={() => signIn("google")}
                className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
                <span className="font-serif font-bold text-xl">G</span> 
                Continue with Google
            </button>

            <p className="mt-6 text-center text-[#666] text-sm">
                {isRegistering ? "Already have an account?" : "Don't have an account?"}
                <button 
                    onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); }}
                    className="ml-2 text-[#D5FF40] hover:underline"
                >
                    {isRegistering ? "Sign In" : "Sign Up"}
                </button>
            </p>
        </div>
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