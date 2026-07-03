/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Wallet, IndianRupee, CreditCard, Check, AlertCircle, Sparkles } from "lucide-react";
import { BorrowRecord, BorrowStatus } from "../types.js";

interface StudentFinesProps {
  userId: string;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function StudentFines({ userId, showToast }: StudentFinesProps) {
  const [fines, setFines] = useState<BorrowRecord[]>([]);
  const [payingRecord, setPayingRecord] = useState<BorrowRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);

  const fetchFines = async () => {
    try {
      const res = await fetch("/api/borrows");
      if (res.ok) {
        const all = await res.json();
        // Filter borrows for this student with active fine balances
        const mine = all.filter((r: BorrowRecord) => r.studentId === userId && r.fineAmount > 0);
        setFines(mine);
      }
    } catch (e) {
      showToast("Error loading fine records", "error");
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const totalOutstanding = fines
    .filter(r => !r.finePaid)
    .reduce((sum, current) => sum + current.fineAmount, 0);

  const handlePayFine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRecord) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/borrows/pay/${payingRecord.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      if (res.ok) {
        showToast(`Payment of ₹${payingRecord.fineAmount} received! Fine cleared.`, "success");
        setPayingRecord(null);
        fetchFines();
      } else {
        showToast("Payment failed", "error");
      }
    } catch (err) {
      showToast("Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="student-fines-root" className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Title Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Fines & Transactions</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Review outstanding fees, browse overdue penalties (₹10/day rule), and settle invoices securely.</p>
      </div>

      {/* Hero Outstanding Panel */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        
        {/* Background ambient accent */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl"></div>

        <div className="space-y-2">
          <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
            <Wallet className="w-4 h-4" /> Live Accounts Balance
          </span>
          <p className="text-xs text-slate-400">Accumulated unpaid overdue balances on currently delayed book titles.</p>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-white">₹{totalOutstanding}.00</span>
            <span className="text-[11px] text-slate-400 font-bold uppercase">INR Outstanding</span>
          </div>
        </div>

        {totalOutstanding > 0 ? (
          <button
            onClick={() => {
              // Find the first unpaid record to initiate checkout
              const unpaid = fines.find(f => !f.finePaid);
              if (unpaid) setPayingRecord(unpaid);
            }}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-emerald-600/15 transition-all cursor-pointer active:scale-98"
          >
            Settle Balance Now
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-2xl border border-emerald-500/20">
            <Check className="w-4 h-4" /> Account in Good Standing
          </div>
        )}
      </div>

      {/* Penalities Breakdown */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Fine Invoices & History</h3>
        
        {fines.length === 0 ? (
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-xs text-slate-400 text-center">
            Excellent! You do not have any historical fine logs recorded. Keep returning books on time!
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Book Title</th>
                    <th className="p-4">Invoice Terms</th>
                    <th className="p-4">Accumulated Days Late</th>
                    <th className="p-4">Surcharges</th>
                    <th className="p-4">Settlement Status</th>
                    <th className="p-4 pr-6 text-right">Invoice Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-350">
                  {fines.map((rec) => {
                    // Compute days late roughly or read from simulated model
                    const daysLate = Math.ceil(rec.fineAmount / 10);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="p-4 pl-6 font-bold text-slate-800 dark:text-white">
                          {rec.bookTitle}
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-500">Due date was: {rec.dueDate}</p>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {daysLate} Days
                        </td>
                        <td className="p-4 font-mono font-bold text-rose-500">
                          ₹{rec.fineAmount}.00
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.finePaid
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}>
                            {rec.finePaid ? "Cleared" : "Unpaid Outstanding"}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          {!rec.finePaid ? (
                            <button
                              onClick={() => setPayingRecord(rec)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
                            >
                              Settle Fine
                            </button>
                          ) : (
                            <span className="text-slate-400 font-semibold text-[10px]">Settled Receipt</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Mock Settle Fine Checkout Popup */}
      {payingRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative text-slate-800 dark:text-slate-100">
            <button onClick={() => setPayingRecord(null)} className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mt-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <CreditCard className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-sm tracking-tight text-center">LMS Secure Payments Gateway</h3>
              <p className="text-[11px] text-slate-400 text-center mt-1">Settle outstanding late fine penalty of ₹{payingRecord.fineAmount}.00</p>

              <form onSubmit={handlePayFine} className="w-full mt-6 space-y-4">
                
                {/* Method selector */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">CHOOSE GATEWAY CHANNEL</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("upi")}
                      className={`py-2.5 rounded-xl border font-bold text-xs cursor-pointer text-center transition-all ${
                        paymentMethod === "upi"
                          ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                          : "border-slate-200 dark:border-slate-800 text-slate-500"
                      }`}
                    >
                      Instant UPI / QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`py-2.5 rounded-xl border font-bold text-xs cursor-pointer text-center transition-all ${
                        paymentMethod === "card"
                          ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                          : "border-slate-200 dark:border-slate-800 text-slate-500"
                      }`}
                    >
                      Credit / Debit Card
                    </button>
                  </div>
                </div>

                {paymentMethod === "upi" ? (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex flex-col items-center text-center">
                    {/* Fake static QR Code for fast check-out simulation */}
                    <div className="w-24 h-24 bg-white p-1 rounded-xl border border-slate-200 flex items-center justify-center">
                      <svg className="w-20 h-20 text-slate-950" viewBox="0 0 20 20">
                        <rect x="0" y="0" width="6" height="6" fill="currentColor" />
                        <rect x="1" y="1" width="4" height="4" fill="white" />
                        <rect x="2" y="2" width="2" height="2" fill="currentColor" />
                        <rect x="14" y="0" width="6" height="6" fill="currentColor" />
                        <rect x="15" y="1" width="4" height="4" fill="white" />
                        <rect x="0" y="14" width="6" height="6" fill="currentColor" />
                        <rect x="1" y="15" width="4" height="4" fill="white" />
                        <rect x="8" y="4" width="3" height="3" fill="currentColor" />
                        <rect x="14" y="14" width="6" height="6" fill="currentColor" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-2.5">UPI: ath@indianbank</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      required
                      placeholder="Cardholder Name"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-center"
                      />
                      <input
                        type="text"
                        required
                        placeholder="CVV"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-center"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayingRecord(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Processing..." : `Pay ₹${payingRecord.fineAmount}.00`}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple custom cross SVG since Lucide might have been imported differently
function X({ className, ...props }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
