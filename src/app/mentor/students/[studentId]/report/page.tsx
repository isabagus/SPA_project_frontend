"use client";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, BookOpen, User, Star, Award } from 'lucide-react';

type Report = {
  report_id: number;
  subject_id: number;
  average_value: number;
  subject: {
    category_subject: string;
    teacher?: {
      name: string;
    };
  };
  report_details?: any[];
};

export default function MentorStudentReportPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId;
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // 1. Fetch Academic Summary
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['mentor-student-report', studentId],
    queryFn: async () => {
      const res = await api.get(`/mentor/students/${studentId}/academic-report`);
      return res.data.data as Report[];
    },
    enabled: !!studentId
  });

  // 2. Fetch Detail for Modal (Optional, but we use summary data for simplicity first)
  const openDetail = (report: Report) => {
    setSelectedReport(report);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-110 transition-transform text-emerald-600"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Student Academic Progress</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Grade Monitoring & Curriculum Achievement</p>
            </div>
          </div>

          <div className="bg-emerald-500 text-white px-8 py-4 rounded-3xl shadow-xl shadow-emerald-500/20 flex items-center gap-4">
            <Award className="w-6 h-6" />
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Academic Average</p>
              <p className="text-xl font-black">
                {(reports.reduce((acc, curr) => acc + Number(curr.average_value), 0) / (reports.length || 1)).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Subjects List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div 
              key={report.report_id}
              onClick={() => openDetail(report)}
              className="group bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-500 cursor-pointer relative overflow-hidden active:scale-95"
            >
              {/* Background Accent */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl group-hover:bg-emerald-500 transition-colors">
                    <BookOpen className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Score</p>
                    <p className={`text-3xl font-black ${Number(report.average_value) >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {Number(report.average_value).toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="mt-auto">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-emerald-500 transition-colors">
                    {report.subject.category_subject}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-400">
                    <User className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Teacher: {report.subject.teacher?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700/50">
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Rubric Details</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {reports.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-700">
             <div className="bg-gray-50 dark:bg-gray-900 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-10 h-10 text-gray-300" />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Assessment Data Available</h2>
             <p className="text-gray-400 max-w-xs mx-auto">This student does not have academic data for this academic year period.</p>
          </div>
        )}
      </div>

      {/* Detail Modal (ReadOnly) */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"
            onClick={() => setSelectedReport(null)}
          ></div>
          <div className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[85vh] rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col animate-in fade-in zoom-in duration-300">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{selectedReport.subject.category_subject}</h2>
                  <p className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest italic">Read-Only Monitoring Mode</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-1 gap-6">
                {selectedReport.report_details && selectedReport.report_details.length > 0 ? (
                  selectedReport.report_details.map((detail: any, idx: number) => (
                    <div 
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-transparent hover:border-emerald-500/10 transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center font-black text-emerald-500 shadow-sm">
                              {idx + 1}
                           </div>
                           <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                              {detail.rubric?.rubric_name || 'Assessment Criteria'}
                           </h4>
                        </div>
                        <div className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Score:</span>
                           <span className="text-xl font-black text-emerald-500">{detail.score}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed italic">
                          {detail.criteria?.criteria_name || 'No criteria description available.'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-400 font-medium">No detailed assessment rubrics available for this subject.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-end">
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-8 py-4 bg-gray-900 dark:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
