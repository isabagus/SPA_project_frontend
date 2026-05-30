"use client";
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  REPORTS,
  termToSlug,
  slugToSubject,
} from "../../reportData";

function ScoreBadge({ score }: { score: string }) {
  const val = parseFloat(score);
  const textColor = val >= 2.5 ? "text-emerald-600 dark:text-emerald-500" : val >= 2.0 ? "text-blue-600 dark:text-blue-500" : "text-amber-600 dark:text-amber-500";
  return (
    <span className={`text-sm font-black tabular-nums ${textColor}`}>
      {val.toFixed(2)}
    </span>
  );
}

// ─── Detail Penilaian Page ──────────────────────────────────────────────────
export default function SubjectDetailPage() {
  const params = useParams();
  const termSlug = params.term as string;
  const subjectSlug = params.subject as string;

  const report = REPORTS.find((r) => termToSlug(r) === termSlug);
  const currentSubjectName = slugToSubject(subjectSlug);
  const currentSubject = report?.subjects.find(
    (s) => s.name.toLowerCase() === currentSubjectName.toLowerCase()
  );

  if (!report || !currentSubject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-5xl">⚠️</div>
        <p className="text-gray-500 dark:text-gray-400 font-semibold">
          Assessment data not found.
        </p>
        <Link
          href={`/parent/report/${termSlug}`}
          className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Back to Grade List
        </Link>
      </div>
    );
  }

  // Get all subjects in the same domain
  const domainSubjects = report.subjects.filter(
    (s) => s.domain === currentSubject.domain
  );

  // Calculate domain average
  const domainAvg = (
    domainSubjects.reduce((sum, s) => sum + parseFloat(s.average), 0) /
    domainSubjects.length
  ).toFixed(2);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* ── MODERN UI VERSION (Screen Only) ───────────────────────────── */}
      <div className="space-y-6 print:hidden">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white dark:bg-white/[0.03] p-6 rounded-3xl border border-gray-200 dark:border-white/10 backdrop-blur-md">
          <div className="space-y-1 text-center sm:text-left">
            <nav className="flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              <Link href={`/parent/report/${termSlug}`} className="hover:text-indigo-400 transition-colors">Grade Report</Link>
              <span>/</span>
              <span className="text-indigo-500">Assessment Details</span>
            </nav>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 justify-center sm:justify-start">
              <span className="bg-indigo-500 w-2 h-8 rounded-full" />
              {currentSubject.domain || "GENERAL DOMAIN"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
              Student Sub-topic Assessment Report — {report.term} {report.academicYear}
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
            title="Export PDF"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Export PDF
          </button>
        </div>

        {/* Student Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-white/[0.03] p-5 rounded-2xl border border-gray-200 dark:border-white/5 flex items-center gap-4">
          {/* Icon Student
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"> 
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div> */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Student</p>
              <p className="text-sm font-bold text-gray-800 dark:text-white">{report.studentName}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-white/[0.03] p-5 rounded-2xl border border-gray-200 dark:border-white/5 flex items-center gap-4">
              {/* Icon Class
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div> */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Class / Year</p>
              <p className="text-sm font-bold text-gray-800 dark:text-white">{report.class}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-white/[0.03] p-5 rounded-2xl border border-gray-200 dark:border-white/5 flex items-center gap-4 shadow-[inset_0_0_20px_rgba(79,70,229,0.05)]">
            {/* Icon Score
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div> */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Average Score</p>
              <p className="text-sm font-black text-emerald-500">{domainAvg}</p>
            </div>
          </div>
        </div>

        {/* Subjects List (Modern Cards) */}
        <div className="space-y-6">
          {domainSubjects.map((subj) => (
            <div key={subj.name} className="bg-white dark:bg-white/[0.02] rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                   <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">{subj.name}</h3>
                </div>
                {/* <span className="text-[10px] font-bold text-gray-400 uppercase italic">Teacher: {subj.teacher}</span> */}
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {subj.criteria.map((c, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10 group">
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl font-medium">
                        {c.description}
                      </p>
                      <ScoreBadge score={c.score} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ── EXCEL STYLE VIEW (Print Only) ─────────────────────────────── */}
      <div className="hidden print:block bg-white text-black p-0 m-0 font-sans">
        <div className="p-8 space-y-8">
          {/* Header Print */}
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-black uppercase tracking-widest">
              {report.term} REPORT {report.academicYear}
            </h1>
          </div>

          {/* Student Info Print */}
          <div className="flex justify-between items-start border-b border-black pb-2">
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-wide italic">{currentSubject.domain || "GENERAL DOMAIN"}</p>
              <div className="flex items-center gap-2 text-xs italic">
                <span>Name of Student:</span>
                <span className="font-bold border-b border-black min-w-[200px]">{report.studentName}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase">{report.class}</p>
            </div>
          </div>

          {/* Subject List Print */}
          <div className="space-y-6">
            <div className="flex justify-end pr-4">
              <span className="text-[10px] font-black uppercase tracking-widest">Level</span>
            </div>

            {domainSubjects.map((subj) => (
              <div key={subj.name} className="space-y-1">
                <h3 className="text-xs font-black italic uppercase border-b border-gray-300 pb-1">
                  {subj.name}
                </h3>
                <table className="w-full text-[10px]">
                  <tbody>
                    {subj.criteria.map((c, idx) => (
                      <tr key={idx}>
                        <td className="py-1 pr-4 leading-snug w-full border-b border-gray-100">
                          {c.description}
                        </td>
                        <td className="py-1 text-right border-b border-gray-100">
                          <span className="inline-block border border-black px-1 font-bold">{parseFloat(c.score).toFixed(2)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Summary Section Print */}
          <div className="pt-6 border-t-2 border-black mt-8">
            <div className="flex justify-between items-center py-2 px-4 bg-gray-100">
              <span className="text-sm font-black uppercase">Average</span>
              <span className="font-black text-lg">{parseFloat(domainAvg).toFixed(2)}</span>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-10">
              <div className="space-y-3">
                <p className="text-xs font-black uppercase italic">Level</p>
                <div className="space-y-1 text-[9px]">
                  <p><span className="font-mono w-20 inline-block">[1.00 - 1.99]</span> <span className="font-bold italic">Improving</span></p>
                  <p><span className="font-mono w-20 inline-block">[2.00 - 2.49]</span> <span className="font-bold italic">Meeting expectations</span></p>
                  <p><span className="font-mono w-20 inline-block">[2.50 - 3.00]</span> <span className="font-bold italic">Exceeding expectations</span></p>
                </div>
              </div>
              <div className="space-y-3 text-right">
                <p className="text-xs font-black uppercase italic">Teachers:</p>
                <div className="space-y-1 text-[9px]">
                  {domainSubjects.map((subj) => (
                    <p key={subj.name}>
                      <span className="font-bold italic">{subj.teacher}</span> [{subj.name.split(" ")[0]}]
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}