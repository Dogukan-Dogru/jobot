"use client";

import React from "react";
import { JobPosting, JobStatus } from "@/types";
import { 
  Building2, 
  MapPin, 
  ExternalLink, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronRight, 
  Sparkles,
  ArrowRight
} from "lucide-react";

interface KanbanBoardProps {
  jobs: JobPosting[];
  onSelectJob: (job: JobPosting) => void;
  onUpdateStatus: (id: string, status: JobStatus) => void;
}

interface ColumnDef {
  key: string;
  title: string;
  statuses: JobStatus[];
  color: string;
  badgeBg: string;
}

const COLUMNS: ColumnDef[] = [
  {
    key: "col_new",
    title: "İncelenecek İlanlar",
    statuses: ["new", "reviewed"],
    color: "border-slate-300",
    badgeBg: "bg-slate-100 text-slate-700"
  },
  {
    key: "col_to_apply",
    title: "Başvurulacak (To Apply)",
    statuses: ["to_apply"],
    color: "border-indigo-400",
    badgeBg: "bg-indigo-50 text-indigo-700"
  },
  {
    key: "col_applied",
    title: "Başvuruldu (Applied)",
    statuses: ["applied"],
    color: "border-blue-400",
    badgeBg: "bg-blue-50 text-blue-700"
  },
  {
    key: "col_interview",
    title: "Mülakat Sürecinde",
    statuses: ["interview"],
    color: "border-amber-400",
    badgeBg: "bg-amber-50 text-amber-800"
  },
  {
    key: "col_offer",
    title: "Teklif & Sonuç",
    statuses: ["offer", "rejected"],
    color: "border-emerald-400",
    badgeBg: "bg-emerald-50 text-emerald-800"
  }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  jobs,
  onSelectJob,
  onUpdateStatus
}) => {
  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex gap-4 min-w-[1100px] items-start">
        
        {COLUMNS.map((column) => {
          const colJobs = jobs.filter((j) => column.statuses.includes(j.status));

          return (
            <div
              key={column.key}
              className="flex-1 min-w-[260px] bg-slate-100/70 rounded-2xl border border-slate-200/80 p-3.5 flex flex-col max-h-[calc(100vh-14rem)] shadow-2xs"
            >
              
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 tracking-tight">
                    {column.title}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${column.badgeBg}`}>
                    {colJobs.length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                {colJobs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs italic">
                    Henüz bu aşamada ilan yok.
                  </div>
                ) : (
                  colJobs.map((job) => {
                    const verdict = job.analysis?.finalVerdict;
                    const canTR = job.analysis?.eligibility.canApplyFromTurkey;

                    return (
                      <div
                        key={job.id}
                        onClick={() => onSelectJob(job)}
                        className="group bg-white p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-2 relative"
                      >
                        
                        {/* Platform & Verdict Badges */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {job.platform}
                          </span>

                          {verdict ? (
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              verdict === "APPLY"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : verdict === "SKIP"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}>
                              {verdict}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" />
                              Analiz Bekliyor
                            </span>
                          )}
                        </div>

                        {/* Job Title & Company */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                            {job.title}
                          </h4>
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold mt-1">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{job.company}</span>
                          </div>
                        </div>

                        {/* Location & Turkey Eligibility */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="flex items-center gap-1 truncate max-w-[140px]" title={job.location}>
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </span>

                          {canTR !== undefined && (
                            <span className="shrink-0 text-[10px] font-semibold flex items-center gap-0.5" title="Türkiye'den Çalışma Uygunluğu">
                              🇹🇷
                              {canTR === true ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : canTR === false ? (
                                <XCircle className="w-3 h-3 text-rose-600" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                              )}
                            </span>
                          )}
                        </div>

                        {/* Quick Status Forwarder */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {job.workModel.toUpperCase()}
                          </span>

                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Cycle through states
                              const nextStatusMap: Record<JobStatus, JobStatus> = {
                                new: "to_apply",
                                reviewed: "to_apply",
                                to_apply: "applied",
                                applied: "interview",
                                interview: "offer",
                                offer: "archived",
                                rejected: "new",
                                archived: "new"
                              };
                              onUpdateStatus(job.id, nextStatusMap[job.status] || "new");
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-900 flex items-center gap-0.5 p-1 rounded hover:bg-indigo-50"
                            title="Sonraki aşamaya ilerlet"
                          >
                            <span>İlerlet</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}

      </div>
    </div>
  );
};
