/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Search, Heart, Star, BookOpen, Clock, Tag, MessageSquare, Plus, AlertCircle, Sparkles, X } from "lucide-react";
import { Book, Review, WishlistItem } from "../types.js";

interface StudentCatalogProps {
  userId: string;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function StudentCatalog({ userId, showToast }: StudentCatalogProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState("title");

  // Selector supporting lists
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);

  // Detailed book modal
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookReviews, setBookReviews] = useState<Review[]>([]);

  // Review Form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const fetchBooksAndWishlist = async () => {
    try {
      const q = new URLSearchParams({ title: searchTerm, category: filterCategory, sort: sortBy });
      const [booksRes, wishRes, catsRes] = await Promise.all([
        fetch(`/api/books?${q}`),
        fetch(`/api/wishlist?userId=${userId}`),
        fetch("/api/categories")
      ]);

      if (booksRes.ok) {
        const d = await booksRes.json();
        setBooks(d.books);
      }
      if (wishRes.ok) setWishlist(await wishRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
    } catch (e) {
      console.error("Failed to load student catalog", e);
    }
  };

  useEffect(() => {
    fetchBooksAndWishlist();
  }, [searchTerm, filterCategory, sortBy]);

  // Fetch book reviews
  const loadReviewsForBook = async (bookId: string) => {
    try {
      const res = await fetch(`/api/reviews?bookId=${bookId}`);
      if (res.ok) setBookReviews(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Wishlist
  const handleToggleWishlist = async (book: Book) => {
    const isFav = wishlist.some(item => item.bookId === book.id);
    try {
      if (isFav) {
        // Find wish item id
        const item = wishlist.find(it => it.bookId === book.id);
        if (item) {
          const res = await fetch(`/api/wishlist/${item.id}?userId=${userId}`, { method: "DELETE" });
          if (res.ok) {
            showToast("Removed from wishlist.", "info");
            fetchBooksAndWishlist();
          }
        }
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, bookId: book.id })
        });
        if (res.ok) {
          showToast("Added to wishlist!", "success");
          fetchBooksAndWishlist();
        }
      }
    } catch (e) {
      showToast("Failed to modify wishlist", "error");
    }
  };

  // Self checkout borrow
  const handleBorrow = async (book: Book) => {
    if (book.availableCopies <= 0) {
      showToast("Book is currently unavailable. You can reserve this title instead.", "info");
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

      const data = await res.json();
      if (res.ok) {
        showToast(`Self check-out complete! "${book.title}" is now issued to you.`, "success");
        fetchBooksAndWishlist();
        // Update selected book view if open
        if (selectedBook?.id === book.id) {
          setSelectedBook(prev => prev ? { ...prev, availableCopies: prev.availableCopies - 1 } : null);
        }
      } else {
        showToast(data.message || "Failed to borrow book", "error");
      }
    } catch (e) {
      showToast("Connection failed", "error");
    }
  };

  // Self reserve book
  const handleReserve = async (book: Book) => {
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, bookId: book.id })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Book reserved successfully! Position: #${data.queuePosition}`, "success");
      } else {
        showToast(data.message || "Reservation failed", "error");
      }
    } catch (e) {
      showToast("Server error", "error");
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          bookId: selectedBook.id,
          rating,
          comment
        })
      });

      if (res.ok) {
        showToast("Review submitted successfully!", "success");
        setComment("");
        setRating(5);
        loadReviewsForBook(selectedBook.id);
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to post review", "error");
      }
    } catch (err) {
      showToast("Failed to connect", "error");
    }
  };

  return (
    <div id="student-catalog-root" className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Global Books Catalog</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Browse titles, read reviews, check shelf availability, and self-checkout/reserve books.</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search titles, authors, ISBNs..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
          >
            <option value="">All Genres / Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
          >
            <option value="title">Sort by Title</option>
            <option value="price">Sort by Price</option>
            <option value="quantity">Sort by Copies</option>
          </select>
        </div>
      </div>

      {/* Books Card Deck Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No matching books found in library archives.
          </div>
        ) : (
          books.map((book) => {
            const isFav = wishlist.some(item => item.bookId === book.id);
            return (
              <div
                key={book.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between overflow-hidden group"
              >
                
                {/* Book Cover Frame with wishlist trigger */}
                <div className="relative aspect-3/4 bg-slate-50 dark:bg-slate-950 overflow-hidden">
                  <img
                    src={book.coverImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400"}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  
                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded-lg shadow-md uppercase">
                    {book.categoryName}
                  </span>

                  {/* Wishlist Heart */}
                  <button
                    onClick={() => handleToggleWishlist(book)}
                    className={`absolute top-3 right-3 p-1.8 rounded-full border shadow-md transition-all cursor-pointer ${
                      isFav
                        ? "bg-rose-500 text-white border-rose-500"
                        : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:text-rose-500"
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* Availability Pill */}
                  <div className="absolute bottom-3 left-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-extrabold text-white shadow-md ${
                      book.availableCopies > 0 ? "bg-emerald-500" : "bg-red-500"
                    }`}>
                      {book.availableCopies > 0 ? "AVAILABLE" : "OUT OF STOCK"}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => {
                        setSelectedBook(book);
                        loadReviewsForBook(book.id);
                      }}
                      className="font-bold text-slate-800 dark:text-white text-xs hover:text-emerald-500 transition-colors line-clamp-1 cursor-pointer"
                    >
                      {book.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">by {book.authorName}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">📍 Rack {book.rackNumber}, Shelf {book.shelfNumber}</p>
                  </div>

                  {/* Checkout Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedBook(book);
                        loadReviewsForBook(book.id);
                      }}
                      className="text-[10px] text-slate-500 dark:text-slate-400 font-bold hover:text-emerald-500 transition-colors shrink-0 cursor-pointer"
                    >
                      See Reviews
                    </button>

                    {book.availableCopies > 0 ? (
                      <button
                        onClick={() => handleBorrow(book)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] shadow-sm cursor-pointer transition-all active:scale-98"
                      >
                        Self Checkout
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReserve(book)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-[10px] cursor-pointer transition-all"
                      >
                        Reserve Copy
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Book Detail & Reviews Overlay Modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative my-8">
            
            <button onClick={() => setSelectedBook(null)} className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-2">
              
              {/* Cover Image detail */}
              <div className="sm:col-span-1 space-y-4">
                <img
                  src={selectedBook.coverImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400"}
                  alt={selectedBook.title}
                  className="w-full aspect-3/4 object-cover rounded-2xl border border-slate-100 dark:border-slate-800/60"
                />
                
                <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <p>📖 Edition: {selectedBook.edition}</p>
                  <p>🌐 Language: {selectedBook.language}</p>
                  <p>📝 Length: {selectedBook.numberOfPages} Pages</p>
                  <p>💰 Cost Price: ₹{selectedBook.price}</p>
                </div>

                {selectedBook.availableCopies > 0 ? (
                  <button
                    onClick={() => handleBorrow(selectedBook)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/10 cursor-pointer active:scale-98"
                  >
                    Self Checkout Now
                  </button>
                ) : (
                  <button
                    onClick={() => handleReserve(selectedBook)}
                    className="w-full py-2 bg-slate-850 hover:bg-slate-850 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Reserve Copy Index
                  </button>
                )}
              </div>

              {/* Reviews and Comment board */}
              <div className="sm:col-span-2 space-y-5">
                <div>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{selectedBook.categoryName}</span>
                  <h2 className="text-lg font-extrabold text-slate-800 dark:text-white leading-snug">{selectedBook.title}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">by {selectedBook.authorName} | {selectedBook.publisherName}</p>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                  <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                    Synopsis Description
                  </h4>
                  <p className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    {selectedBook.description || "No synopsis description listed for this book catalog index."}
                  </p>
                </div>

                {/* Reviews List */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> Reader Reviews ({bookReviews.length})
                  </h4>

                  <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                    {bookReviews.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No reader reviews published. Be the first!</p>
                    ) : (
                      bookReviews.map((rev) => (
                        <div key={rev.id} className="p-3 bg-slate-50/60 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">Student Borrower</span>
                            <div className="flex gap-0.5 text-amber-500">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                            {rev.comment}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Submit New Review */}
                <form onSubmit={handleSubmitReview} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Write a Review</span>
                  
                  <div className="flex gap-2.5 items-center">
                    <span className="text-[11px] text-slate-500 font-semibold">Your Rating:</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`cursor-pointer transition-colors ${rating >= star ? "text-amber-500" : "text-slate-300 dark:text-slate-700"}`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts on this literature catalog..."
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                    >
                      Submit
                    </button>
                  </div>
                </form>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
