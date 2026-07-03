/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Search, Edit3, X, User, CheckCircle, ShieldAlert } from "lucide-react";
import { User as StudentUser } from "../types.js";

interface StudentManagementProps {
  userId: string;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function StudentManagement({ userId, showToast }: StudentManagementProps) {
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students");
      if (res.ok) {
        setStudents(await res.json());
      }
    } catch (e) {
      showToast("Error loading student directory", "error");
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const payload = {
      fullName,
      phone,
      department,
      admissionNo,
      status,
      userId
    };

    try {
      const res = await fetch(`/api/students/${selectedStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("Student profile updated successfully!", "success");
        setShowEditModal(false);
        fetchStudents();
      } else {
        showToast("Failed to update student profile", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  const handleToggleStatus = async (student: StudentUser) => {
    const nextStatus = student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const payload = {
      ...student,
      status: nextStatus,
      userId
    };

    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(`Student status toggled to ${nextStatus}`, "success");
        fetchStudents();
      } else {
        showToast("Failed to change student status", "error");
      }
    } catch (err) {
      showToast("Server error", "error");
    }
  };

  const openEdit = (s: StudentUser) => {
    setSelectedStudent(s);
    setFullName(s.fullName);
    setPhone(s.phone || "");
    setDepartment(s.department || "General Science");
    setAdmissionNo(s.admissionNo || "");
    setStatus(s.status);
    setShowEditModal(true);
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.studentId && s.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div id="student-mgmt-root" className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Registered Student Registry</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Verify credentials, configure borrowing status, and manage profile directories.</p>
        </div>
      </div>

      {/* Search Filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students by name, email, admission registration or ID..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Student ID & Name</th>
                <th className="p-4">Contact Details</th>
                <th className="p-4">Department Track</th>
                <th className="p-4">Admission Registration</th>
                <th className="p-4">Access Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No registered students found matching search.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 pl-6 flex gap-3.5 items-center">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold uppercase shrink-0">
                        {stu.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-tight">{stu.fullName}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{stu.studentId || "PENDING"}</p>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-medium text-slate-700 dark:text-slate-300">{stu.email}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{stu.phone || "No phone added"}</p>
                    </td>

                    <td className="p-4">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded-lg">
                        {stu.department || "General"}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                        {stu.admissionNo || stu.id}
                      </span>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(stu)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          stu.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                        title="Click to suspend or enable access"
                      >
                        {stu.status === "ACTIVE" ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> Approved / Active
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" /> Suspended / Blocked
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => openEdit(stu)}
                        className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 cursor-pointer transition-colors"
                        title="Edit Profile Info"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            
            <button onClick={() => setShowEditModal(false)} className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-4">
              Edit Student Profile
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">STUDENT NAME *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">PHONE NUMBER</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">DEPARTMENT TRACK</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
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
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">ADMISSION NO. *</label>
                <input
                  type="text"
                  required
                  value={admissionNo}
                  onChange={(e) => setAdmissionNo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">ACCESS PRIVILEGE</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white font-semibold"
                >
                  <option value="ACTIVE" className="text-emerald-500">ACTIVE (Approved Borrowing)</option>
                  <option value="INACTIVE" className="text-red-500">INACTIVE (Locked Borrowing)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
