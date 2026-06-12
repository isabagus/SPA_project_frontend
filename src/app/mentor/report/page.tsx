"use client";
import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useSearchParams } from 'next/navigation';
import { 
  Users, 
  BookOpen, 
  ArrowLeft, 
  Star, 
  Search,
  Eye,
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Layout
} from 'lucide-react';

// --- Types ---
type Student = {
  student_id: number;
  nis: string;
  name_student: string;
};

type Report = {
  report_id: number;
  subject_id: number;
  average_value: number;
  subject: {
    category_subject: string;
    term: string;
    report_group_key?: string | null;
    teacher?: {
      name: string;
    };
  };
  report_details?: any[];
  _isGrouped?: boolean;
  _childReports?: Report[];
};

type MentorClass = {
  level_class: string;
  class_id: number;
};

function MentorReportContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get('student_id');

  const [view, setView] = useState<'students' | 'overview' | 'detail'>('students');
  const [activeLevel, setActiveLevel] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermSubject, setSearchTermSubject] = useState("");
  const [activeTerm, setActiveTerm] = useState("Term 1");

  // State for editable descriptions
  const [localDescriptions, setLocalDescriptions] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null); // Still use criteriaId for saving identifier
  const [statusMessage, setStatusMessage] = useState<{ id: number, type: 'success' | 'error', text: string } | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<number, boolean>>({});

  const termsList = ["Term 1", "Term 2", "Term 3", "Term 4"];

  // 1. Fetch Classes
  const { data: mentorClasses = [] } = useQuery({
    queryKey: ['mentor-classes-reports'],
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
  }, [mentorClasses, activeLevel]);

  // 2. Fetch Students
  const { data: studentData, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['mentor-students-list', activeLevel],
    queryFn: async () => {
      const res = await api.get(`/mentor/students?level_class=${activeLevel}`);
      return res.data.data.students as Student[];
    },
    enabled: !!activeLevel
  });

  // 3. Fetch Academic Overview
  const { data: reports = [], isLoading: isReportsLoading } = useQuery({
    queryKey: ['mentor-student-overview', selectedStudent?.student_id],
    queryFn: async () => {
      const res = await api.get(`/mentor/students/${selectedStudent?.student_id}/academic-report`);
      return res.data.data as Report[];
    },
    enabled: view === 'overview' && !!selectedStudent
  });

  // 4. Mutation for updating description
  const updateDescriptionMutation = useMutation({
    mutationFn: async ({ detailId, description, subjectId, criteriaId }: { detailId: number, description: string, subjectId: number, criteriaId: number }) => {
      return api.put(`/mentor/students/${selectedStudent?.student_id}/academic-report/detail/${detailId}`, {
        description,
        subject_id: subjectId,
        criteria_id: criteriaId
      });
    },
    onSuccess: (data, variables) => {
      setStatusMessage({ id: variables.criteriaId, type: 'success', text: 'Saved!' });
      queryClient.invalidateQueries({ queryKey: ['mentor-student-overview', selectedStudent?.student_id] });
      setSavingId(null);
      setTimeout(() => setStatusMessage(null), 3000);
    },
    onError: (error, variables) => {
      setStatusMessage({ id: variables.criteriaId, type: 'error', text: 'Save Failed' });
      setSavingId(null);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  });

  // Sync local descriptions when report changes
  useEffect(() => {
    if (selectedReport?.report_details) {
      const initial: Record<number, string> = {};
      const initialAccordions: Record<number, boolean> = {};
      selectedReport.report_details.forEach((d: any) => {
        initial[d.criteria_id] = d.description_subject || "";
        if (d.rubric_id) initialAccordions[d.rubric_id] = true; // Open all by default
      });
      setLocalDescriptions(initial);
      setOpenAccordions(initialAccordions);
    }
  }, [selectedReport]);

  // Group report details by rubric
  const groupedDetails = useMemo(() => {
    if (!selectedReport?.report_details) return {};
    const groups: Record<number, { name: string, details: any[] }> = {};
    
    selectedReport.report_details.forEach(detail => {
      const rId = detail.rubric_id || detail.criteria?.rubric_id;
      if (!groups[rId]) {
        groups[rId] = {
          name: detail.rubric?.rubric_name || detail.criteria?.category?.rubric_name || 'Uncategorized',
          details: []
        };
      }
      groups[rId].details.push(detail);
    });
    
    return groups;
  }, [selectedReport]);

  // Handle Initial Student from Query Param
  useEffect(() => {
    if (initialStudentId && studentData && view === 'students') {
      const student = studentData.find(s => s.student_id === Number(initialStudentId));
      if (student) {
        setSelectedStudent(student);
        setView('overview');
      }
    }
  }, [initialStudentId, studentData, view]);

  // --- Handlers ---
  const handleViewOverview = (student: Student) => {
    setSelectedStudent(student);
    setView('overview');
  };

  const handleViewDetail = (report: Report) => {
    setSelectedReport(report);
    setView('detail');
  };

  const handleSaveDescription = (detailId: number, subjectId: number, criteriaId: number) => {
    setSavingId(criteriaId);
    updateDescriptionMutation.mutate({ 
      detailId, 
      description: localDescriptions[criteriaId],
      subjectId,
      criteriaId
    });
  };

  const handleDownloadPdf = async (reportId: number, studentName: string, subjectName: string) => {
    if (!reportId || reportId === 0) {
      alert("No report data available to export yet. Please enter scores first.");
      return;
    }
    try {
      const response = await api.get(`/reports/${reportId}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report-${studentName}-${subjectName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const toggleAccordion = (rubricId: number) => {
    setOpenAccordions(prev => ({ ...prev, [rubricId]: !prev[rubricId] }));
  };

  const goBack = () => {
    if (view === 'detail') setView('overview');
    else if (view === 'overview') setView('students');
  };

  const filteredStudents = (studentData || []).filter(s => 
    s.name_student.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nis.includes(searchTerm)
  );

  // Grouping RS & PKN reports into a single "Affective Domain RS & PKN" entry
  const displayReports = useMemo(() => {
    const termFiltered = reports.filter(r => r.subject.term === activeTerm);
    const grouped: Report[] = [];
    const groupMap: Record<string, Report[]> = {};

    termFiltered.forEach(r => {
      const groupKey = r.subject.report_group_key;
      if (groupKey && groupKey.startsWith('GRP_AF_RS_PKN')) {
        if (!groupMap[groupKey]) groupMap[groupKey] = [];
        groupMap[groupKey].push(r);
      } else {
        grouped.push(r);
      }
    });

    // Merge each group into a single virtual report
    Object.entries(groupMap).forEach(([key, groupReports]) => {
      const totalAvg = groupReports.reduce((sum, r) => sum + Number(r.average_value || 0), 0);
      const avgValue = groupReports.length > 0 ? totalAvg / groupReports.length : 0;
      const allDetails = groupReports.flatMap(r => r.report_details || []);
      const teacherNames = [...new Set(groupReports.map(r => r.subject.teacher?.name).filter(Boolean))];

      grouped.push({
        report_id: groupReports[0].report_id,
        subject_id: groupReports[0].subject_id,
        average_value: avgValue,
        subject: {
          category_subject: 'Affective Domain RS & PKN',
          term: groupReports[0].subject.term,
          report_group_key: key,
          teacher: { name: teacherNames.join(', ') }
        },
        report_details: allDetails,
        _isGrouped: true,
        _childReports: groupReports
      });
    });

    return grouped;
  }, [reports, activeTerm]);

  const filteredReports = displayReports.filter(r => {
    const matchSubject = r.subject.category_subject.toLowerCase().includes(searchTermSubject.toLowerCase());
    return matchSubject;
  });

  return (
    <div className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-6">
            {view !== 'students' ? (
              <button 
                onClick={goBack}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl hover:scale-110 transition-transform text-emerald-600"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            ) : (
              <div className="bg-emerald-500/10 p-4 rounded-2xl">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                {view === 'students' ? 'Report Center' : view === 'overview' ? 'Grade Summary' : 'Edit Comments'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium italic">
                {view === 'students' ? 'Academic Monitoring - All Students' : selectedStudent?.name_student}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {view === 'students' ? (
              <>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search Student..." 
                    className="w-full px-5 py-3 pl-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  className="w-full sm:w-auto px-6 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white"
                  value={activeLevel}
                  onChange={(e) => setActiveLevel(e.target.value)}
                >
                  {mentorClasses.map(c => (
                    <option key={c.level_class} value={c.level_class}>{c.level_class}</option>
                  ))}
                </select>
              </>
            ) : view === 'overview' ? (
              <>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search Subject..." 
                    className="w-full px-5 py-3 pl-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white"
                    value={searchTermSubject}
                    onChange={(e) => setSearchTermSubject(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-1 rounded-2xl border border-gray-200 dark:border-gray-700">
                  {termsList.map(term => (
                    <button
                      key={term}
                      onClick={() => setActiveTerm(term)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTerm === term ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-emerald-600'}`}
                    >
                      {term.replace('Term ', 'T')}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* --- VIEW 1: STUDENTS LIST --- */}
        {view === 'students' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isStudentsLoading ? (
               Array.from({length: 6}).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 animate-pulse">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-700"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                      <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  </div>
                  <div className="h-12 w-full bg-gray-100 dark:bg-gray-700 rounded-2xl"></div>
                </div>
               ))
            ) : filteredStudents.map((student) => (
              <div 
                key={student.student_id}
                className="group bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-500 relative overflow-hidden"
              >
                <div className="flex items-center gap-5 mb-8">
                  <div className="h-16 w-16 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-2xl font-black text-gray-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    {student.name_student.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight group-hover:text-emerald-600 transition-colors">{student.name_student}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">NIS: {student.nis}</p>
                  </div>
                </div>

                <button 
                  onClick={() => handleViewOverview(student)}
                  className="w-full bg-gray-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Eye className="w-4 h-4" />
                  Report Details
                </button>
              </div>
            ))}
          </div>
        )}

        {/* --- VIEW 2: ACADEMIC OVERVIEW --- */}
        {view === 'overview' && (
          <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-8 py-6 text-xs uppercase font-black text-gray-400 tracking-widest">Subject</th>
                    <th className="px-8 py-6 text-xs uppercase font-black text-gray-400 tracking-widest">Teacher</th>
                    <th className="px-8 py-6 text-xs uppercase font-black text-gray-400 tracking-widest text-center">Average Score</th>
                    <th className="px-8 py-6 text-xs uppercase font-black text-gray-400 tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {isReportsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="h-11 w-11 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                            <div className="space-y-2">
                              <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                              <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="h-6 w-12 bg-gray-100 dark:bg-gray-800 rounded-lg mx-auto"></div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="h-10 w-28 bg-gray-100 dark:bg-gray-800 rounded-xl mx-auto"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredReports.length > 0 ? (
                    filteredReports.map((report) => (
                      <tr key={report.report_id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                              <BookOpen className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 dark:text-white">{report.subject.category_subject}</span>
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{report.subject.term}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{report.subject.teacher?.name || '-'}</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`text-xl font-black ${Number(report.average_value) >= 2.5 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {Number(report.average_value).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <button 
                            onClick={() => handleViewDetail(report)}
                            className="bg-gray-900 dark:bg-gray-700 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                          >
                            Edit Comments
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="p-20 text-center font-bold text-gray-400 italic tracking-widest uppercase text-sm">No data for {activeTerm}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW 3: RUBRIC DETAIL (ACCORDION) --- */}
        {view === 'detail' && selectedReport && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6">
            {/* Subject Header Card */}
            <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
               <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-emerald-600 text-white">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/20 rounded-2xl">
                      <Layout className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">{selectedReport.subject.category_subject}</h2>
                      <p className="font-bold text-[10px] uppercase tracking-widest opacity-80 italic">Mentor Access: Qualitative Feedback Editing</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-6">
                    {selectedReport.report_id && selectedReport.report_id !== 0 && (
                      <div className="flex gap-2">
                        <a 
                          href={`/print/report/${selectedReport.report_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-5 py-3 bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-md"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                          </svg>
                          Print Report
                        </a>
                        <button 
                          onClick={() => handleDownloadPdf(selectedReport.report_id, selectedStudent?.name_student || 'Student', selectedReport.subject.category_subject)}
                          className="flex items-center gap-2 px-5 py-3 bg-white text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-md"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          Download PDF
                        </button>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Subject Average</p>
                      <p className="text-4xl font-black">{Number(selectedReport.average_value).toFixed(2)}</p>
                    </div>
                  </div>
               </div>

               {/* Accordion List */}
               <div className="p-4 sm:p-8 space-y-4">
                  {Object.keys(groupedDetails).length > 0 ? (
                    Object.entries(groupedDetails).map(([rubricId, group]: [string, any]) => (
                      <div key={rubricId} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                        {/* Accordion Header */}
                        <button 
                          onClick={() => toggleAccordion(Number(rubricId))}
                          className="w-full px-8 py-6 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-sm">{group.name}</h3>
                          </div>
                          {openAccordions[Number(rubricId)] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </button>

                        {/* Accordion Body */}
                        {openAccordions[Number(rubricId)] && (
                          <div className="divide-y divide-gray-50 dark:divide-gray-700">
                             {group.details.map((detail: any, idx: number) => (
                               <div key={detail.id || `virtual-${detail.criteria_id}-${idx}`} className="p-8 flex flex-col md:flex-row gap-8 items-start hover:bg-gray-50/20 dark:hover:bg-gray-900/20 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="flex-1 space-y-4 w-full">
                                     <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] font-black text-emerald-600">
                                            {idx + 1}
                                          </div>
                                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight">
                                            {detail.criteria?.criteria_name || 'Criteria'}
                                          </h4>
                                        </div>
                                        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Score:</span>
                                           <span className="text-sm font-black text-emerald-500">{Number(detail.score).toFixed(2)}</span>
                                        </div>
                                     </div>
                                     
                                     <div className="space-y-3">
                                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Assessment Comment</label>
                                       <textarea 
                                         className="w-full p-4 text-sm bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 font-medium leading-relaxed outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all dark:text-white resize-none"
                                         rows={2}
                                         value={localDescriptions[detail.criteria_id] || ""}
                                         onChange={(e) => setLocalDescriptions(prev => ({ ...prev, [detail.criteria_id]: e.target.value }))}
                                         placeholder="Write the assessment comment here..."
                                       />
                                     </div>

                                     <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2">
                                           {statusMessage?.id === detail.criteria_id && statusMessage != null && (
                                             <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 ${statusMessage.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                               {statusMessage.type === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                               {statusMessage.text}
                                             </span>
                                           )}
                                        </div>
                                        <button 
                                          onClick={() => handleSaveDescription(detail.id, detail.rubric?.subject_id || 0, detail.criteria_id)}
                                          disabled={savingId === detail.criteria_id}
                                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                            savingId === detail.criteria_id 
                                            ? 'bg-gray-100 text-gray-400' 
                                            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/10 active:scale-95'
                                          }`}
                                        >
                                          {savingId === detail.criteria_id ? (
                                            <>
                                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                              Saving...
                                            </>
                                          ) : (
                                            <>
                                              <Save className="w-3.5 h-3.5" />
                                              Save Comment
                                            </>
                                          )}
                                        </button>
                                     </div>
                                  </div>
                               </div>
                             ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center font-bold text-gray-400 italic">No detailed rubrics available for this subject.</div>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* Empty States */}
        {view === 'students' && filteredStudents.length === 0 && !isStudentsLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-700">
             <div className="bg-gray-50 dark:bg-gray-900 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-10 h-10 text-gray-300" />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Students Found</h2>
             <p className="text-gray-400 max-w-xs mx-auto">Please select another class or modify your search keyword.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MentorReportCenter() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-black animate-pulse">LOADING REPORT CENTER...</div>}>
      <MentorReportContent />
    </Suspense>
  );
}
