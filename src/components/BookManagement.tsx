/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Search, Plus, Edit3, Trash2, X, Barcode, QrCode, BookMarked, MapPin, Eye, FileSpreadsheet, FileDown } from "lucide-react";
import { Book, Author, Category, Publisher, BookStatus } from "../types.js";

interface BookManagementProps {
  userId: string;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function BookManagement({ userId, showToast }: BookManagementProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);

  // Search/Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const limit = 5;

  // Modal / Form States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isbn, setIsbn] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [publisherId, setPublisherId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [edition, setEdition] = useState("1st Edition");
  const [language, setLanguage] = useState("English");
  const [numberOfPages, setNumberOfPages] = useState(250);
  const [price, setPrice] = useState(499);
  const [quantity, setQuantity] = useState(5);
  const [availableCopies, setAvailableCopies] = useState(5);
  const [shelfNumber, setShelfNumber] = useState("S-01");
  const [rackNumber, setRackNumber] = useState("R-01");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");

  // Detailed view state
  const [viewBook, setViewBook] = useState<Book | null>(null);

  // Load supporting entities
  const loadSupportingData = async () => {
    try {
      const [authorsRes, catsRes, pubsRes] = await Promise.all([
        fetch("/api/authors"),
        fetch("/api/categories"),
        fetch("/api/publishers")
      ]);
      if (authorsRes.ok) setAuthors(await authorsRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
      if (pubsRes.ok) setPublishers(await pubsRes.json());
    } catch (e) {
      console.error("Failed to load selectors catalog", e);
    }
  };

  const fetchBooks = async () => {
    try {
      const query = new URLSearchParams({
        title: searchTerm,
        category: filterCategory,
        language: filterLanguage,
        sort: sortBy,
        order: sortOrder,
        page: String(page),
        limit: String(limit)
      });
      const res = await fetch(`/api/books?${query}`);
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books);
        setTotalBooks(data.total);
      }
    } catch (err) {
      showToast("Error loading catalog books", "error");
    }
  };

  useEffect(() => {
    loadSupportingData();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [searchTerm, filterCategory, filterLanguage, sortBy, sortOrder, page]);

  // Handle Save (Add/Edit)
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !isbn || !authorId || !publisherId || !categoryId) {
      showToast("Please fill in all mandatory fields.", "error");
      return;
    }

    const payload = {
      isbn, title, subtitle, authorId, publisherId, categoryId,
      edition, language, numberOfPages: Number(numberOfPages),
      price: Number(price), quantity: Number(quantity),
      availableCopies: isEditing && selectedBook ? selectedBook.availableCopies : Number(quantity),
      shelfNumber, rackNumber, description, coverImage, userId
    };

    try {
      const url = isEditing && selectedBook ? `/api/books/${selectedBook.id}` : "/api/books";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(isEditing ? "Book updated successfully!" : "Book added to catalog!", "success");
        setShowModal(false);
        fetchBooks();
      } else {
        showToast(data.message || "Operation failed", "error");
      }
    } catch (err) {
      showToast("Network error during save operations", "error");
    }
  };

  // Trigger Delete
  const handleDeleteBook = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this book from the catalog?")) return;
    try {
      const res = await fetch(`/api/books/${id}?userId=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showToast("Book successfully deleted.", "success");
        fetchBooks();
      } else {
        showToast(data.message || "Failed to delete book", "error");
      }
    } catch (err) {
      showToast("Server error", "error");
    }
  };

  // Open Modal for Create
  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedBook(null);
    setTitle("");
    setSubtitle("");
    setIsbn("");
    setAuthorId(authors[0]?.id || "");
    setPublisherId(publishers[0]?.id || "");
    setCategoryId(categories[0]?.id || "");
    setEdition("1st Edition");
    setLanguage("English");
    setNumberOfPages(250);
    setPrice(499);
    setQuantity(5);
    setShelfNumber("S-01");
    setRackNumber("R-01");
    setDescription("");
    setCoverImage("");
    setShowModal(true);
  };

  // Open Modal for Edit
  const openEditModal = (book: Book) => {
    setIsEditing(true);
    setSelectedBook(book);
    setTitle(book.title);
    setSubtitle(book.subtitle);
    setIsbn(book.isbn);
    setAuthorId(book.authorId);
    setPublisherId(book.publisherId);
    setCategoryId(book.categoryId);
    setEdition(book.edition);
    setLanguage(book.language);
    setNumberOfPages(book.numberOfPages);
    setPrice(book.price);
    setQuantity(book.quantity);
    setShelfNumber(book.shelfNumber);
    setRackNumber(book.rackNumber);
    setDescription(book.description);
    setCoverImage(book.coverImage);
    setShowModal(true);
  };

  // Simulating Report Generation
  const handleExport = (type: "pdf" | "excel") => {
    showToast(`Generating report... Your catalog file has been compiled in ${type.toUpperCase()} format.`, "success");
  };

  // Simple pseudo barcode generator (SVG based)
  const renderBarcodeSVG = (text: string) => {
    return (
      <svg className="w-full h-12" viewBox="0 0 100 30" preserveAspectRatio="none">
        <rect width="100" height="30" fill="transparent" />
        {/* Draw arbitrary black lines representing barcode binary patterns */}
        {Array.from({ length: 30 }).map((_, i) => {
          const isBlack = (i * 7 + parseInt(text.charAt(i % text.length) || "3")) % 3 !== 0;
          return isBlack ? (
            <rect key={i} x={i * 3 + 4} y="2" width="1.8" height="24" fill="currentColor" />
          ) : null;
        })}
        <text x="50" y="29" fontSize="3" textAnchor="middle" className="fill-slate-600 dark:fill-slate-400 font-mono tracking-widest">{text}</text>
      </svg>
    );
  };

  // QR Code Box Visual mock
  const renderQRCodeSVG = (text: string) => {
    return (
      <div className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-200 shrink-0 flex flex-col items-center justify-center">
        <svg className="w-16 h-16 text-slate-950" viewBox="0 0 20 20">
          <rect x="0" y="0" width="6" height="6" fill="currentColor" />
          <rect x="1" y="1" width="4" height="4" fill="white" />
          <rect x="2" y="2" width="2" height="2" fill="currentColor" />

          <rect x="14" y="0" width="6" height="6" fill="currentColor" />
          <rect x="15" y="1" width="4" height="4" fill="white" />
          <rect x="16" y="2" width="2" height="2" fill="currentColor" />

          <rect x="0" y="14" width="6" height="6" fill="currentColor" />
          <rect x="1" y="15" width="4" height="4" fill="white" />
          <rect x="2" y="16" width="2" height="2" fill="currentColor" />

          {/* Random dots */}
          <rect x="8" y="2" width="2" height="2" fill="currentColor" />
          <rect x="11" y="4" width="1" height="3" fill="currentColor" />
          <rect x="8" y="10" width="4" height="2" fill="currentColor" />
          <rect x="14" y="9" width="3" height="3" fill="currentColor" />
          <rect x="16" y="15" width="2" height="2" fill="currentColor" />
          <rect x="10" y="15" width="2" height="3" fill="currentColor" />
        </svg>
        <span className="text-[6px] text-slate-500 font-mono mt-0.5 font-bold">LMS CARD</span>
      </div>
    );
  };

  return (
    <div id="book-management-root" className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Book Stock Inventory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage ISBN indices, print barcodes, shelf racking metadata, and book details.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleExport("excel")}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Excel Export
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 cursor-pointer transition-all"
          >
            <FileDown className="w-3.5 h-3.5 text-red-500" /> PDF Catalog
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/15 cursor-pointer transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" /> Add New Book
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search book title, author, or ISBN tag..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Languages</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="Hindi">Hindi</option>
          </select>
        </div>
      </div>

      {/* Grid Book Catalog Display */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Book Cover & Details</th>
                <th className="p-4">Author / Publisher</th>
                <th className="p-4">Class Location</th>
                <th className="p-4">Copies Available</th>
                <th className="p-4">Barcodes</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {books.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No books found in the current catalog filter selection.
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 pl-6 flex gap-4 items-center min-w-[280px]">
                      <img
                        src={book.coverImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400"}
                        alt={book.title}
                        className="w-11 h-15 rounded-lg object-cover bg-slate-100 border border-slate-200/50 dark:border-slate-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-white truncate text-sm leading-tight">{book.title}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">{book.subtitle}</p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold rounded-md">
                          {book.categoryName}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{book.authorName}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{book.publisherName}</p>
                    </td>

                    <td className="p-4">
                      <p className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {book.shelfNumber}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Rack {book.rackNumber}</p>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          book.availableCopies > 2 ? "bg-emerald-500" : book.availableCopies > 0 ? "bg-amber-500" : "bg-red-500"
                        }`}></span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">{book.availableCopies}</span>
                        <span className="text-slate-400">/ {book.quantity} total</span>
                      </div>
                    </td>

                    <td className="p-4 min-w-[150px]">
                      <div className="max-w-[120px] text-slate-800 dark:text-slate-200">
                        {renderBarcodeSVG(book.barcode)}
                      </div>
                    </td>

                    <td className="p-4 pr-6 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setViewBook(book)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-500 cursor-pointer transition-colors"
                        title="View Detailed QR Card"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(book)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 cursor-pointer transition-colors"
                        title="Edit Book Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book.id)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-950/20 hover:text-red-500 cursor-pointer transition-colors"
                        title="Delete Book"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Showing <strong className="font-semibold text-slate-700 dark:text-slate-300">{(page-1)*limit+1} - {Math.min(page*limit, totalBooks)}</strong> of {totalBooks} items
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= totalBooks}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detailed QR QR View Overlay */}
      {viewBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button onClick={() => setViewBook(null)} className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center mt-2">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Catalog Identification Tag</span>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base leading-snug">{viewBook.title}</h3>
              <p className="text-[11px] text-slate-400 mb-6 font-mono">{viewBook.isbn}</p>

              {/* QR and Barcode Display */}
              <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl w-full border border-slate-200/50 dark:border-slate-800">
                {renderQRCodeSVG(viewBook.qrCode)}
                <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-emerald-500" /> Digital Scannable
                  </span>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">QR: {viewBook.qrCode}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">ID: {viewBook.id}</p>
                </div>
              </div>

              <div className="w-full mt-4 text-slate-800 dark:text-slate-200">
                {renderBarcodeSVG(viewBook.barcode)}
              </div>

              <div className="mt-5 w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-left text-[11px] space-y-1 text-slate-500 dark:text-slate-400 font-medium">
                <p>📍 Location: Shelf {viewBook.shelfNumber}, Rack {viewBook.rackNumber}</p>
                <p>🌐 Language: {viewBook.language} ({viewBook.numberOfPages} Pages)</p>
                <p>💰 Price Tag: ₹{viewBook.price}.00 INR</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative my-8">
            
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-800 dark:text-white mb-4">
              {isEditing ? "Edit Catalog Book" : "Add New Book to Inventory"}
            </h3>

            <form onSubmit={handleSaveBook} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">BOOK TITLE *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Effective Java, Clean Code, etc."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SUBTITLE</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="A handbook of agile craftsmanship"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">ISBN CODE *</label>
                  <input
                    type="text"
                    required
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="e.g. 978-0134685991"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">CATEGORY *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">AUTHOR *</label>
                  <select
                    value={authorId}
                    onChange={(e) => setAuthorId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">PUBLISHER *</label>
                  <select
                    value={publisherId}
                    onChange={(e) => setPublisherId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {publishers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">EDITION</label>
                  <input
                    type="text"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">LANGUAGE</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">PAGES</label>
                  <input
                    type="number"
                    value={numberOfPages}
                    onChange={(e) => setNumberOfPages(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">PRICE (INR)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SHELF NUMBER</label>
                  <input
                    type="text"
                    value={shelfNumber}
                    onChange={(e) => setShelfNumber(e.target.value)}
                    placeholder="e.g. S-04"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">RACK NUMBER</label>
                  <input
                    type="text"
                    value={rackNumber}
                    onChange={(e) => setRackNumber(e.target.value)}
                    placeholder="e.g. R-12"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">QUANTITY *</label>
                  <input
                    type="number"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">COVER IMAGE URL</label>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">DESCRIPTION</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a brief summary of the book content..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer active:scale-98"
                >
                  Save Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
