"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import { formatRupiah, formatRelativeDate } from "@/app/lib/utils";
import { Debt, DebtFormData, DebtType } from "@/app/types/debt";
import { 
  Loader2, LogOut, Wallet, Plus, Edit2, 
  Trash2, CheckCircle2, X, AlertCircle 
} from "lucide-react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtsLoading, setDebtsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<"all" | "unsettled" | "settled">("all");
  const [filterType, setFilterType] = useState<"all" | "owed_to_me" | "i_owe">("all");

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<DebtFormData>({
    type: "owed_to_me",
    counterpart_name: "",
    amount: "",
    due_date: new Date().toISOString().split("T")[0],
    note: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Auth check
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
  }, [router, supabase]);

  // Fetch Debts
  const fetchDebts = async () => {
    setDebtsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterType !== "all") params.append("type", filterType);

      const res = await fetch(`/api/debts?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Gagal mengambil data");
      setDebts(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setDebtsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDebts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filterStatus, filterType]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Summaries
  const summary = useMemo(() => {
    let owedToMe = 0;
    let iOwe = 0;
    debts.forEach(d => {
      if (!d.settled_at) { // Only calculate unsettled
        if (d.type === "owed_to_me") owedToMe += d.amount;
        else if (d.type === "i_owe") iOwe += d.amount;
      }
    });
    return {
      owedToMe,
      iOwe,
      net: owedToMe - iOwe
    };
  }, [debts]);

  // Handlers
  const handleOpenForm = (debt?: Debt) => {
    if (debt) {
      setEditingId(debt.id);
      setFormData({
        type: debt.type,
        counterpart_name: debt.counterpart_name,
        amount: debt.amount,
        due_date: debt.due_date || new Date().toISOString().split("T")[0],
        note: debt.note || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        type: "owed_to_me",
        counterpart_name: "",
        amount: "",
        due_date: new Date().toISOString().split("T")[0],
        note: ""
      });
    }
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    const payload = {
      ...formData,
      amount: Number(formData.amount),
      due_date: formData.due_date || null
    };

    try {
      const url = editingId ? `/api/debts/${editingId}` : "/api/debts";
      const method = editingId ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan data");
      
      setIsFormOpen(false);
      fetchDebts();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setFormLoading(false);
    }
  };

  const handleMarkSettled = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/debts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settled_at: new Date().toISOString() })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menandai lunas");
      fetchDebts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/debts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal menghapus data");
      }
      setDeleteConfirmId(null);
      fetchDebts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin w-8 h-8 text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <h1 className="font-bold text-gray-900 text-lg sm:text-xl">Kasbon</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors font-medium"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total dihutang ke saya</h3>
            <p className="text-2xl font-bold text-gray-900">{formatRupiah(summary.owedToMe)}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total saya hutang</h3>
            <p className="text-2xl font-bold text-gray-900">{formatRupiah(summary.iOwe)}</p>
          </div>
          <div className={`p-6 rounded-2xl shadow-sm border ${summary.net >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <h3 className={`text-sm font-medium mb-2 ${summary.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net</h3>
            <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {summary.net > 0 ? "+" : ""}{formatRupiah(summary.net)}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Semua Status</option>
                <option value="unsettled">Belum Lunas</option>
                <option value="settled">Lunas</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Semua Tipe</option>
                <option value="owed_to_me">Diutang</option>
                <option value="i_owe">Saya hutang</option>
              </select>
            </div>
            <button
              onClick={() => handleOpenForm()}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              <Plus size={16} />
              Catat baru
            </button>
          </div>

          <div className="p-0">
            {error ? (
              <div className="p-6 text-center text-red-600 bg-red-50 m-4 rounded-xl border border-red-100">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                {error}
              </div>
            ) : debtsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="animate-spin w-8 h-8 text-green-600 mb-2" />
                <p className="text-sm">Memuat data...</p>
              </div>
            ) : debts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
                  <Wallet size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada catatan</h3>
                <p className="text-gray-500 text-sm max-w-sm mb-6">Anda belum memiliki catatan utang atau piutang. Silakan tambah catatan baru.</p>
                <button
                  onClick={() => handleOpenForm()}
                  className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  <Plus size={16} />
                  Catat baru
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {debts.map((debt) => (
                  <li key={debt.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          debt.type === 'owed_to_me' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {debt.type === 'owed_to_me' ? 'Diutang' : 'Saya hutang'}
                        </span>
                        {debt.settled_at ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Lunas
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            Belum lunas
                          </span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto sm:ml-0">
                          {formatRelativeDate(debt.created_at)}
                        </span>
                      </div>
                      <h4 className="text-base font-medium text-gray-900">{debt.counterpart_name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {debt.note || <span className="italic text-gray-400">Tidak ada catatan</span>}
                      </p>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:gap-2">
                      <span className={`text-lg font-bold ${
                        debt.type === 'owed_to_me' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatRupiah(debt.amount)}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {!debt.settled_at && (
                          <button
                            onClick={() => handleMarkSettled(debt.id)}
                            disabled={actionLoadingId === debt.id}
                            className="text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                          >
                            {actionLoadingId === debt.id ? 'Loading...' : 'Tandai lunas'}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleOpenForm(debt)}
                          disabled={actionLoadingId === debt.id}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        
                        {deleteConfirmId === debt.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(debt.id)}
                              disabled={actionLoadingId === debt.id}
                              className="text-xs font-medium bg-red-600 text-white px-2 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                              Yakin?
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={actionLoadingId === debt.id}
                              className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1.5 rounded-md hover:bg-gray-300 disabled:opacity-50"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(debt.id)}
                            disabled={actionLoadingId === debt.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Catatan" : "Catat Baru"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitForm} className="p-4 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                  {formError}
                </div>
              )}

              <div className="flex gap-4">
                <label className="flex-1 flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                  <input
                    type="radio"
                    name="type"
                    value="owed_to_me"
                    checked={formData.type === "owed_to_me"}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Saya dihutang</span>
                </label>
                <label className="flex-1 flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                  <input
                    type="radio"
                    name="type"
                    value="i_owe"
                    checked={formData.type === "i_owe"}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Saya hutang</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Orang</label>
                <input
                  type="text"
                  required
                  value={formData.counterpart_name}
                  onChange={(e) => setFormData({ ...formData, counterpart_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="Misal: Budi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
                <textarea
                  maxLength={200}
                  rows={3}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                  placeholder="Maksimal 200 karakter"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={formLoading}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70 flex items-center justify-center"
                >
                  {formLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
