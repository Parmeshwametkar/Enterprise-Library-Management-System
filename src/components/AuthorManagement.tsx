/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, X, PenTool, User } from "lucide-react";
import { Author } from "../types.js";

interface AuthorManagementProps {
  userId: string;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AuthorManagement({ userId, showToast }: AuthorManagementProps) {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [biography, setBiography] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const fetchAuthors = async () => {
    try {
      const res = await fetch("/api/authors");
      if (res.ok) {
        setAuthors(await res.json());
      }
    } catch (e) {
      showToast("Error loading authors list", "error");
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showToast("Author name is required.", "error");
      return;
    }

    const payload = { name, biography, birthDate, userId };

    try {
      const url = isEditing && selectedAuthor ? `/api/authors/${selectedAuthor.id}` : "/api/authors";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(isEditing ? "Author updated successfully!" : "Author added successfully!", "success");
        setShowModal(false);
        fetchAuthors();
      } else {
        showToast("Operation failed", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this author from catalog index?")) return;
    try {
      const res = await fetch(`/api/authors/${id}?userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Author deleted successfully.", "success");
        fetchAuthors();
      } else {
        showToast("Cannot delete: author has linked books in inventory.", "error");
      }
    } catch (e) {
      showToast("Server error", "error");
    }
  };

  const openCreate = () => {
    setIsEditing(false);
    setSelectedAuthor(null);
    setName("");
    setBiography("");
    setBirthDate("");
    setShowModal(true);
  };

  const openEdit = (a: Author) => {
    setIsEditing(true);
    setSelectedAuthor(a);
    setName(a.name);
    setBiography(a.biography);
    setBirthDate(a.birthDate || "");
    setShowModal(true);
  };

  return (
    <div id="author-mgmt-root" className="p-8 space-y-6 max-w-7xl mx-auto">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Author Indexing</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Identify writers, biographies, and linked bibliography indices.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" /> Add Author
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {authors.map((author) => (
          <div key={author.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">{author.name}</h3>
                    {author.birthDate && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Born: {author.birthDate}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(author)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(author.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                {author.biography || "No biography details available for this author."}
              </p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-[10px] text-slate-400">
              <span className="font-mono uppercase">ID: {author.id}</span>
              <span>Added: {author.createdDate}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-4">
              {isEditing ? "Modify Author Record" : "Index New Author"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">AUTHOR NAME *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Joshua Bloch"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">DATE OF BIRTH</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">BIOGRAPHY SUMMARY</label>
                <textarea
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Summarize literary background, historical achievements..."
                  rows={4}
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
                  Save Author
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
