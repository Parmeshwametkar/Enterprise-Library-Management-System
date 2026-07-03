/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Sun, Moon, Bell, CheckCircle2, Circle } from "lucide-react";
import { Notification } from "../types.js";

interface NavbarProps {
  userId: string;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  activeViewTitle: string;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

export default function Navbar({
  userId,
  darkMode,
  setDarkMode,
  activeViewTitle,
  notifications,
  onMarkAsRead
}: NavbarProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Filter unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Format today's date
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const d = new Date();
    setCurrentTime(d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    }));
  }, []);

  return (
    <header id="app-navbar" className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300">
      
      {/* View Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold tracking-tight text-slate-800 dark:text-white capitalize">
          {activeViewTitle}
        </h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        
        {/* Humble Date Display */}
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {currentTime}
        </span>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-emerald-500 border border-slate-200/50 dark:border-slate-800 transition-all cursor-pointer"
          title="Toggle Light/Dark Theme"
        >
          {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-emerald-500 border border-slate-200/50 dark:border-slate-800 transition-all relative cursor-pointer"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-white dark:border-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Card */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-800 dark:text-white">Alert Notifications</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{unreadCount} Unread</span>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 text-center">No alerts or notifications recorded.</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        onMarkAsRead(notif.id);
                      }}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer flex gap-2.5 items-start ${
                        !notif.isRead ? "bg-slate-50/50 dark:bg-slate-800/10" : ""
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {notif.isRead ? (
                          <CheckCircle2 className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1">
                          {notif.createdDate}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-950/40">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                  End of system notifications
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
