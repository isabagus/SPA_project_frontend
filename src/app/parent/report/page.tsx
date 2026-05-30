"use client";
import React, { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";

function ReportPageContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('student_id');

  // 1. Fetch data anak untuk info header
  const { data: children } = useQuery({
    queryKey: ['parent-children'],
    queryFn: async () => {
      const response = await api.get('/parent/children');
      return response.data.data;
    }
  });

  const selectedChild = children?.find((c: any) => c.student_id === Number(studentId));

  // 2. Fetch data raport asli
  const { data: reports, isLoading } = useQuery({
    queryKey: ['student-reports', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const response = await api.get(`/parent/children/${studentId}/reports`);
      return response.data.data;
    },
    enabled: !!studentId
  });

  if (!studentId) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please select a student from the Dashboard first.</p>
        <Link href="/parent" className="text-brand-600 font-bold mt-4 inline-block"> Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Full Grade Report</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Student: <span className="font-bold text-brand-600">{selectedChild?.name_student || '...'}</span> ({selectedChild?.level_class})
          </p>
        </div>

        <Link 
          href="/parent"
          className="px-4 py-2 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
           Back to Dashboard
        </Link>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Loading report card data...</div>
      ) : !reports || reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="text-4xl">📭</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-center">
            No grades have been entered by teachers for this period.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden transition-colors">
          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 w-16 text-center">No</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">Subject</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 text-center">Average Score</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 text-center">Mentor Notes</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {reports.map((report: any, index: number) => (
                  <tr key={report.report_id} className="hover:bg-gray-50 dark:hover:bg-brand-900/20 transition-colors group">
                    <td className="px-6 py-4 text-sm font-mono text-gray-500 text-center">{index + 1}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-800 dark:text-white/90">
                        {report.subject?.category_subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center font-black text-brand-600 tabular-nums">
                      {parseFloat(report.average_value).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 italic max-w-xs truncate">
                      {report.mentor_note || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/parent/report/detail?report_id=${report.report_id}`}
                        className="inline-block px-4 py-1.5 rounded-lg text-[10px] font-bold bg-brand-600 text-white shadow-sm hover:bg-brand-700 transition-all"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Cards */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
            {reports.map((report: any, index: number) => (
              <div key={report.report_id} className="p-5 hover:bg-gray-50 dark:hover:bg-brand-900/10 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3">
                    <span className="text-[10px] font-mono text-gray-400 mt-1">{index + 1}</span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1">
                        {report.subject?.category_subject}
                      </h3>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate max-w-[150px]">
                        {report.mentor_note || 'No mentor comments'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Score</p>
                    <p className="text-lg font-black text-brand-600">{parseFloat(report.average_value).toFixed(2)}</p>
                  </div>
                </div>
                <Link
                  href={`/parent/report/detail?report_id=${report.report_id}`}
                  className="block w-full text-center py-2.5 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-md active:scale-[0.98] transition-all"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading page...</div>}>
      <ReportPageContent />
    </Suspense>
  );
}