/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, UserRole, Notification } from "./types.js";
import AuthPages from "./components/AuthPages.js";
import Sidebar from "./components/Sidebar.js";
import Navbar from "./components/Navbar.js";

// Administrative Views
import AdminDashboard from "./components/AdminDashboard.js";
import BookManagement from "./components/BookManagement.js";
import AuthorManagement from "./components/AuthorManagement.js";
import CategoryManagement from "./components/CategoryManagement.js";
import PublisherManagement from "./components/PublisherManagement.js";
import StudentManagement from "./components/StudentManagement.js";
import IssueReturnRenew from "./components/IssueReturnRenew.js";
import AuditLogs from "./components/AuditLogs.js";

// Student Views
import StudentCatalog from "./components/StudentCatalog.js";
import StudentBorrowed from "./components/StudentBorrowed.js";
import StudentFines from "./components/StudentFines.js";
import StudentWishlist from "./components/StudentWishlist.js";
import StudentAIRecommendations from "./components/StudentAIRecommendations.js";
import StudentProfile from "./components/StudentProfile.js";

// Standard icon for full-screen notifications fall-through
import { Bell, CheckSquare } from "lucide-react";

interface ToastMsg {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  // Check existing session
  useEffect(() => {
    const saved = localStorage.getItem("ath_user_session");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
        // Default student to Catalog view
        if (u.role === UserRole.STUDENT) {
          setActiveView("catalog");
        } else {
          setActiveView("dashboard");
        }
      } catch (e) {
        localStorage.removeItem("ath_user_session");
      }
    }
  }, []);

  // Sync Dark Theme class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Fetch student/system notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error("Notifications poll error", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Periodically poll for notifications every 30 seconds
      const timer = setInterval(fetchNotifications, 30000);
      return () => clearInterval(timer);
    } else {
      setNotifications([]);
    }
  }, [user]);

  // Toast Dispatcher Helper
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Mark notification read
  const handleMarkNotificationRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        showToast("Notification marked as read.", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Logout Session
  const handleLogout = () => {
    localStorage.removeItem("ath_user_session");
    setUser(null);
    showToast("Logged out successfully.", "info");
  };

  // Login handler
  const handleLoginSuccess = (loggedInUser: User) => {
    localStorage.setItem("ath_user_session", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    showToast(`Welcome back, ${loggedInUser.fullName}!`, "success");
    if (loggedInUser.role === UserRole.STUDENT) {
      setActiveView("catalog");
    } else {
      setActiveView("dashboard");
    }
  };

  // Dynamic View Renderer
  const renderContentView = () => {
    if (!user) return null;

    if (user.role === UserRole.ADMIN) {
      switch (activeView) {
        case "dashboard":
          return <AdminDashboard showToast={showToast} />;
        case "books":
          return <BookManagement userId={user.id} showToast={showToast} />;
        case "authors":
          return <AuthorManagement userId={user.id} showToast={showToast} />;
        case "categories":
          return <CategoryManagement userId={user.id} showToast={showToast} />;
        case "publishers":
          return <PublisherManagement userId={user.id} showToast={showToast} />;
        case "students":
          return <StudentManagement userId={user.id} showToast={showToast} />;
        case "issues":
          return <IssueReturnRenew userId={user.id} showToast={showToast} />;
        case "audit-logs":
          return <AuditLogs showToast={showToast} />;
        default:
          return <AdminDashboard showToast={showToast} />;
      }
    } else {
      switch (activeView) {
        case "catalog":
          return <StudentCatalog userId={user.id} showToast={showToast} />;
        case "issued":
          return <StudentBorrowed userId={user.id} showToast={showToast} />;
        case "fines":
          return <StudentFines userId={user.id} showToast={showToast} />;
        case "wishlist":
          return <StudentWishlist userId={user.id} showToast={showToast} />;
        case "ai-recs":
          return <StudentAIRecommendations userId={user.id} showToast={showToast} />;
        case "notifications":
          return (
            <div className="p-8 max-w-2xl mx-auto space-y-4">
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider mb-4">
                <Bell className="w-5 h-5 text-emerald-500" /> Notifications Inbox
              </h2>
              {notifications.length === 0 ? (
                <p className="p-6 bg-slate-50 dark:bg-slate-900 border text-xs text-center text-slate-400 rounded-2xl">
                  No alerts or notifications recorded.
                </p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && handleMarkNotificationRead(notif.id)}
                      className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl flex justify-between items-center transition-all cursor-pointer ${
                        notif.isRead ? "border-slate-200 dark:border-slate-800 opacity-70" : "border-emerald-500 bg-emerald-500/5 shadow-sm"
                      }`}
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-800 dark:text-white">{notif.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{notif.message}</p>
                        <span className="text-[9px] text-slate-400 block mt-1">{notif.createdDate}</span>
                      </div>
                      {!notif.isRead && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg shrink-0">
                          Mark Read
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        case "profile":
          return <StudentProfile userId={user.id} showToast={showToast} />;
        default:
          return <StudentCatalog userId={user.id} showToast={showToast} />;
      }
    }
  };

  return (
    <div className={`min-h-screen font-sans ${darkMode ? "dark bg-slate-950" : "bg-slate-50"} transition-colors duration-300 flex flex-col`}>
      
      {/* Dynamic Main view switcher */}
      {!user ? (
        <AuthPages onLoginSuccess={handleLoginSuccess} showToast={showToast} />
      ) : (
        <div className="flex h-screen overflow-hidden">
          
          {/* Static Navigation Sidebar */}
          <Sidebar
            role={user.role}
            activeView={activeView}
            setActiveView={setActiveView}
            onLogout={handleLogout}
            userName={user.fullName}
          />

          {/* Core Content Deck */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors">
            <Navbar
              userId={user.id}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              activeViewTitle={activeView}
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationRead}
            />
            <main className="flex-1 pb-16 bg-slate-50 dark:bg-slate-950 transition-colors">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderContentView()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

        </div>
      )}

      {/* Lightweight Custom Toast notifications overlay */}
      <div className="fixed top-6 right-6 z-50 space-y-3.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="pointer-events-auto"
            >
              <div className={`p-4 rounded-2xl shadow-xl flex items-start gap-3 border text-xs font-semibold ${
                toast.type === "success"
                  ? "bg-slate-900 text-white border-slate-800"
                  : toast.type === "error"
                  ? "bg-rose-900 text-rose-100 border-rose-800"
                  : "bg-blue-900 text-blue-100 border-blue-800"
              }`}>
                <div className="flex-1">{toast.message}</div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
