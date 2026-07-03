/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Heart, Trash2, BookOpen, AlertCircle } from "lucide-react";
import { WishlistItem, Book } from "../types.js";

interface StudentWishlistProps {
  userId: string;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function StudentWishlist({ userId, showToast }: StudentWishlistProps) {
  const [wishlist, setWishlist] = useState<any[]>([]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch(`/api/wishlist?userId=${userId}`);
      if (res.ok) {
        setWishlist(await res.json());
      }
    } catch (e) {
      showToast("Error loading wishlist items", "error");
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/wishlist/${id}?userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Book removed from wishlist bookmarks.", "success");
        fetchWishlist();
      } else {
        showToast("Failed to remove item", "error");
      }
    } catch (e) {
      showToast("Server error", "error");
    }
  };

  const handleBorrow = async (book: Book) => {
    if (book.availableCopies <= 0) {
      showToast("Book is currently out of stock.", "info");
      return;
    }

    try {
      const res = await fetch("/api/borrows/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: userId,
          bookId: book.id,
          issueDays: 14,
          userId
        })
      });

      if (res.ok) {
        showToast(`Checkout complete! "${book.title}" has been issued to you.`, "success");
        fetchWishlist();
      } else {
        showToast("Failed to borrow book", "error");
      }
    } catch (e) {
      showToast("Server error", "error");
    }
  };

  return (
    <div id="student-wishlist-root" className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">My Literature Wishlist</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Bookmark desired research publications, check real-time copies remaining, and checkout items instantly.</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl">
          <Heart className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-xs">Your wishlist is empty. Visit the book catalog to bookmark academic literature!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wishlist.map((item) => {
            const b = item.bookDetails;
            if (!b) return null;
            const isAvailable = b.availableCopies > 0;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-start gap-4 justify-between"
              >
                <div className="flex gap-4 items-start min-w-0">
                  <img
                    src={b.coverImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400"}
                    alt={b.title}
                    className="w-12 h-16 rounded object-cover bg-slate-50 border border-slate-200/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-xs truncate leading-snug">{b.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">by {b.authorName}</p>
                    
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isAvailable ? "bg-emerald-500" : "bg-red-500"}`}></span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold font-mono">
                        {b.availableCopies} of {b.quantity} copies in shelves
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleBorrow(b)}
                    disabled={!isAvailable}
                    className="px-3.5 py-1.8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Checkout
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="px-3.5 py-1.8 bg-slate-100 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-500 dark:text-slate-400 font-bold rounded-xl text-[10px] border border-slate-200 dark:border-slate-800 hover:border-red-100 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
