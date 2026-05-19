"use client";

import React from 'react';
import WelcomeBanner from '@/components/common/WelcomeBanner';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import Link from 'next/link';

export default function TeacherDashboard() {
  // Fetch User Profile for Academic Year
  const { data: userData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get('/auth/check');
      return response.data.user;
    }
  });

  // Fetch Subjects for Stats and List
  const { data: subjectsResponse, isLoading } = useQuery({
    queryKey: ['teacher-subjects'],
    queryFn: async () => {
      const response = await api.get('/teacher/subjects');
      return response.data.data;
    }
  });

  const subjects = subjectsResponse || [];
  const subjectsWithRubrics = subjects.filter((sub: any) => sub.rubrics && sub.rubrics.length > 0).length;
  
  // Calculate stats based on fetched data
  const stats = [
    { 
      label: "Mata Pelajaran", 
      value: isLoading ? "..." : subjects.length.toString(), 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: "text-brand-600",
      bg: "bg-brand-50"
    },
    { 
      label: "Status Rubrik", 
      value: isLoading ? "..." : `${subjectsWithRubrics}/${subjects.length} Dibuat`, 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-success-600",
      bg: "bg-success-50"
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
      {/* Welcome Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WelcomeBanner role="teacher" />
        </div>
        
        {/* Quick Actions Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Aksi Cepat</h3>
          <div className="flex flex-col gap-2">
            <Link href="/teacher/rubrics" className="flex items-center justify-between p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-bold text-sm hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors">
              Atur Master Rubrik
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/teacher/students" className="flex items-center justify-between p-3 rounded-xl bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 font-bold text-sm hover:bg-success-100 dark:hover:bg-success-900/40 transition-colors">
              Input Nilai Siswa
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
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
        {/* Left Column: Subjects List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Mata Pelajaran Saya</h2>
            <Link href="/teacher/students" className="text-sm font-bold text-brand-600 hover:underline">Lihat Semua</Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : subjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((sub: any) => (
                <div key={sub.subject_id} className="group bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-brand-500 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg text-brand-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-500 rounded uppercase">{sub.term}</span>
                  </div>
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-brand-600 transition-colors">{sub.category_subject}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{sub.level_class}</p>
                  
                  <Link 
                    href={`/teacher/students?subject_id=${sub.subject_id}`}
                    className="w-full inline-flex items-center justify-center py-2 px-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-brand-500 hover:text-white text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition-all"
                  >
                    Buka Penilaian
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-12 text-center">
              <p className="text-gray-400 font-medium">Belum ada mata pelajaran yang ditugaskan.</p>
            </div>
          )}
        </div>

        {/* Right Column: Deadlines & Info */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pemberitahuan</h2>
          
          <div className="bg-brand-600 rounded-3xl p-6 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden">
             {/* Decorative pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <h4 className="font-bold mb-2">Batas Pengisian Nilai</h4>
            <p className="text-xs text-brand-100 leading-relaxed mb-4">
              Pastikan seluruh nilai dan deskripsi siswa telah selesai diinput sebelum tanggal pembagian raport.
            </p>
            <div className="flex items-center gap-2 font-bold text-sm bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              5 Hari Lagi
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Panduan Pengisian</h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <p className="text-xs text-gray-500">Tentukan <strong>Master Rubrik</strong> terlebih dahulu untuk setiap kategori penilaian.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <p className="text-xs text-gray-500">Pilih Mata Pelajaran lalu masukkan nilai sesuai kriteria yang telah dibuat.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <p className="text-xs text-gray-500">Klik <strong>Simpan</strong> untuk menyimpan draf atau <strong>Selesaikan</strong> untuk finalisasi.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}