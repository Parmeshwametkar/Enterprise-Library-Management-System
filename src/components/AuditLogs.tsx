/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { ShieldCheck, Calendar, Activity, RefreshCw } from "lucide-react";
import { AuditLog } from "../types.js";

interface AuditLogsProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AuditLogs({ showToast }: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/audit-logs");
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (e) {
      showToast("Error loading audit records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div id="audit-logs-root" className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Security & Audit Logs</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Verify system activity, trace administrative modifications, and log authentication sessions.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-3 py-1.8 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
        </button>
      </div>

      {/* Logs Card list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4.5 h-4.5 text-emerald-500" /> Active System Audit Logs
          </span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Compliance Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Timestamp</th>
                <th className="p-4">Action Event</th>
                <th className="p-4">Modified By</th>
                <th className="p-4">Details Summary</th>
                <th className="p-4 pr-6 text-right">Terminal IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium text-slate-600 dark:text-slate-350">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No auditable events logged in the system database.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 pl-6 font-mono text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {log.action}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {log.username}
                    </td>
                    <td className="p-4 italic">
                      {log.details}
                    </td>
                    <td className="p-4 pr-6 text-right font-mono text-[11px] text-slate-400">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
