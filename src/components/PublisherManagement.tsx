/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, X, Printer, MapPin, Phone } from "lucide-react";
import { Publisher } from "../types.js";

interface PublisherManagementProps {
  userId: string;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function PublisherManagement({ userId, showToast }: PublisherManagementProps) {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const fetchPublishers = async () => {
    try {
      const res = await fetch("/api/publishers");
      if (res.ok) setPublishers(await res.json());
    } catch (e) {
      showToast("Error loading publishers", "error");
    }
  };

  useEffect(() => {
    fetchPublishers();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showToast("Publisher name is required.", "error");
      return;
    }

    const payload = { name, address, phone, userId };

    try {
      const url = isEditing && selectedPublisher ? `/api/publishers/${selectedPublisher.id}` : "/api/publishers";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(isEditing ? "Publisher details updated!" : "Publisher registered successfully!", "success");
        setShowModal(false);
        fetchPublishers();
      } else {
        showToast("Operation failed", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this publisher index from database?")) return;
    try {
      const res = await fetch(`/api/publishers/${id}?userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Publisher deleted.", "success");
        fetchPublishers();
      } else {
        showToast("Cannot delete: publisher has linked books in inventory.", "error");
      }
    } catch (e) {
      showToast("Server error", "error");
    }
  };

  const openCreate = () => {
    setIsEditing(false);
    setSelectedPublisher(null);
    setName("");
    setAddress("");
    setPhone("");
    setShowModal(true);
  };

  const openEdit = (p: Publisher) => {
    setIsEditing(true);
    setSelectedPublisher(p);
    setName(p.name);
    setAddress(p.address);
    setPhone(p.phone);
    setShowModal(true);
  };

  return (
    <div id="publisher-mgmt-root" className="p-8 space-y-6 max-w-7xl mx-auto">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Publishing Houses</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Index publication sources, warehouse locations, and contact records.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" /> Add Publisher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {publishers.map((pub) => (
          <div key={pub.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center shrink-0">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">{pub.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {pub.id}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(pub)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(pub.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                {pub.address && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {pub.address}
                  </p>
                )}
                {pub.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" /> {pub.phone}
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-right text-[10px] text-slate-400">
              <span>Registered: {pub.createdDate}</span>
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
              {isEditing ? "Modify Publisher Details" : "Register Publishing House"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">PUBLISHING HOUSE NAME *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Addison-Wesley"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">PHONE NUMBER</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 99999-88888"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">HEADQUARTERS ADDRESS</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, city, country..."
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
                  Save Publisher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
