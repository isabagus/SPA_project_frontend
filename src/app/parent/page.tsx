"use client";

import React, { useState, useEffect } from 'react';
import WelcomeBanner from '@/components/common/WelcomeBanner';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import Link from 'next/link';

export default function ParentDashboard() {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  // 1. Fetch Children (Daftar Anak)
  const { data: children, isLoading: loadingChildren } = useQuery({
    queryKey: ['parent-children'],
    queryFn: async () => {
      const response = await api.get('/parent/children');
      return response.data.data;
    }
  });

  // Set default child
  useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].student_id);
    }
  }, [children, selectedChildId]);

  // 2. Fetch Academic Reports for selected child
  const { data: reports, isLoading: loadingReports } = useQuery({
    queryKey: ['student-reports', selectedChildId],
    queryFn: async () => {
      if (!selectedChildId) return null;
      const response = await api.get(`/parent/children/${selectedChildId}/reports`);
      return response.data.data;
    },
    enabled: !!selectedChildId
  });

  const selectedChild = children?.find((c: any) => c.student_id === selectedChildId);
  const reportList = reports || [];

  // Calculate Average if needed
  const averageScore = reportList.length > 0 
    ? (reportList.reduce((acc: number, curr: any) => acc + parseFloat(curr.average_value || 0), 0) / reportList.length).toFixed(2)
    : "0.00";

  const stats = [
    { 
      label: "Average Score", 
      value: loadingReports ? "..." : averageScore, 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: "text-brand-600",
      bg: "bg-brand-50"
    },
    { 
      label: "Current Class", 
      value: selectedChild?.level_class || "...", 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    { 
      label: "Total Subjects", 
      value: loadingReports ? "..." : `${reportList.length} Subjects`, 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
  ];

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 animate-in fade-in duration-500">
      {/* Top Section: Header & Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <WelcomeBanner role="parent" />
        </div>

        {/* Child Selector */}
        {children && children.length > 1 && (
          <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-2">Child:</span>
             <div className="flex gap-1">
                {children.map((child: any) => (
                  <button
                    key={child.student_id}
                    onClick={() => setSelectedChildId(child.student_id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedChildId === child.student_id 
                      ? "bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-none" 
                      : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {child.name_student}
                  </button>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 transition-all hover:translate-y-[-2px]">
            <div className={`p-3 rounded-xl ${item.bg} ${item.color} shrink-0`}>
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{item.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Grade Summary */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Grade Summary for {selectedChild?.name_student}</h2>
            <Link 
               href={selectedChildId ? `/parent/report?student_id=${selectedChildId}` : "#"} 
               className="text-sm font-bold text-brand-600 hover:underline"
            >
               View Full Report Card
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            {loadingReports ? (
              <div className="p-12 text-center text-gray-400 italic">Loading grades...</div>
            ) : reportList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Average Score</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {reportList.map((report: any) => (
                      <tr key={report.report_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{report.category_subject}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-medium">{report.academic_year} • {report.term}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-lg font-black ${parseFloat(report.average_value) >= 2.5 ? 'text-success-600' : 'text-brand-600'}`}>
                            {report.average_value}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className="px-2 py-1 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 text-[10px] font-black uppercase tracking-tight rounded-full">
                             Completed
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 italic">No grades recorded for this period.</div>
            )}
          </div>
        </div>

        {/* Right Column: Mentor Notes */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Progress Notes</h2>
          
          <div className="bg-brand-600 rounded-3xl p-6 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden">
             {/* Decorative pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <h4 className="font-bold mb-4 uppercase text-xs tracking-widest opacity-80 flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
               Affective Note
            </h4>
            <div className="relative z-10">
              {reportList[0]?.mentor_note ? (
                <p className="text-sm leading-relaxed font-medium italic">
                  "{reportList[0].mentor_note}"
                </p>
              ) : (
                <p className="text-sm leading-relaxed font-medium italic opacity-70">
                  No mentor comments shared at this time.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Quick Actions</h4>
            <div className="flex flex-col gap-3">
               <Link 
                  href={selectedChildId ? `/parent/report?student_id=${selectedChildId}` : "#"} 
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-brand-500 hover:text-white transition-all"
               >
                  View All Grades
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
               </Link>
               <button className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-indigo-500 hover:text-white transition-all">
                  Download Report Card PDF
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}