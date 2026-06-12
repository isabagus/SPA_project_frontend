"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

type Subject = {
  subject_id: number;
  category_subject: string;
  level_class: string;
  term: string;
};

type Student = {
  student_id: number;
  nis: string;
  name_student: string;
  level_class: string;
  gender: string;
  address: string;
  status_score: 'completed' | 'draft' | 'none';
  completion: number;
  average_value: number | null;
};

export default function TeacherStudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Selection States (Filter UI)
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string>(""); // Format: "category|level"
  const [selectedTerm, setSelectedTerm] = useState<string>("");

  // 1. Fetch Daftar Mata Pelajaran yang diampu Guru
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['teacher-subjects'],
    queryFn: async () => {
      const response = await api.get('/teacher/subjects');
      return response.data.data as Subject[];
    }
  });

  // Handle URL Query Params
  useEffect(() => {
    if (subjects.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const subjectIdParam = params.get('subject') || params.get('subject_id');
      
      if (subjectIdParam) {
        const found = subjects.find(s => s.subject_id === parseInt(subjectIdParam));
        if (found) {
          setSelectedSubjectKey(`${found.category_subject}|${found.level_class}`);
          setSelectedTerm(found.term);
        }
      }
    }
  }, [subjects, setSelectedSubjectKey, setSelectedTerm]);

  // --- Logic Filter Dinamis ---
  // A. Ambil daftar unik "Mapel + Kelas"
  const subjectOptions = useMemo(() => {
    const map = new Map();
    subjects.forEach((s: any) => {
      const key = `${s.category_subject}|${s.level_class}`;
      if (!map.has(key)) {
        map.set(key, { name: s.category_subject, level: s.level_class });
      }
    });
    return Array.from(map.entries());
  }, [subjects]);

  // B. Ambil daftar unik "Term" yang tersedia untuk mapel yang dipilih
  const termOptions = useMemo(() => {
    if (!selectedSubjectKey) return [];
    const [name, level] = selectedSubjectKey.split('|');
    const filtered = subjects.filter((s: any) => s.category_subject === name && s.level_class === level);
    return Array.from(new Set(filtered.map((s: any) => s.term))).sort();
  }, [selectedSubjectKey, subjects]);

  // C. Tentukan subject_id aktif berdasarkan kombinasi filter
  const activeSubjectId = useMemo(() => {
    if (!selectedSubjectKey || !selectedTerm) return null;
    const [name, level] = selectedSubjectKey.split('|');
    const found = subjects.find((s: any) => 
      s.category_subject === name && 
      s.level_class === level && 
      s.term === selectedTerm
    );
    return found?.subject_id || null;
  }, [selectedSubjectKey, selectedTerm, subjects]);

  // Set Default Filters
  useEffect(() => {
    if (subjectOptions.length > 0 && !selectedSubjectKey) {
      setSelectedSubjectKey(subjectOptions[0][0]);
    }
  }, [subjectOptions, selectedSubjectKey]);

  useEffect(() => {
    if (termOptions.length > 0) {
      if (!selectedTerm || !termOptions.includes(selectedTerm)) {
        setSelectedTerm(termOptions[0]);
      }
    }
  }, [termOptions, selectedTerm]);

  // 2. Fetch Daftar Siswa berdasarkan Subject yang dipilih
  const { data: studentsData, isLoading: isLoadingStudents, isFetching: isFetchingStudents } = useQuery({
    queryKey: ['teacher-students', activeSubjectId],
    queryFn: async () => {
      if (!activeSubjectId) return null;
      const response = await api.get(`/teacher/subjects/${activeSubjectId}/students`);
      return response.data.data;
    },
    enabled: !!activeSubjectId
  });

  const students = studentsData?.students || [];
  const currentSubject = studentsData?.subject || null;

  // Filtering di sisi client untuk pencarian nama/nis
  const filteredStudents = students.filter((student: Student) => {
    const matchSearch = student.name_student.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        student.nis.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  if (isLoadingSubjects) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Student Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Viewing student list for <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentSubject?.category_subject || '...'}</span>
          </p>
        </div>

        {/* Filter Group */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="flex flex-col gap-1 min-w-[200px]">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 ml-1">Subject</label>
                <select 
                className="w-full text-xs font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                value={selectedSubjectKey} 
                onChange={(e) => setSelectedSubjectKey(e.target.value)}
                >
                {subjectOptions.map(([key, info]: any) => (
                    <option key={key} value={key}>{info.name} ({info.level})</option>
                ))}
                </select>
            </div>

            <div className="flex flex-col gap-1 min-w-[120px]">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 ml-1">Term</label>
                <select 
                className="w-full text-xs font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                value={selectedTerm} 
                onChange={(e) => setSelectedTerm(e.target.value)}
                >
                {termOptions.map(term => (
                    <option key={term} value={term}>{term}</option>
                ))}
                </select>
            </div>

            <div className="flex flex-col gap-1 min-w-[200px]">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 ml-1">Search Student</label>
                <input 
                    type="text" 
                    placeholder="NIS / Name..." 
                    className="w-full text-xs font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* Tabel Siswa */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden transition-colors relative">
        {(isLoadingStudents || isFetchingStudents) && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500">NIS</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500">Student Name</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500">Gender</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500 text-center">Grading Status</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500 text-center">Average</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filteredStudents.length > 0 ? filteredStudents.map((student: Student) => (
                <tr key={student.student_id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all group">
                  <td className="px-8 py-5 text-sm text-gray-500 font-mono">{student.nis}</td>
                  <td className="px-8 py-5 text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{student.name_student}</td>
                  <td className="px-8 py-5 text-sm text-gray-600 dark:text-gray-400">{student.gender}</td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {student.status_score === 'completed' ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          Completed
                        </span>
                      ) : student.status_score === 'draft' ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                          Draft
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700">
                          Not Graded
                        </span>
                      )}
                      
                      {/* Progress Bar Mini */}
                      {student.status_score !== 'none' && (
                        <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-50 dark:border-gray-800">
                           <div 
                             className={`h-full transition-all duration-500 ${student.status_score === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                             style={{ width: `${student.completion}%` }}
                           ></div>
                        </div>
                      )}
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                        {student.status_score === 'none' ? '0% Completed' : `${student.completion}% Completed`}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center font-black text-indigo-600 dark:text-indigo-400">
                    {student.average_value !== null ? student.average_value : '—'}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => window.location.href = `/teacher/report?student=${student.student_id}&subject=${activeSubjectId}`}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm active:scale-95 ${
                        student.status_score === 'none' 
                        ? "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700" 
                        : "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                      }`}
                    >
                      {student.status_score === 'none' ? "Input Grades" : "Continue Grading"}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                    {isLoadingStudents ? "Loading data..." : "No student data found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
