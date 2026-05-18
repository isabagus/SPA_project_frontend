"use client";

import React from 'react';
import WelcomeBanner from '@/components/common/WelcomeBanner';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import Link from 'next/link';

export default function MentorDashboard() {
  // Fetch User Profile for Academic Year
  const { data: userData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get('/auth/check');
      return response.data.user;
    }
  });

  // 1. Fetch Classes assigned to Mentor
  const { data: classesResponse, isLoading: loadingClasses } = useQuery({
    queryKey: ['mentor-classes'],
    queryFn: async () => {
      const response = await api.get('/mentor/classes');
      return response.data.data;
    }
  });

  // 2. Fetch Students for the first class (default)
  const firstClass = classesResponse?.[0]?.level_class;
  const { data: studentsResponse, isLoading: loadingStudents } = useQuery({
    queryKey: ['mentor-students', firstClass],
    queryFn: async () => {
      if (!firstClass) return null;
      const response = await api.get(`/mentor/students?level_class=${firstClass}`);
      return response.data.data;
    },
    enabled: !!firstClass
  });

  const students = studentsResponse?.students || [];
  const currentClass = studentsResponse?.current_class || "...";

  const stats = [
    { 
      label: "Kelas Bimbingan", 
      value: currentClass, 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: "text-brand-600",
      bg: "bg-brand-50"
    },
    { 
      label: "Total Siswa", 
      value: loadingStudents ? "..." : `${students.length} Siswa`, 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    { 
      label: "Tahun Ajaran", 
      value: userData?.academic_year || "...", 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "text-warning-600",
      bg: "bg-warning-50"
    },
  ];

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 animate-in fade-in duration-500">
      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WelcomeBanner role="mentor" />
        </div>
        
        {/* Quick Actions Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Aksi Mentor</h3>
          <div className="flex flex-col gap-2">
            <Link href="/mentor/students" className="flex items-center justify-between p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-bold text-sm hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors">
              Input Catatan Mentor
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </Link>
          </div>
        </div>
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

      {/* Main Content: Student List */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Daftar Siswa Kelas {currentClass}</h2>
          <Link href="/mentor/students" className="text-sm font-bold text-brand-600 hover:underline">Lihat Semua</Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {loadingStudents ? (
            <div className="p-12 text-center text-gray-400 italic">Memuat data siswa...</div>
          ) : students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Nama Siswa</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {students.slice(0, 10).map((student: any) => (
                    <tr key={student.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 text-xs font-bold">
                            {student.name_student.charAt(0)}
                          </div>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{student.name_student}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link 
                          href={`/mentor/students?student_id=${student.student_id}`}
                          className="inline-flex items-center justify-center px-4 py-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-bold text-xs rounded-lg hover:bg-brand-100 transition-colors"
                        >
                          Beri Catatan
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length > 10 && (
                <div className="p-4 text-center border-t border-gray-100 dark:border-gray-700">
                   <Link href="/mentor/students" className="text-xs font-bold text-gray-500 hover:text-brand-600 transition-colors">
                      Lihat {students.length - 10} siswa lainnya &rarr;
                   </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400 italic">Belum ada siswa di kelas ini.</div>
          )}
        </div>
      </div>
    </div>
  );
}