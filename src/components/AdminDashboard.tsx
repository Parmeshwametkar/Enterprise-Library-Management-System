/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { Book, CheckCircle, AlertTriangle, IndianRupee, Users, ArrowUpRight, Shield, Award, Layers } from "lucide-react";

interface AdminDashboardProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AdminDashboard({ showToast }: AdminDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const analytics = await res.json();
        setData(analytics);
      } else {
        showToast("Failed to fetch dashboard metrics", "error");
      }
    } catch (err) {
      showToast("Error connecting to server for analytics", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div id="dashboard-skeleton" className="p-8 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const cards = data?.cards || {
    totalBooks: 0,
    availableBooks: 0,
    issuedBooks: 0,
    returnedBooks: 0,
    totalStudents: 0,
    activeStudents: 0,
    overdueBooks: 0,
    fineCollected: 0
  };

  const charts = data?.charts || {
    monthlyBorrowStats: [],
    categoryWiseStats: [],
    mostBorrowedBooks: [],
    studentActivity: [],
    fineRevenueStats: []
  };

  // Aesthetic Colors for Charts
  const COLORS_CATEGORIES = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  const COLORS_FINES = ["#10b981", "#f43f5e"];

  return (
    <div id="admin-dashboard-root" className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Intro Welcome */}
      <div className="flex justify-between items-center bg-slate-100/50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Library Operations Hub <Award className="w-5 h-5 text-emerald-500" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time status of catalog, student lending statistics, fine catalogs, and overall library performance.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all active:scale-98"
        >
          Refresh Live Data
        </button>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Books Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Book Inventory</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white font-mono">
              {cards.totalBooks}
            </h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> Unique: {cards.uniqueBooks} titles
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <Book className="w-6 h-6" />
          </div>
        </div>

        {/* Issued Books Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Borrows</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white font-mono">
              {cards.issuedBooks}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {cards.availableBooks} copies available in shelves
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue Alert Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Alert</span>
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
              {cards.overdueBooks}
            </h3>
            <p className="text-[10px] text-red-500 flex items-center gap-0.5">
              <AlertTriangle className="w-3 h-3" /> Requires urgent return
            </p>
          </div>
          <div className="w-12 h-12 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Fine Collected Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fines Collected</span>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{cards.fineCollected}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              ₹10 charged per day late
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center font-bold">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Borrow Statistics */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-wider">
            Monthly Borrow & Return Stats
          </h3>
          <div className="h-80 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.monthlyBorrowStats} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#fff" }} />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="borrows" stroke="#10b981" strokeWidth={3} name="Borrows" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="returns" stroke="#3b82f6" strokeWidth={3} name="Returns" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category-wise Books */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-wider">
            Category Wise Books Distribution
          </h3>
          <div className="h-80 w-full flex flex-col justify-between">
            <div className="h-60 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categoryWiseStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.categoryWiseStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS_CATEGORIES[index % COLORS_CATEGORIES.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {charts.categoryWiseStats.map((item: any, i: number) => (
                <div key={item.name} className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS_CATEGORIES[i % COLORS_CATEGORIES.length] }}></span>
                  <span className="truncate">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Most Borrowed Books */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-wider">
            Most Popular & Borrowed Books
          </h3>
          <div className="h-64 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.mostBorrowedBooks} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis type="category" dataKey="name" width={100} stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#fff" }} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} name="Borrow Frequency" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fine revenue split */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-wider">
            Fine Revenue Structure
          </h3>
          <div className="h-64 w-full flex flex-col justify-between">
            <div className="h-44 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.fineRevenueStats}
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {charts.fineRevenueStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS_FINES[index % COLORS_FINES.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-500/5">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Collected Fines
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">₹{charts.fineRevenueStats[0]?.value}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-rose-500/5">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Outstanding Unpaid
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">₹{charts.fineRevenueStats[1]?.value}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
