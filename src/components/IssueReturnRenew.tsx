/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Plus, Check, RefreshCw, X, ReceiptText, ClipboardList, UserCheck, BookOpen, AlertCircle, Printer } from "lucide-react";
import { BorrowRecord, User, Book, BorrowStatus } from "../types.js";

interface IssueReturnRenewProps {
  userId: string;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function IssueReturnRenew({ userId, showToast }: IssueReturnRenewProps) {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  // Form states for Issuance
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [issueDays, setIssueDays] = useState(14);
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal State
  const [showReceipt, setShowReceipt] = useState<BorrowRecord | null>(null);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/borrows");
      if (res.ok) setRecords(await res.json());
    } catch (e) {
      showToast("Error loading borrow registers", "error");
    }
  };

  const fetchStudentsAndBooks = async () => {
    try {
      const [stuRes, bookRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/books")
      ]);
      if (stuRes.ok) {
        const stuList = await stuRes.json();
        setStudents(stuList.filter((s: User) => s.status === "ACTIVE"));
      }
      if (bookRes.ok) {
        const catalog = await bookRes.json();
        setBooks(catalog.books);
      }
    } catch (e) {
      console.error("Failed to fetch selectors", e);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchStudentsAndBooks();
  }, []);

  // Handle book issue
  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedBookId) {
      showToast("Please choose student and book candidates.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/borrows/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          bookId: selectedBookId,
          issueDays,
          userId
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Book issued successfully!", "success");
        setShowIssueModal(false);
        fetchRecords();
        fetchStudentsAndBooks(); // sync books stock counts
      } else {
        showToast(data.message || "Failed to issue book", "error");
      }
    } catch (err) {
      showToast("Server connection error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle return
  const handleReturnBook = async (id: string) => {
    if (!window.confirm("Verify physical return of book copy and calculate final overdue charges?")) return;
    try {
      const res = await fetch(`/api/borrows/return/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      if (res.ok) {
        showToast("Book returned and inventory restocked successfully!", "success");
        fetchRecords();
        fetchStudentsAndBooks();
      } else {
        showToast("Failed to record return", "error");
      }
    } catch (e) {
      showToast("Server error", "error");
    }
  };

  // Handle renew
  const handleRenewBook = async (id: string) => {
    if (!window.confirm("Renew book lease for an additional 14 days?")) return;
    try {
      const res = await fetch(`/api/borrows/renew/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      if (res.ok) {
        showToast("Lease extended successfully. Due date pushed by 14 days.", "success");
        fetchRecords();
      } else {
        showToast("Failed to renew lease", "error");
      }
    } catch (e) {
      showToast("Server error", "error");
    }
  };

  // Trigger print receipt
  const handlePrintReceipt = (record: BorrowRecord) => {
    setShowReceipt(record);
  };

  return (
    <div id="issue-return-root" className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Lending & Borrow Operations</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Issue books, track active borrow terms, calculate overdue fine receipts, and renew leases.</p>
        </div>
        <button
          onClick={() => {
            fetchStudentsAndBooks();
            setSelectedStudentId(students[0]?.id || "");
            setSelectedBookId(books.filter(b => b.availableCopies > 0)[0]?.id || "");
            setIssueDays(14);
            setShowIssueModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-98 shrink-0"
        >
          <Plus className="w-4 h-4" /> Issue Book Copy
        </button>
      </div>

      {/* Borrowing Grid Registers */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-emerald-500" />
          <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Lending Transaction Registry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Issued Book Details</th>
                <th className="p-4">Borrowing Student</th>
                <th className="p-4">Dates (Issue &gt; Due)</th>
                <th className="p-4">Return Timestamp</th>
                <th className="p-4">Status & Fine</th>
                <th className="p-4 pr-6 text-right">Circulation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No borrowing records found.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 pl-6 flex gap-3.5 items-center max-w-xs">
                      {rec.bookCover && (
                        <img src={rec.bookCover} alt={rec.bookTitle} className="w-9 h-12 rounded object-cover border border-slate-100 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-white truncate">{rec.bookTitle}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Record: {rec.id}</p>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-700 dark:text-slate-300">{rec.studentName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{rec.studentEmail}</p>
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-slate-600 dark:text-slate-300">Issue: {rec.issueDate}</p>
                      <p className="text-[10px] text-red-500 font-bold mt-0.5">Due: {rec.dueDate}</p>
                    </td>

                    <td className="p-4">
                      {rec.returnDate ? (
                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium rounded">
                          {rec.returnDate}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Outstanding</span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="space-y-1.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === BorrowStatus.RETURNED
                            ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            : rec.status === BorrowStatus.OVERDUE
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        }`}>
                          {rec.status}
                        </span>

                        {rec.fineAmount > 0 && (
                          <p className="text-[10px] text-red-500 font-bold font-mono">
                            Fine: ₹{rec.fineAmount} {rec.finePaid ? "(Paid)" : "(Unpaid)"}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="p-4 pr-6 text-right space-x-1.5 whitespace-nowrap">
                      {rec.status !== BorrowStatus.RETURNED ? (
                        <>
                          <button
                            onClick={() => handleReturnBook(rec.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                            title="Complete Return"
                          >
                            <Check className="w-3 h-3" /> Return
                          </button>
                          <button
                            onClick={() => handleRenewBook(rec.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-600 dark:text-blue-400 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                            title="Renew lease term (+14 days)"
                          >
                            <RefreshCw className="w-3 h-3" /> Renew
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handlePrintReceipt(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                          title="Generate Receipt"
                        >
                          <ReceiptText className="w-3.5 h-3.5" /> Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Book Modal Overlay */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button onClick={() => setShowIssueModal(false)} className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-4">
              Issue Book copy to Student
            </h3>

            {students.length === 0 ? (
              <div className="text-center p-4 bg-amber-50/40 rounded-xl border border-amber-100 text-xs text-amber-700 flex gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                No active approved students found in the registry to borrow. Please register a student account first.
              </div>
            ) : (
              <form onSubmit={handleIssueBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SELECT BORROWING STUDENT *</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Student Profile --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentId || s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SELECT BOOK CATALOG *</label>
                  <select
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Book Catalog --</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                        {b.title} (Stock: {b.availableCopies}/{b.quantity}) {b.availableCopies <= 0 ? "[OUT OF STOCK]" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">LEASE DURATION</label>
                  <select
                    value={issueDays}
                    onChange={(e) => setIssueDays(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                  >
                    <option value={7}>7 Days (Short lease)</option>
                    <option value={14}>14 Days (Standard lease)</option>
                    <option value={30}>30 Days (Extended research lease)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowIssueModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Issuing..." : "Confirm Issuance"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Transaction Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative text-slate-800 dark:text-slate-100">
            
            <button onClick={() => setShowReceipt(null)} className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Frame */}
            <div className="flex flex-col items-center mt-2" id="printable-receipt-frame">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-500 mb-3">
                <ReceiptText className="w-6 h-6" />
              </div>
              <h2 className="font-extrabold text-base tracking-tight uppercase">Athenaeum Library</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Return & Settlement Receipt</p>

              <div className="w-full border-t-2 border-dashed border-slate-200 dark:border-slate-800 my-4"></div>

              {/* Transaction details block */}
              <div className="w-full space-y-3 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">RECEIPT NO:</span>
                  <span className="font-bold">{showReceipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Borrower:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{showReceipt.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Book Title:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 max-w-[200px] text-right truncate">{showReceipt.bookTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Issued On:</span>
                  <span className="font-mono">{showReceipt.issueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Due Date:</span>
                  <span className="font-mono text-red-500 font-bold">{showReceipt.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Returned On:</span>
                  <span className="font-mono text-emerald-500 font-bold">{showReceipt.returnDate || "N/A"}</span>
                </div>
              </div>

              <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800 my-4"></div>

              {/* Settlement block */}
              <div className="w-full space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Overdue Fines:</span>
                  <span className="font-bold font-mono">₹{showReceipt.fineAmount || 0}.00</span>
                </div>
                <div className="flex justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl font-bold border border-slate-100 dark:border-slate-800/60 mt-1">
                  <span className="text-slate-700 dark:text-slate-300">Total Charged:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">₹{showReceipt.fineAmount || 0}.00</span>
                </div>
              </div>

              <div className="w-full text-center mt-6">
                <p className="text-[10px] text-slate-400 font-bold tracking-wider">THANK YOU FOR SUPPORTING THE LENDING NETWORK</p>
                <button
                  onClick={() => window.print()}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors shadow"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
