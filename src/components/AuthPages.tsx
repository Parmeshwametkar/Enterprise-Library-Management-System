/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, ShieldCheck, UserCheck, Mail, Lock, User, Phone, BookMarked, HelpCircle, ArrowLeft } from "lucide-react";

interface AuthPagesProps {
  onLoginSuccess: (user: any, token: string) => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AuthPages({ onLoginSuccess, showToast }: AuthPagesProps) {
  const [view, setView] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Computer Science");
  const [admissionNo, setAdmissionNo] = useState("");
  const [loading, setLoading] = useState(false);

  // Quick Login Assist
  const handleQuickLogin = async (role: "admin" | "student") => {
    setLoading(true);
    const mockEmail = role === "admin" ? "admin@library.com" : "student@library.com";
    const mockPassword = role === "admin" ? "admin123" : "student123";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mockEmail, password: mockPassword })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Logged in successfully as ${data.user.fullName}!`, "success");
        onLoginSuccess(data.user, data.token);
      } else {
        showToast(data.message || "Failed to login", "error");
      }
    } catch (err) {
      showToast("Network error during login", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please fill in all fields", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Welcome back, ${data.user.fullName}!`, "success");
        onLoginSuccess(data.user, data.token);
      } else {
        showToast(data.message || "Invalid credentials", "error");
      }
    } catch (err) {
      showToast("Server error during login", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !phone || !admissionNo) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, phone, department, admissionNo })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Registration successful!", "success");
        onLoginSuccess(data.user, data.token);
      } else {
        showToast(data.message || "Registration failed", "error");
      }
    } catch (err) {
      showToast("Server error during registration", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast("Please enter your email", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        setView("reset");
      } else {
        showToast(data.message || "Email not found", "error");
      }
    } catch (err) {
      showToast("Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please fill in email and new password", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        setView("login");
      } else {
        showToast(data.message || "Reset failed", "error");
      }
    } catch (err) {
      showToast("Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-root" className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div id="auth-container" className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 relative overflow-hidden">
        
        {/* Visual Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 shadow-md">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
            Athenaeum
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise Library Management Suite
          </p>
        </div>

        {/* Views */}
        {view === "login" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 text-center">
              Account Login
            </h2>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@library.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">PASSWORD</label>
                  <button type="button" onClick={() => setView("forgot")} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Sign In"}
              </button>
            </form>

            {/* Quick login bypass for seamless testing */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60">
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-3 font-medium">
                DEMO QUICK SIGN IN
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("admin")}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-200/50 dark:border-slate-800 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Admin Portal
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("student")}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-200/50 dark:border-slate-800 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-500" /> Student Portal
                </button>
              </div>
            </div>

            <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-6">
              New student borrower?{" "}
              <button onClick={() => setView("register")} className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Create an Account
              </button>
            </p>
          </motion.div>
        )}

        {view === "register" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 text-center">
              Student Registration
            </h2>
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">FULL NAME *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">EMAIL ADDRESS *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">PHONE NUMBER *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 99..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">ADMISSION NO. *</label>
                  <div className="relative">
                    <BookMarked className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={admissionNo}
                      onChange={(e) => setAdmissionNo(e.target.value)}
                      placeholder="e.g. CS-2026-12"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">DEPARTMENT</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Computer Science">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics & Telecom</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="Civil">Civil Engineering</option>
                  <option value="General Science">General Science</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">PASSWORD *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose password"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? "Registering..." : "Create Account"}
              </button>
            </form>

            <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-4">
              Already have an account?{" "}
              <button onClick={() => setView("login")} className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Sign In
              </button>
            </p>
          </motion.div>
        )}

        {view === "forgot" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <button onClick={() => setView("login")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 mb-4 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </button>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Forgot Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Enter your registered email below, and we'll send a simulation recovery token to reset your password.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@library.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-50"
              >
                {loading ? "Sending..." : "Request Reset Link"}
              </button>
            </form>
          </motion.div>
        )}

        {view === "reset" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Reset Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Confirm your email and enter a new password to complete the recovery.
            </p>
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">CONFIRM EMAIL</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@library.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">NEW PASSWORD</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Complete Reset"}
              </button>
            </form>
          </motion.div>
        )}

      </div>
    </div>
  );
}
