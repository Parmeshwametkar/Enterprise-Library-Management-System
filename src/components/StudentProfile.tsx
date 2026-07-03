/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, Phone, BookMarked, ShieldCheck, Lock, CheckCircle } from "lucide-react";
import { User as StudentUser } from "../types.js";

interface StudentProfileProps {
  userId: string;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function StudentProfile({ userId, showToast }: StudentProfileProps) {
  const [profile, setProfile] = useState<StudentUser | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");

  // Password Fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/students");
      if (res.ok) {
        const students = await res.json();
        const mine = students.find((s: StudentUser) => s.id === userId);
        if (mine) {
          setProfile(mine);
          setFullName(mine.fullName);
          setPhone(mine.phone || "");
          setDepartment(mine.department || "Computer Science");
          setAdmissionNo(mine.admissionNo || "");
        }
      }
    } catch (e) {
      showToast("Error loading profile details", "error");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/students/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          department,
          admissionNo,
          userId
        })
      });

      if (res.ok) {
        showToast("Profile details updated successfully!", "success");
        fetchProfile();
      } else {
        showToast("Failed to save profile changes", "error");
      }
    } catch (err) {
      showToast("Server communication error", "error");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill all password fields.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword
        })
      });

      if (res.ok) {
        showToast("Security password updated successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to update security credentials", "error");
      }
    } catch (err) {
      showToast("Server error", "error");
    }
  };

  if (!profile) {
    return <p className="p-8 text-xs text-slate-400">Loading profile...</p>;
  }

  return (
    <div id="student-profile-root" className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header card */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Account & Profile Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Manage contact information, university department registries, and access credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card View */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xl uppercase rounded-full mx-auto flex items-center justify-center shadow-inner">
            {profile.fullName.charAt(0)}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base leading-tight">{profile.fullName}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{profile.studentId}</p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/40 text-left text-[11px] text-slate-500 space-y-1.5 font-medium">
            <p className="flex justify-between"><span>Email Address:</span> <span className="font-semibold text-slate-700 dark:text-slate-300">{profile.email}</span></p>
            <p className="flex justify-between"><span>Authority level:</span> <span className="font-semibold text-emerald-500 uppercase">{profile.role}</span></p>
            <p className="flex justify-between"><span>Status state:</span> <span className="font-bold text-emerald-500">{profile.status}</span></p>
          </div>

          <div className="pt-2 text-xs text-slate-400 flex items-center gap-1 justify-center">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" /> Secure digital student credential
          </div>
        </div>

        {/* Update Profile Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4 lg:col-span-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <User className="w-4 h-4 text-emerald-500" /> Personal Identity details
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">FULL LEGAL NAME</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PHONE NUMBER</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">UNIVERSITY DEPARTMENT</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <option value="Computer Science">Computer Science & Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics & Telecom</option>
                <option value="Mechanical">Mechanical Engineering</option>
                <option value="General Science">General Science</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ADMISSION REGISTRATION NO.</label>
              <input
                type="text"
                required
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow cursor-pointer transition-all active:scale-98"
            >
              Save Profile changes
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4 lg:col-span-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Lock className="w-4 h-4 text-red-500" /> Security Credentials
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CURRENT PASSWORD</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">NEW PASSWORD</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CONFIRM NEW PASSWORD</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs shadow cursor-pointer transition-all active:scale-98"
            >
              Update Password
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
