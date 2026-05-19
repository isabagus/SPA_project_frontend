"use client";
import React, { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";

function ReportDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get('report_id');

  const { data: report, isLoading } = useQuery({
    queryKey: ['report-detail', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      const response = await api.get(`/parent/children/report/${reportId}`);
      return response.data.data;
    },
    enabled: !!reportId
  });

  const handleDownload = async () => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
      const response = await api.get(`/parent/children/report/${reportId}/export`, {
        responseType: 'blob', // Penting untuk file binary
      });

      // Buat URL dari blob dan trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report-${report?.student?.name_student}-${report?.subject?.category_subject}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Gagal mendownload PDF. Silakan coba lagi.');
    }
  };

  if (isLoading) return <div className="p-10 text-center text-gray-500">Memuat rincian nilai...</div>;
  if (!report) return <div className="p-10 text-center text-red-500">Data raport tidak ditemukan.</div>;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* ── Breadcrumbs ────────────────────────────────────────── */}
      <nav className="flex text-sm text-gray-500 gap-2 items-center">
        <Link href="/parent" className="hover:text-brand-600 transition-colors">Dashboard</Link>
        <span>/</span>
        <button 
          onClick={() => router.back()} 
          className="hover:text-brand-600 transition-colors"
        >
          Laporan Nilai
        </button>
        <span>/</span>
        <span className="font-bold text-gray-900 dark:text-white">{report.subject?.category_subject}</span>
      </nav>

      {/* ── Header ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
              {report.subject?.category_subject}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Siswa: <span className="font-bold text-gray-900 dark:text-white">{report.student?.name_student}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={handleDownload}
               className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 shadow-lg shadow-brand-200 dark:shadow-none transition-all"
             >
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                 <polyline points="7 10 12 15 17 10"></polyline>
                 <line x1="12" y1="15" x2="12" y2="3"></line>
               </svg>
               Download PDF
             </button>
             <div className="bg-brand-50 dark:bg-brand-900/20 px-6 py-3 rounded-2xl border border-brand-100 dark:border-brand-800 text-center">
               <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1">Rata-rata Mapel</p>
               <p className="text-3xl font-black text-brand-600">{parseFloat(report.average_value).toFixed(2)}</p>
             </div>
          </div>
        </div>
      </div>

      {/* ── Rincian Nilai ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rincian Kriteria Penilaian</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider w-1/3">Kriteria & Indikator</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-center">Nilai (1.00 - 3.00)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Evaluasi Guru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {report.report_details?.map((detail: any) => (
                <tr key={detail.id} className="hover:bg-gray-50 dark:hover:bg-brand-900/10 transition-colors">
                  <td className="px-6 py-5">
                    <p className="text-[10px] font-bold text-brand-600 uppercase mb-1">{detail.rubric?.rubric_name}</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {detail.criteria?.criteria_name}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-black shadow-sm ${
                      parseFloat(detail.score) >= 2.5 ? 'bg-success-100 text-success-700' :
                      parseFloat(detail.score) >= 2.0 ? 'bg-brand-100 text-brand-700' :
                      'bg-warning-100 text-warning-700'
                    }`}>
                      {parseFloat(detail.score).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                      "{detail.description_subject || 'Tidak ada deskripsi tambahan.'}"
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Catatan Mentor ─────────────────────────────────────── */}
      <div className="bg-gray-900 dark:bg-black rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3L14.017 3C14.017 1.89543 14.9124 1 16.017 1H19.017C21.2261 1 23.017 2.79086 23.017 5V15C23.017 18.3137 20.3307 21 17.017 21H14.017Z" />
            <path d="M1.017 21L1.017 18C1.017 16.8954 1.91243 16 3.017 16H6.017C6.56928 16 7.017 15.5523 7.017 15V9C7.017 8.44772 6.56928 8 6.017 8H3.017C1.91243 8 1.017 7.10457 1.017 6V3L1.017 3C1.017 1.89543 1.91243 1 3.017 1H6.017C8.22614 1 10.017 2.79086 10.017 5V15C10.017 18.3137 7.33072 21 4.017 21H1.017Z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
           <span className="w-2 h-8 bg-brand-500 rounded-full"></span>
           Catatan Mentor
        </h3>
        <p className="text-gray-300 italic leading-relaxed text-lg">
          "{report.mentor_note || 'Belum ada catatan mentor untuk mata pelajaran ini.'}"
        </p>
      </div>
    </div>
  );
}

export default function ReportDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">Loading report details...</div>}>
      <ReportDetailContent />
    </Suspense>
  );
}
