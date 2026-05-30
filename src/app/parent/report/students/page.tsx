"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/axios";

export default function ParentStudentCoverPage() {
  const { data: children, isLoading } = useQuery({
    queryKey: ['parent-children'],
    queryFn: async () => {
      const response = await api.get('/parent/children');
      return response.data.data;
    }
  });

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 md:p-10">
      {/* ── Header Section ─────────────────────────────────────── */}
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
          Select <span className="text-brand-600">Student</span> Profile
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
          Please select your child's profile to view their academic achievements and in-depth teacher evaluations.
        </p>
      </div>

      {/* ── Students Cards Grid ────────────────────────────────── */}
      {isLoading ? (
        <div className="flex gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="w-72 h-96 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {children?.map((child: any) => (
            <Link 
              key={child.student_id} 
              href={`/parent/report?student_id=${child.student_id}`}
              className="group relative"
            >
              {/* Card Container */}
              <div className="relative w-72 md:w-80 h-auto bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 transition-all duration-500 hover:-translate-y-4 hover:border-brand-300 dark:hover:border-brand-500 overflow-hidden">
                
                {/* Decorative Background Blob */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand-50 dark:bg-brand-900/20 rounded-full blur-3xl group-hover:bg-brand-100 transition-colors duration-500"></div>

                {/* Avatar / Initial */}
                <div className="relative w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-brand-200 dark:shadow-none group-hover:scale-110 transition-transform duration-500">
                  {child.name_student.charAt(0)}
                </div>

                {/* Student Info */}
                <div className="relative space-y-2">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">
                    {child.name_student}
                  </h2>
                  <p className="text-sm font-bold text-brand-600 uppercase tracking-widest opacity-80">
                    {child.level_class}
                  </p>
                  <div className="pt-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="w-2 h-2 rounded-full bg-success-500"></span>
                      NIS: {child.nis}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="w-2 h-2 rounded-full bg-brand-400"></span>
                      {child.academic_year}
                    </div>
                  </div>
                </div>

                {/* Button Action Overlay */}
                <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-700">
                  <span className="flex items-center justify-between text-sm font-black text-brand-600 group-hover:translate-x-2 transition-transform">
                    Open Report Card
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="mt-16 text-gray-400 text-sm flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        Data is encrypted and secure
      </div>
    </div>
  );
}
