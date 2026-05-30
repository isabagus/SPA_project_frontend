"use client";
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

type Criteria = {
  criteria_id: number;
  criteria_name: string;
  is_mine: boolean;
  current_score: number | null;
};

type Rubric = {
  rubric_id: number;
  rubric_name: string;
  is_mine: boolean;
  criteria: Criteria[];
};

type EvaluationFormData = {
  student: any;
  mentor_note: string;
  religion_fallback: boolean;
  rubrics: Rubric[];
};

interface ModalProps {
  studentId: number;
  levelClass: string;
  onClose: () => void;
}

export default function MentorEvaluationModal({ studentId, levelClass, onClose }: ModalProps) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [scores, setScores] = useState<Record<number, number>>({});

  // 1. Fetch Full Evaluation Form (Notes + Rubrics)
  const { data: formData, isLoading } = useQuery({
    queryKey: ['mentor-evaluation-form', studentId],
    queryFn: async () => {
      const res = await api.get(`/mentor/students/${studentId}/evaluation-form?level_class=${levelClass}`);
      return res.data.data as EvaluationFormData;
    }
  });

  useEffect(() => {
    if (formData) {
      setNote(formData.mentor_note || "");
      // Inisialisasi scores dari data yang ada
      const initialScores: Record<number, number> = {};
      formData.rubrics.forEach(r => {
        r.criteria.forEach(c => {
          if (c.current_score) initialScores[c.criteria_id] = c.current_score;
        });
      });
      setScores(initialScores);
    }
  }, [formData]);

  // 2. Mutation Simpan
  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post(`/mentor/students/${studentId}/evaluation`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-students'] });
      onClose();
      alert("Evaluation & grades successfully saved!");
    }
  });

  const handleSave = () => {
    mutation.mutate({
      level_class: levelClass,
      mentor_note: note,
      scores: scores,
      academic_year: "2024/2025"
    });
  };

  if (isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-hidden">
      <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl w-full max-w-4xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header Section */}
        <div className="p-8 bg-emerald-900 text-white flex justify-between items-center shrink-0">
          <div>
            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">Mentor Evaluation {formData?.religion_fallback && "& Religious Studies (Fallback)"}</p>
            <h3 className="text-2xl font-black">{formData?.student?.name_student}</h3>
          </div>
          <button 
            onClick={onClose}
            className="h-12 w-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar space-y-10">
          
          {/* Section 1: Affective Domain Note */}
          <section>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Evaluation Comments / Mentoring Notes</label>
            <textarea 
              className="w-full h-48 p-6 bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-3xl text-sm font-medium focus:border-emerald-500 outline-none transition-all dark:text-white resize-none shadow-inner"
              placeholder="Write the student's attitude, behavior, and non-academic progress here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </section>

          {/* Section 2: Religious Fallback Rubrics (If any) */}
          {formData?.religion_fallback && formData.rubrics.length > 0 && (
            <section className="animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2 bg-amber-100 text-amber-600 rounded-lg text-lg">⚖️</span>
                <div>
                  <h4 className="font-black text-gray-800 dark:text-white uppercase text-xs tracking-tight">Religious Studies Assessment (Fallback)</h4>
                  <p className="text-[10px] text-gray-400 font-bold italic">You are filling this because there is no dedicated teacher for {formData?.student?.religion_name}</p>
                </div>
              </div>

              <div className="space-y-6">
                {formData.rubrics.map(rubric => (
                  <div key={rubric.rubric_id} className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-3xl">
                    <h5 className="text-sm font-black text-amber-800 dark:text-amber-400 mb-4 uppercase tracking-wider">{rubric.rubric_name}</h5>
                    <div className="space-y-4">
                      {rubric.criteria.map(c => (
                        <div key={c.criteria_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{c.criteria_name}</span>
                          <div className="flex items-center gap-3">
                            {[1, 2, 3].map(val => (
                              <button
                                key={val}
                                onClick={() => setScores(prev => ({ ...prev, [c.criteria_id]: val }))}
                                className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${scores[c.criteria_id] === val ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200'}`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              disabled={mutation.isPending}
              onClick={handleSave}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 dark:shadow-none active:scale-95 transition-all"
            >
              {mutation.isPending ? "PROCESSING..." : "SAVE ALL EVALUATIONS"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
