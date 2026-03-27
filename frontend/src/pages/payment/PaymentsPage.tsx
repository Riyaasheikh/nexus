import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, History, Loader2, Plus, Send } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { BadgeVariant } from '../../components/ui/Badge';
import { DepositModal } from '../../components/payments/DepositModal';
import axios from 'axios';

// ✅ Must match AuthContext.tsx exactly
const TOKEN_KEY = 'business_nexus_token';
const USER_STORAGE_KEY = 'business_nexus_user';

const getTransactionVariant = (status: string): BadgeVariant =>
  status === 'completed' ? 'success' : 'warning';

export const PaymentsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // ✅ Role now read from the correct key (stored as JSON object by AuthContext)
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  const userRole = storedUser ? JSON.parse(storedUser).role : null;

  const API_BASE =import.meta.env.VITE_API_BASE_URL|| 'http://127.0.0.1:8000';

  // ✅ Single helper so every request uses the right token key
  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/payments`, {
        headers: authHeaders()
      });
      setTransactions(res.data);

      const total = res.data.reduce((acc: number, curr: any) =>
        curr.status === 'completed' ? acc + Number(curr.amount) : acc, 0
      );
      setBalance(total);
    } catch (err) {
      console.error("Payment fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleTransfer = async () => {
    const startupId = prompt("Enter the Startup/User ID you wish to fund:");
    const amount = prompt("Enter investment amount ($):");

    if (!startupId || !amount || isNaN(Number(amount))) return;

    try {
      await axios.post(`${API_BASE}/api/payments/transfer`, {
        receiver_id: startupId,
        amount: amount
      }, { headers: authHeaders() });
      alert("🚀 Investment Sent! Handshake complete.");
      fetchPayments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Transfer failed. Check your balance.");
    }
  };

  const handleWithdraw = async () => {
    const amount = prompt("Enter amount to withdraw to bank:");
    if (!amount || isNaN(Number(amount)) || Number(amount) > balance) {
      alert("Invalid amount or insufficient funds.");
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/payments/withdraw`, { amount }, {
        headers: authHeaders()
      });
      alert("✅ Withdrawal processed.");
      fetchPayments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Withdrawal failed.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6">

      {/* ✅ DepositModal now gets the token via TOKEN_KEY inside it */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={fetchPayments}
      />

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Hub</h1>
          <p className="text-gray-600 text-sm">Manage your startup capital and investments</p>
        </div>
        <Badge variant="secondary" className="text-indigo-600 bg-indigo-50 border-indigo-200">
          Role: {userRole?.toUpperCase() ?? 'GUEST'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Card */}
        <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl border-none">
          <CardBody className="flex flex-col justify-between h-48 p-6">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Wallet size={28} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Nexus Secure Wallet</p>
                <p className="text-xs font-medium">**** **** **** 2026</p>
              </div>
            </div>
            <div>
              <p className="text-4xl font-black tracking-tight">
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm opacity-80 mt-1 font-medium italic">Available Liquidity</p>
            </div>
          </CardBody>
        </Card>

        {/* Action Buttons */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <Button
            onClick={() => setShowDepositModal(true)}
            className="h-full flex flex-col items-center justify-center gap-3 py-8 text-lg rounded-2xl shadow-sm hover:shadow-indigo-200"
            leftIcon={<Plus size={24} />}
          >
            Deposit Funds
          </Button>

          {userRole === 'investor' ? (
            <Button
              onClick={handleTransfer}
              
              className="h-full  flex flex-col items-center justify-center gap-3 py-8 text-lg rounded-2xl shadow-sm hover:shadow-indigo-200"
              leftIcon={<Send size={24} />}
            >
              Transfer / Invest
            </Button>
          ) : (
            <Button
              onClick={handleWithdraw}
              variant="outline"
              className="h-full flex flex-col items-center justify-center gap-3 py-8 text-lg rounded-2xl border-2"
              leftIcon={<ArrowUpRight size={24} />}
            >
              Withdraw
            </Button>
          )}
        </div>
      </div>

      {/* Transaction Ledger */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardBody className="p-0">
          <div className="p-6 border-b flex items-center justify-between bg-white">
            <div className="flex items-center gap-2 text-gray-900 font-bold">
              <History size={20} className="text-indigo-600" />
              <h3>Transaction History</h3>
            </div>
            <button onClick={fetchPayments} className="text-xs text-indigo-600 hover:underline">
              Refresh Ledger
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
              <p className="text-gray-400 text-sm animate-pulse">Synchronizing with Stripe Sandbox...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-500 text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">Transaction Type</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${Number(t.amount) > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {Number(t.amount) > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 capitalize">{t.type}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{t.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-bold ${Number(t.amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Number(t.amount) > 0 ? '+' : ''}{Number(t.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={getTransactionVariant(t.status)}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-gray-500 font-medium">
                        {new Date(t.created_at).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <History className="mx-auto mb-4 opacity-10" size={64} />
              <p className="font-medium">No financial activity found in this account.</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
