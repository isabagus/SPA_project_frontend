"use client";
import React, { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  REPORTS,
  termToSlug,
  subjectToSlug,
} from "../reportData";

// ─── Content Component ─────────────────────────────────────────────────────────
function ReportDetailContent() {
  const params = useParams();
  const slug = params.term as string;

  const report = REPORTS.find((r) => termToSlug(r) === slug);

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-5xl">📭</div>
        <p className="text-gray-500 dark:text-gray-400 font-semibold">
          Report card not found.
        </p>
        <Link
          href="/parent/report"
          className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Back to Report Card List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* ── Header & Navigation ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-white/[0.03] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <nav className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <Link
            href="/parent/report"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
          >
            Grade Report
          </Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-gray-600 dark:text-gray-300 font-semibold uppercase tracking-wider">
            {report.term} — {report.academicYear}
          </span>
        </nav>
      </div>

      {/* ── SIMPLIFIED TABLE VIEW ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 w-16 text-center">No</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">Subject</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 text-center">Grade</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {report.subjects.map((subj, index) => (
                <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 text-sm font-mono text-gray-500 text-center">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800 dark:text-white/90">
                        {subj.name}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                        {subj.teacher}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-center font-black text-gray-800 dark:text-white tabular-nums">
                    {parseFloat(subj.average).toFixed(1)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/parent/report/${slug}/${subjectToSlug(subj.name)}`}
                      className="inline-block px-4 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-all"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ReportDetailPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Loading Report...</div>}>
      <ReportDetailContent />
    </Suspense>
  );
}