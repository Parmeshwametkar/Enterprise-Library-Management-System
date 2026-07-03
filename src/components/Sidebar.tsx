/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole } from "../types.js";
import {
  LayoutDashboard,
  Book,
  Users,
  Tag,
  PenTool,
  Printer,
  History,
  ShieldAlert,
  Search,
  Heart,
  Sparkles,
  User,
  LogOut,
  BookOpen,
  Bell,
  Wallet
} from "lucide-react";

interface SidebarProps {
  role: UserRole;
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
  userName: string;
}

export default function Sidebar({ role, activeView, setActiveView, onLogout, userName }: SidebarProps) {
  
  // Define navigation lists depending on roles
  const adminNav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "books", label: "Book Catalog", icon: Book },
    { id: "authors", label: "Authors", icon: PenTool },
    { id: "categories", label: "Categories", icon: Tag },
    { id: "publishers", label: "Publishers", icon: Printer },
    { id: "students", label: "Students Portal", icon: Users },
    { id: "issues", label: "Issue / Return", icon: History },
    { id: "audit-logs", label: "Audit Trails", icon: ShieldAlert }
  ];

  const studentNav = [
    { id: "catalog", label: "Search Books", icon: Search },
    { id: "issued", label: "My Borrowed", icon: History },
    { id: "fines", label: "Fines & Payments", icon: Wallet },
    { id: "wishlist", label: "My Wishlist", icon: Heart },
    { id: "ai-recs", label: "AI Recommendations", icon: Sparkles },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "My Profile", icon: User }
  ];

  const currentNav = role === UserRole.ADMIN ? adminNav : studentNav;

  return (
    <aside id="app-sidebar" className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen shrink-0 sticky top-0 transition-all duration-300">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10 shrink-0">
          <BookOpen className="w-5.5 h-5.5" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-base text-white truncate tracking-tight">Athenaeum</h2>
          <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
            {role} PORTAL
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        <p className="px-3 text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2">
          General Navigation
        </p>
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group duration-200 ${
                isActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-105 duration-200 ${
                isActive ? "text-white" : "text-slate-500 group-hover:text-emerald-400"
              }`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-semibold font-mono text-sm shrink-0 uppercase shadow-inner">
            {userName ? userName.charAt(0) : "U"}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-white truncate">{userName || "User"}</h4>
            <span className="text-[10px] text-slate-500 truncate block">Logged in online</span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/60 hover:bg-red-900/20 hover:text-red-400 text-slate-400 border border-slate-800 hover:border-red-900/30 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out Session
        </button>
      </div>

    </aside>
  );
}
