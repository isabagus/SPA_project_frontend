"use client";
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';

type Report = {
  report_id: number;
  student_id: number;
  average_value: number;
  level_class?: string;
  student: {
    name_student: string;
    level_class: string;
  };
  subject: {
    category_subject: string;
    level_class: string;
    teacher?: {
      name: string;
    };
  };
  report_details?: any[];
  mentor_note?: string;
};

export default function PrintReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.reportId;

  // Fetch report details
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['print-report-detail', reportId],
    queryFn: async () => {
      const res = await api.get(`/reports/${reportId}`);
      return res.data.data as Report;
    },
    enabled: !!reportId
  });

  // Auto trigger print when data is loaded
  useEffect(() => {
    if (report) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [report]);

  const handleBack = () => {
    if (window.opener || window.history.length <= 1) {
      window.close();
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-500"></div>
          <p className="text-gray-500 font-medium text-sm">Preparing Report for Print...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
        <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Report</h2>
        <p className="text-gray-500 text-sm mb-6">We could not retrieve the report details. Please check your connection or permissions.</p>
        <button onClick={handleBack} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider">
          Go Back
        </button>
      </div>
    );
  }

  // Helper to get short subject representation
  const getShortSubject = (subjectName: string) => {
    const name = subjectName.toLowerCase();
    if (name.includes('physical education')) return 'PE';
    if (name.includes('performing arts')) {
      const match = subjectName.match(/\((.*?)\)/);
      return match ? match[1] : 'Music';
    }
    if (name.includes('art & craft')) return 'Arts & Craft';
    if (name.includes('information') || name.includes('ict')) return 'ICT';
    if (name.includes('religion')) return 'Religion';
    return subjectName;
  };

  // Group details by Rubric Category with fallback
  const groupedDetails: Record<number, { rubric_name: string, details: any[] }> = {};
  report.report_details?.forEach((detail: any) => {
    const rubric = detail.rubric || detail.criteria?.category;
    const rubricId = rubric?.rubric_id || detail.rubric_id || 0;
    const rubricName = rubric?.rubric_name || 'General Rubric';
    if (!groupedDetails[rubricId]) {
      groupedDetails[rubricId] = {
        rubric_name: rubricName,
        details: []
      };
    }
    groupedDetails[rubricId].details.push(detail);
  });

  // Extract participating teachers with fallback
  const teachersMap: Record<number, { name: string, rubrics: string[] }> = {};
  report.report_details?.forEach((detail: any) => {
    const rubric = detail.rubric || detail.criteria?.category;
    if (rubric) {
      const teacher = rubric.teacher;
      if (teacher) {
        const rubricName = rubric.rubric_name || 'General Rubric';
        if (teachersMap[teacher.teacher_id]) {
          if (!teachersMap[teacher.teacher_id].rubrics.includes(rubricName)) {
            teachersMap[teacher.teacher_id].rubrics.push(rubricName);
          }
        } else {
          teachersMap[teacher.teacher_id] = {
            name: teacher.name,
            rubrics: [rubricName]
          };
        }
      }
    }
  });
  const teachersList = Object.values(teachersMap);

  return (
    <div className="min-h-screen bg-gray-100 text-black font-sans py-10 print:py-0 print:bg-white screen-body">
      
      {/* Control Buttons (Hidden on print) */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center no-print px-4 md:px-0 control-panel">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <Printer className="w-4 h-4" />
          Print Now
        </button>
      </div>

      {/* Main Report Body (Simulated A4 card on screen, clean layout on print) */}
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-lg p-12 print-wrapper box-border">
        
        {/* Header Table */}
        <table className="w-full border-collapse mb-5">
          <tbody>
            <tr>
              <td className="text-left font-bold italic text-base uppercase pb-1">
                {report.subject.category_subject}
              </td>
              <td className="text-right font-bold text-sm uppercase pb-1">
                {report.level_class || report.student.level_class}
              </td>
            </tr>
            <tr>
              <td className="text-left italic pt-1 text-xs" colSpan={2}>
                Name of Student : {report.student.name_student}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Assessment Table with synchronized columns */}
        <table className="w-full border-collapse mb-5 assessment-table">
          <colgroup>
            <col className="w-[80%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr>
              <td className="border-none"></td>
              <td className="text-center font-bold text-[10px] pb-1 border-none">LEVEL</td>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedDetails).map(([rubricId, group]) => (
              <React.Fragment key={rubricId}>
                {/* Rubric Title Row */}
                <tr>
                  <td colSpan={2} className="text-left font-bold italic uppercase pt-3 pb-1 border-none text-[11px]">
                    {group.rubric_name}
                  </td>
                </tr>
                {/* Criteria Rows */}
                {group.details.map((detail: any, idx: number) => (
                  <tr key={detail.id || idx}>
                    <td className="border border-black text-left text-xs p-2">
                      {detail.criteria?.criteria_name || 'Criteria'}
                    </td>
                    <td className="border border-black text-center text-xs p-2">
                      {detail.score ? Number(detail.score).toFixed(2).replace('.', ',') : '-'}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}

            {/* Average Row */}
            <tr>
              <td className="border border-black text-left font-bold italic text-xs p-2.5">
                AVERAGE
              </td>
              <td className="border border-black text-center font-bold text-xs p-2.5">
                {Number(report.average_value).toFixed(2).replace('.', ',')}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer Level Guide & Teachers */}
        <table className="w-full border-collapse mt-6 border-none">
          <tbody>
            <tr>
              <td className="w-1/2 align-top p-0 border-none">
                <div className="font-bold text-xs mb-1">LEVEL</div>
                <div className="text-[11px] leading-relaxed">
                  <span className="font-mono">[1.00 - 1.99]</span> <em>Improving</em><br />
                  <span className="font-mono">[2.00 - 2.49]</span> <em>Meeting expectations</em><br />
                  <span className="font-mono">[2.50 - 3.00]</span> <em>Exceeding expectations</em>
                </div>
              </td>
              <td className="w-1/2 align-top p-0 border-none text-right">
                <div className="font-bold text-xs italic mb-1 pr-4">Teachers:</div>
                <table className="border-collapse border-none inline-block text-right pr-4">
                  <tbody>
                    {teachersList.map((tData: any, idx: number) => (
                      <tr key={idx}>
                        <td className="border-none p-0.5 text-right font-bold italic text-[11px]">
                          {tData.name} <span className="font-normal">[{tData.rubrics.join(', ')}]</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Mentor Feedback (Only if it exists) */}
        {report.mentor_note && (
          <div className="mt-8 text-xs">
            <div className="font-bold mb-1.5">MENTOR FEEDBACK:</div>
            <div className="border border-black p-3 font-italic leading-relaxed">
              &quot;{report.mentor_note}&quot;
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .assessment-table {
          table-layout: fixed;
        }
        
        @media screen {
          .screen-body {
            background-color: #f3f4f6 !important;
          }
        }

        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0; /* Menghilangkan header dan footer bawaan browser (URL, nomor halaman) */
            size: A4;
          }
          .screen-body {
            background-color: white !important;
            padding: 0 !important;
          }
          .print-wrapper {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding-top: 150px !important; /* Jarak untuk pre-printed header kertas fisik */
            padding-bottom: 120px !important; /* Jarak untuk pre-printed footer kertas fisik */
            padding-left: 20mm !important;
            padding-right: 20mm !important;
            border: none !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
          }
        }
      `}} />
    </div>
  );
}
