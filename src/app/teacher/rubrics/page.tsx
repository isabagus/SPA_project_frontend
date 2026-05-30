"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

type Criteria = {
  criteria_id: number;
  criteria_name: string;
  default_description: string | null;
};

type RubricCategory = {
  rubric_id: number;
  rubric_name: string;
  criteria: Criteria[];
};

type Subject = {
  subject_id: number;
  category_subject: string;
  level_class: string;
  term: string;
};

export default function MasterRubricPage() {
  const queryClient = useQueryClient();
  
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string>(""); 
  const [selectedTerm, setSelectedTerm] = useState<string>("");

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isCriteriaModalOpen, setCriteriaModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingCriteria, setEditingCriteria] = useState<any>(null);
  const [targetRubricId, setTargetRubricId] = useState<number | null>(null);

  const [catName, setCatName] = useState("");
  const [critName, setCritName] = useState("");

  // 1. Fetch My Subjects (Cached by default)
  const { data: subjects = [] } = useQuery({
    queryKey: ['teacher-subjects'],
    queryFn: async () => {
      const response = await api.get('/teacher/subjects');
      return response.data.data as Subject[];
    }
  });

  const subjectOptions = useMemo(() => {
    const map = new Map();
    subjects.forEach((s) => {
      const key = `${s.category_subject}|${s.level_class}`;
      if (!map.has(key)) map.set(key, { name: s.category_subject, level: s.level_class });
    });
    return Array.from(map.entries());
  }, [subjects]);

  const termOptions = useMemo(() => {
    if (!selectedSubjectKey) return [];
    const [name, level] = selectedSubjectKey.split('|');
    const filtered = subjects.filter(s => s.category_subject === name && s.level_class === level);
    return Array.from(new Set(filtered.map(s => s.term))).sort();
  }, [selectedSubjectKey, subjects]);

  const activeSubjectId = useMemo(() => {
    if (!selectedSubjectKey || !selectedTerm) return null;
    const [name, level] = selectedSubjectKey.split('|');
    return subjects.find(s => s.category_subject === name && s.level_class === level && s.term === selectedTerm)?.subject_id || null;
  }, [selectedSubjectKey, selectedTerm, subjects]);

  useEffect(() => {
    if (subjectOptions.length > 0 && !selectedSubjectKey) setSelectedSubjectKey(subjectOptions[0][0]);
  }, [subjectOptions, selectedSubjectKey]);

  useEffect(() => {
    if (termOptions.length > 0 && !selectedTerm) setSelectedTerm(termOptions[0]);
  }, [termOptions, selectedTerm]);

  // 2. Fetch Rubrics (With Loading State)
  const { data: rubrics = [], isLoading: isFetchingRubrics } = useQuery({
    queryKey: ['rubric-master', activeSubjectId],
    queryFn: async () => {
      if (!activeSubjectId) return [];
      const response = await api.get(`/teacher/subjects/${activeSubjectId}/rubrics`);
      return response.data.data as RubricCategory[];
    },
    enabled: !!activeSubjectId
  });

  // ── Mutations (With isPending states) ───────────────────────────────────────────────────────
  
  const addCategory = useMutation({
    mutationFn: (name: string) => api.post(`/teacher/subjects/${activeSubjectId}/rubrics`, { rubric_name: name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rubric-master'] }); setCategoryModalOpen(false); setCatName(""); }
  });

  const updateCategory = useMutation({
    mutationFn: (data: any) => api.put(`/teacher/rubrics/${data.id}`, { rubric_name: data.name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rubric-master'] }); setCategoryModalOpen(false); setEditingCategory(null); setCatName(""); }
  });

  const deleteCategory = useMutation({
    mutationFn: (id: number) => api.delete(`/teacher/rubrics/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rubric-master'] })
  });

  const addCriteria = useMutation({
    mutationFn: (data: any) => api.post(`/teacher/rubrics/${data.rubricId}/criteria`, { criteria_name: data.name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rubric-master'] }); setCriteriaModalOpen(false); setCritName(""); }
  });

  const updateCriteria = useMutation({
    mutationFn: (data: any) => api.put(`/teacher/criteria/${data.id}`, { criteria_name: data.name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rubric-master'] }); setCriteriaModalOpen(false); setEditingCriteria(null); setCritName(""); }
  });

  const deleteCriteria = useMutation({
    mutationFn: (id: number) => api.delete(`/teacher/criteria/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rubric-master'] })
  });

  // ── Handlers ────────────────────────────────────────────────────────

  const openAddCategory = () => { setEditingCategory(null); setCatName(""); setCategoryModalOpen(true); };
  const openEditCategory = (rub: any) => { setEditingCategory(rub); setCatName(rub.rubric_name); setCategoryModalOpen(true); };
  const openAddCriteria = (rubId: number) => { setTargetRubricId(rubId); setEditingCriteria(null); setCritName(""); setCriteriaModalOpen(true); };
  const openEditCriteria = (crit: any) => { setEditingCriteria(crit); setCritName(crit.criteria_name); setCriteriaModalOpen(true); };

  const handleCatSubmit = () => {
    if (editingCategory) updateCategory.mutate({ id: editingCategory.rubric_id, name: catName });
    else addCategory.mutate(catName);
  };

  const handleCritSubmit = () => {
    if (editingCriteria) updateCriteria.mutate({ id: editingCriteria.criteria_id, name: critName });
    else addCriteria.mutate({ rubricId: targetRubricId, name: critName });
  };

  return (
    <div className="p-4 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Assessment Setup</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Configure assessment standards for each subject.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Subject</label>
            <select className="w-full text-xs font-bold border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={selectedSubjectKey} onChange={e => setSelectedSubjectKey(e.target.value)}>
              {subjectOptions.map(([key, info]: any) => (
                <option key={key} value={key}>{info.name} ({info.level})</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[120px]">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Term</label>
            <select className="w-full text-xs font-bold border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
              {termOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
        {isFetchingRubrics ? (
          // Skeleton Loader
          [1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 animate-pulse space-y-6">
               <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
               <div className="space-y-3">
                  <div className="h-12 w-full bg-gray-100 dark:bg-gray-900 rounded-2xl"></div>
                  <div className="h-12 w-full bg-gray-100 dark:bg-gray-900 rounded-2xl"></div>
               </div>
            </div>
          ))
        ) : (
          <>
            {rubrics.map(rubric => (
              <div key={rubric.rubric_id} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden group">
                <div className="px-8 py-6 bg-indigo-50/50 dark:bg-indigo-900/10 flex justify-between items-center border-b border-gray-50 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                    <h3 className="font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest text-sm">{rubric.rubric_name}</h3>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditCategory(rubric)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">✏️</button>
                    <button 
                        disabled={deleteCategory.isPending}
                        onClick={() => { if(confirm('Are you sure you want to delete this category?')) deleteCategory.mutate(rubric.rubric_id); }} 
                        className="p-2 text-gray-400 hover:text-rose-600 transition-colors disabled:opacity-30"
                    >
                        {deleteCategory.isPending ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {rubric.criteria.map(crit => (
                    <div key={crit.criteria_id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group/item shadow-sm hover:shadow-md">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{crit.criteria_name}</span>
                      <div className="flex gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button onClick={() => openEditCriteria(crit)} className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors">Edit</button>
                        <button 
                            disabled={deleteCriteria.isPending}
                            onClick={() => { if(confirm('Are you sure you want to delete this indicator?')) deleteCriteria.mutate(crit.criteria_id); }} 
                            className="text-xs font-bold text-gray-400 hover:text-rose-600 transition-colors disabled:opacity-30"
                        >
                            {deleteCriteria.isPending ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    disabled={addCriteria.isPending}
                    onClick={() => openAddCriteria(rubric.rubric_id)}
                    className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-black text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                  >
                    {addCriteria.isPending ? 'LOADING...' : '＋ ADD SUB-INDICATOR'}
                  </button>
                </div>
              </div>
            ))}

            <button 
              disabled={addCategory.isPending}
              onClick={openAddCategory}
              className="bg-gray-100/50 dark:bg-gray-900/20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-12 text-center group hover:border-indigo-400 transition-all flex flex-col items-center justify-center gap-4"
            >
              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md group-hover:bg-indigo-600 group-hover:text-white transition-all">
                 <span className="text-2xl font-black">{addCategory.isPending ? '...' : '＋'}</span>
              </div>
              <div className="space-y-1">
                <p className="font-black text-gray-800 dark:text-white uppercase tracking-widest text-sm">Add Rubric Category</p>
                <p className="text-xs text-gray-400 font-medium italic">Click to design a new category.</p>
              </div>
            </button>
          </>
        )}
      </div>

      {/* --- MODALS --- */}
      {(isCategoryModalOpen || isCriteriaModalOpen) && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-300 border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">
              {isCategoryModalOpen ? (editingCategory ? 'Edit Category' : 'Add Category') : (editingCriteria ? 'Edit Indicator' : 'Add Indicator')}
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">{isCategoryModalOpen ? 'Category Name' : 'Sub-Indicator Name'}</label>
                <input 
                  type="text"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white transition-all"
                  placeholder="Enter name..."
                  value={isCategoryModalOpen ? catName : critName}
                  onChange={e => isCategoryModalOpen ? setCatName(e.target.value) : setCritName(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={addCategory.isPending || updateCategory.isPending || addCriteria.isPending || updateCriteria.isPending}
                  onClick={() => { setCategoryModalOpen(false); setCriteriaModalOpen(false); }}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  disabled={addCategory.isPending || updateCategory.isPending || addCriteria.isPending || updateCriteria.isPending}
                  onClick={isCategoryModalOpen ? handleCatSubmit : handleCritSubmit}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                >
                  { (addCategory.isPending || updateCategory.isPending || addCriteria.isPending || updateCriteria.isPending) ? 'SAVING...' : 'SAVE' }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
