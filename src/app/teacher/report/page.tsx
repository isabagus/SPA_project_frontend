"use client";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from '@/lib/axios';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Helpers ───────────────────────────────────────────────────────────
function getLevelLabel(avg: string | number | null): { label: string; color: string } {
  if (!avg) return { label: "—", color: "text-gray-400 dark:text-gray-500" };
  const v = typeof avg === 'string' ? parseFloat(avg) : avg;
  if (isNaN(v)) return { label: "—", color: "text-gray-400 dark:text-gray-500" };
  if (v >= 2.5)  return { label: "Exceeding Expectations", color: "text-emerald-600 dark:text-emerald-400" };
  if (v >= 2.0)  return { label: "Meeting Expectations",  color: "text-blue-600 dark:text-blue-400" };
  return            { label: "Improving",               color: "text-amber-600 dark:text-amber-400" };
}

function scoreColor(val: string | number): string {
  const v = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(v) || val === "") return "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100";
  if (v >= 2.5) return "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400";
  if (v >= 2.0) return "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400";
  return "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400";
}

// ─── Main Component ───────────────────────────────────────────────────────────
function TeacherReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState<{msg: string, type: 'success' | 'warn' | 'error'} | null>(null);
  const [inputScores, setInputScores] = useState<any[]>([]);

  const studentId = searchParams.get('student');
  const subjectId = searchParams.get('subject');

  useEffect(() => {
    if (!studentId || !subjectId) {
      router.replace('/teacher/students');
    }
  }, [studentId, subjectId, router]);

  const { data: profile } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: async () => {
      const res = await api.get('/teacher/profile');
      return res.data.data;
    }
  });

  const { data: scoreForm, isLoading } = useQuery({
    queryKey: ['score-form', subjectId, studentId],
    queryFn: async () => {
      const res = await api.get(`/teacher/subjects/${subjectId}/students/${studentId}/scores`);
      return res.data.data;
    },
    enabled: !!studentId && !!subjectId
  });

  useEffect(() => {
    if (scoreForm) {
      const initialFormState: any[] = [];
      scoreForm.rubrics.forEach((r: any) => {
        r.criteria.forEach((c: any) => {
          initialFormState.push({
            criteria_id: c.criteria_id,
            score: c.current_score || '',
            description_subject: c.description_subject || ''
          });
        });
      });
      setInputScores(initialFormState);
    }
  }, [scoreForm]);

  const scoreMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post(`/teacher/subjects/${subjectId}/students/${studentId}/scores`, payload);
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
      setTimeout(() => { 
        setSaved(false); 
        router.replace(`/teacher/students?subject=${subjectId}`);
      }, 2000);
    },
    onError: (err: any) => {
      setShowToast({ msg: "Failed to save. Please check the score format (1.00 - 3.00)", type: 'error' });
    }
  });

  const handleScoreChange = (criteriaId: number, field: string, value: string) => {
    setInputScores(prev => prev.map(item => 
      item.criteria_id === criteriaId ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = () => {
    // Cek apakah ada yang kosong
    const emptyFields = inputScores.filter(i => !i.score || i.score === '');
    
    if (emptyFields.length > 0) {
      setShowToast({ msg: `${emptyFields.length} criteria remain unfilled. Status will be saved as DRAFT.`, type: 'warn' });
    } else {
      setShowToast({ msg: "All fields completed! Status will be saved as COMPLETED.", type: 'success' });
    }

    const payload = {
      academic_year: "2024/2025",
      scores: inputScores.map(i => ({ ...i, score: i.score ? String(i.score).replace(',', '.') : null }))
    };
    
    scoreMutation.mutate(payload);
  };

  const handleDownloadPdf = async () => {
    if (!scoreForm?.report_id) return;
    try {
      const response = await api.get(`/reports/${scoreForm.report_id}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report-${scoreForm.student.name_student}-${scoreForm.subject.category_subject}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const currentFormAverage = useMemo(() => {
    const vals = inputScores.map(i => parseFloat(i.score || "0")).filter(v => v > 0);
    if (vals.length === 0) return "—";
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
  }, [inputScores]);

  if (isLoading || !studentId) return <div className="p-20 text-center text-indigo-600 font-bold animate-pulse italic">Preparing Assessment Sheet...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors relative">
      
      {/* Read-Only Notice Banner */}
      {scoreForm?.is_read_only_mode && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-l-8 border-amber-500 p-6 rounded-2xl shadow-sm animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4">
            <span className="text-3xl">ℹ️</span>
            <div>
              <p className="text-amber-900 dark:text-amber-200 font-black uppercase text-xs tracking-widest mb-1">Read-Only Mode</p>
              <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">{scoreForm.read_only_reason}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Dynamic Toast Notification */}
      {showToast && (
        <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right duration-300">
           <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-l-8 ${
             showToast.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 
             showToast.type === 'warn' ? 'bg-amber-50 border-amber-500 text-amber-800' : 'bg-rose-50 border-rose-500 text-rose-800'
           }`}>
             <span className="text-xl">{showToast.type === 'success' ? '✅' : showToast.type === 'warn' ? '⚠️' : '❌'}</span>
             <p className="text-sm font-black uppercase tracking-tight">{showToast.msg}</p>
             <button onClick={() => setShowToast(null)} className="ml-4 opacity-50 hover:opacity-100">✕</button>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Assessment Sheet</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{profile?.name || "Teacher"}</p>
        </div>
        <div className="flex gap-3">
          {scoreForm?.report_id && (
            <button 
              onClick={handleDownloadPdf}
              className="text-sm font-bold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download PDF
            </button>
          )}
          <button 
            onClick={() => router.replace(`/teacher/students?subject=${subjectId}`)} 
            className="text-sm font-bold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition"
          >
            ← Back to List
          </button>
        </div>
      </div>

      {scoreForm && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 md:p-8 bg-indigo-900 dark:bg-indigo-950 text-white">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-indigo-400 bg-indigo-50 dark:bg-indigo-900 flex items-center justify-center text-indigo-400">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-indigo-300 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{scoreForm.subject.level_class} • {scoreForm.subject.term}</p>
                        <h2 className="text-3xl font-black">{scoreForm.student.name_student}</h2>
                        <p className="text-indigo-200 dark:text-indigo-300 text-sm mt-1 font-medium italic">"{scoreForm.subject.category_subject}"</p>
                    </div>
                </div>
                <div className="md:text-right">
                    <p className="text-indigo-300 text-[10px] font-bold uppercase mb-1 tracking-widest">Current Average</p>
                    <p className="text-4xl font-black">{currentFormAverage}</p>
                </div>
              </div>
            </div>

            <div className="p-0">
                {scoreForm.rubrics.map((rubric: any) => (
                    <div key={rubric.rubric_id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div className="bg-gray-50/50 dark:bg-gray-900/30 px-8 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                                <h3 className="font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest text-xs">{rubric.rubric_name}</h3>
                            </div>
                            {rubric.is_mine ? (
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">My Rubric</span>
                            ) : (
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-800">Co-Teacher's Rubric</span>
                            )}
                        </div>

                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                            {rubric.criteria.map((c: any) => {
                                const currentInput = inputScores.find(i => i.criteria_id === c.criteria_id);
                                return (
                                    <div key={c.criteria_id} className={`px-8 py-6 flex flex-col md:flex-row gap-6 transition-all group ${!c.is_mine ? 'bg-gray-50/50 dark:bg-gray-900/20' : 'hover:bg-gray-50/30 dark:hover:bg-indigo-900/10'}`}>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                                    {c.criteria_name}
                                                </p>
                                                {!c.is_mine && <span className="text-[9px] font-black text-gray-400 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded italic">Read Only</span>}
                                            </div>
                                            <textarea 
                                                disabled={!c.is_mine}
                                                value={currentInput?.description_subject || ""}
                                                onChange={(e) => handleScoreChange(c.criteria_id, 'description_subject', e.target.value)}
                                                placeholder={c.is_mine ? "Comment for this criteria..." : "No comments from co-teacher yet."}
                                                className={`w-full text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none ${!c.is_mine ? 'opacity-50 cursor-not-allowed italic text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}
                                                rows={2}
                                            />
                                        </div>
                                        <div className="flex flex-col items-center justify-center min-w-[120px] gap-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase">Score (1-3)</label>
                                            <input 
                                                disabled={!c.is_mine}
                                                type="number"
                                                step="0.01" min="1" max="3"
                                                value={currentInput?.score || ""}
                                                onChange={(e) => handleScoreChange(c.criteria_id, 'score', e.target.value)}
                                                placeholder="0.00"
                                                className={`w-24 text-center py-3 border-2 dark:border-gray-700 rounded-2xl text-lg font-black outline-none transition-all ${!c.is_mine ? 'opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-900 border-gray-200 text-gray-400' : scoreColor(currentInput?.score || "")}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grade</p>
                  <p className={`text-3xl font-black ${getLevelLabel(currentFormAverage).color}`}>{currentFormAverage}</p>
                </div>
                <div className="h-10 w-[1px] bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
                <div className="hidden md:block">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expectation Level</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 italic">{getLevelLabel(currentFormAverage).label}</p>
                </div>
              </div>
              {!scoreForm.is_read_only_mode && (
                <button 
                  onClick={handleSave} 
                  disabled={scoreMutation.isPending}
                  className={`w-full md:w-auto px-12 py-4 rounded-2xl font-black text-sm tracking-widest transition-all shadow-xl dark:shadow-none active:scale-95 ${saved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'} ${scoreMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {scoreMutation.isPending ? "PROCESSING..." : (saved ? "✓ SAVED" : "CONFIRM & SAVE GRADES")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading page...</div>}>
      <TeacherReportContent />
    </Suspense>
  );
}