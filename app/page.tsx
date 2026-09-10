"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Wallet } from "lucide-react";
import { User } from "@supabase/supabase-js";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin w-8 h-8 text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <h1 className="font-bold text-gray-900 text-lg">Kasbon</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline-block">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors font-medium"
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat datang di Kasbon!</h2>
          <p className="text-gray-500">
            Anda telah berhasil login. Fitur dashboard utang-piutang akan dibuat pada tahap selanjutnya.
          </p>
        </div>
      </div>
    </div>
  );
}
