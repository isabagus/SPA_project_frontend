"use client";
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import Link from 'next/link';
import MentorEvaluationModal from './MentorEvaluationModal';

type Student = {
  student_id: number;
  nis: string;
  name_student: string;
  status_note: 'completed' | 'none';
  mentor_note: string | null;
};

type MentorClass = {
  level_class: string;
  mentor_id: number;
};

export default function MentorStudentsPage() {
  const [activeLevel, setActiveLevel] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // 1. Fetch Daftar Kelas Mentor
  const { data: mentorClasses = [] } = useQuery({
    queryKey: ['mentor-classes'],
    queryFn: async () => {
      const res = await api.get('/mentor/classes');
      return res.data.data as MentorClass[];
    }
  });

  // Set default active level
  useEffect(() => {
    if (mentorClasses && mentorClasses.length > 0 && !activeLevel) {
      setActiveLevel(mentorClasses[0].level_class);
    }
  }, [mentorClasses, activeLevel, setActiveLevel]);

  // 2. Fetch Daftar Siswa di Kelas Terpilih
  const { data: studentData, isLoading } = useQuery({
    queryKey: ['mentor-students', activeLevel],
    queryFn: async () => {
      const res = await api.get(`/mentor/students?level_class=${activeLevel}`);
      return res.data.data;
    },
    enabled: !!activeLevel
  });

  const students = studentData?.students || [];

  const openEvaluationModal = (studentId: number) => {
    setSelectedStudentId(studentId);
    setIsModalOpen(true);
  };

  const filteredStudents = students.filter((s: Student) => 
    s.name_student.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nis.includes(searchTerm)
  );

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-2xl">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 15.292m0-15.292a4 4 0 110 15.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
             <div>
                 <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Mentor Evaluation</h1>
                 <p className="text-gray-500 dark:text-gray-400 text-sm font-medium italic">Holistic Mentoring (Affective Domain)</p>
             </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select 
            className="w-full sm:w-auto px-6 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white"
            value={activeLevel}
            onChange={(e) => setActiveLevel(e.target.value)}
          >
            {mentorClasses.map((c: MentorClass) => (
              <option key={c.level_class} value={c.level_class}>{c.level_class}</option>
            ))}
          </select>
          <div className="relative w-full sm:w-64">
             <input 
                 type="text" 
                 placeholder="Search Student..." 
                 className="w-full px-5 py-3 pl-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white font-medium"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
             />
            <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>
      </div>

      {/* Daftar Siswa Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-gray-100 dark:bg-gray-700"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                  <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-2xl"></div>
                <div className="flex gap-2">
                  <div className="h-12 flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl"></div>
                  <div className="h-12 flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student: Student) => (
            <div 
                key={student.student_id} 
                className="group bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3">
                <span className={`px-3 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${student.status_note === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    {student.status_note === 'completed' ? 'Completed' : 'Empty'}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-2xl font-black text-gray-400">
                    {student.name_student.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white leading-tight group-hover:text-emerald-600 transition-colors">{student.name_student}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">NIS: {student.nis}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl min-h-[80px] border border-transparent group-hover:border-emerald-500/10 transition-all">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium italic line-clamp-3 leading-relaxed">
                    {student.mentor_note || "No evaluation comments yet..."}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => openEvaluationModal(student.student_id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Edit Evaluation
                  </button>
                  <Link 
                    href={`/mentor/students/${student.student_id}/report`}
                    className="flex-1 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-gray-200 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all text-center flex items-center justify-center"
                  >
                    View Report
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Evaluasi Mentor */}
      {isModalOpen && selectedStudentId && (
        <MentorEvaluationModal 
          studentId={selectedStudentId} 
          levelClass={activeLevel} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
