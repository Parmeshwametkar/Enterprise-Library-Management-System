/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { History, Calendar, Check, RefreshCw, AlertCircle, Bookmark } from "lucide-react";
import { BorrowRecord, BorrowStatus } from "../types.js";

interface StudentBorrowedProps {
  userId: string;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function StudentBorrowed({ userId, showToast }: StudentBorrowedProps) {
  const [records, setRecords] = useState<BorrowRecord[]>([]);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/borrows");
      if (res.ok) {
        const all = await res.json();
        // Filter borrows belonging to this student
        const mine = all.filter((r: BorrowRecord) => r.studentId === userId);
        setRecords(mine);
      }
    } catch (e) {
      showToast("Error fetching borrow record history", "error");
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleReturn = async (id: string) => {
    try {
      const res = await fetch(`/api/borrows/return/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        showToast("Book returned successfully! Restocking catalog copy...", "success");
        fetchRecords();
      } else {
        showToast("Return operation failed", "error");
      }
    } catch (e) {
      showToast("Server connection error", "error");
    }
  };

  const handleRenew = async (id: string) => {
    try {
      const res = await fetch(`/api/borrows/renew/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        showToast("Lease terms renewed for 14 additional days!", "success");
        fetchRecords();
      } else {
        showToast("Lease renewal failed", "error");
      }
    } catch (e) {
      showToast("Server error", "error");
    }
  };

  const activeLeases = records.filter(r => r.status !== BorrowStatus.RETURNED);
  const historicLeases = records.filter(r => r.status === BorrowStatus.RETURNED);

  return (
    <div id="student-borrowed-root" className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Title Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">My Library Borrowings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Track current book leases, check upcoming due dates, prevent overdue charges, and review borrow history.</p>
      </div>

      {/* Active Borrowing Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Bookmark className="w-4.5 h-4.5 text-emerald-500" /> Active Books Issued ({activeLeases.length})
        </h3>

        {activeLeases.length === 0 ? (
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-xs text-slate-400 text-center">
            You do not have any active books issued. Visited the global catalog to search and borrow!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeLeases.map((rec) => {
              const isOverdue = rec.status === BorrowStatus.OVERDUE;
              return (
                <div
                  key={rec.id}
                  className={`bg-white dark:bg-slate-900 border p-6 rounded-2xl shadow-sm flex gap-4 items-start justify-between relative overflow-hidden transition-all ${
                    isOverdue
                      ? "border-red-200 dark:border-red-950/40 bg-red-500/5"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  
                  {/* Decorative warning accent for overdue */}
                  {isOverdue && (
                    <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
                  )}

                  <div className="flex gap-4 items-start min-w-0">
                    <img
                      src={rec.bookCover || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400"}
                      alt={rec.bookTitle}
                      className="w-12 h-16 rounded object-cover border border-slate-100 dark:border-slate-800 shrink-0 shadow-sm"
                    />
                    <div className="min-w-0 space-y-1.5">
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-xs truncate leading-snug">{rec.bookTitle}</h4>
                      
                      <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <p className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Issued: {rec.issueDate}</p>
                        <p className={`flex items-center gap-1 font-bold ${isOverdue ? "text-red-500" : "text-emerald-500"}`}>
                          <AlertCircle className="w-3.5 h-3.5" /> Due date: {rec.dueDate}
                        </p>
                      </div>

                      {rec.fineAmount > 0 && (
                        <span className="inline-block px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-lg font-mono">
                          Late Fine: ₹{rec.fineAmount} accrued
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Return / Renew operations */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleReturn(rec.id)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] shadow-sm transition-all cursor-pointer active:scale-98"
                    >
                      Self Return
                    </button>
                    <button
                      onClick={() => handleRenew(rec.id)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-[10px] transition-all cursor-pointer"
                    >
                      Renew Term
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lending history list */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-4.5 h-4.5 text-slate-400" /> My Historical Returns & Leases ({historicLeases.length})
        </h3>

        {historicLeases.length === 0 ? (
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-xs text-slate-400 text-center">
            No completed lending transactions on file.
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Book Title</th>
                    <th className="p-4">Issue Date</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Returned On</th>
                    <th className="p-4 pr-6 text-right">Fines Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-350">
                  {historicLeases.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-800 dark:text-white truncate max-w-xs">
                        {rec.bookTitle}
                      </td>
                      <td className="p-4 font-mono">{rec.issueDate}</td>
                      <td className="p-4 font-mono text-slate-400">{rec.dueDate}</td>
                      <td className="p-4 font-mono font-bold text-emerald-500">{rec.returnDate}</td>
                      <td className="p-4 pr-6 text-right font-mono font-bold text-slate-500">
                        {rec.fineAmount > 0 ? `₹${rec.fineAmount}.00` : "₹0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
