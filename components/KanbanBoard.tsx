"use client";

import React, { useState } from "react";
import { JobPosting, JobStatus } from "@/types";
import { 
  Building2, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronRight, 
  X, 
  Check, 
  RotateCcw,
  GripVertical
} from "lucide-react";

interface KanbanBoardProps {
  jobs: JobPosting[];
  onSelectJob: (job: JobPosting) => void;
  onUpdateStatus: (id: string, status: JobStatus) => void;
}

interface ColumnDef {
  key: string;
  title: string;
  targetStatus: JobStatus;
  statuses: JobStatus[];
  badgeBg: string;
}

const COLUMNS: ColumnDef[] = [
  {
    key: "col_new",
    title: "İncelenecek İlanlar",
    targetStatus: "new",
    statuses: ["new", "reviewed"],
    badgeBg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
  },
  {
    key: "col_to_apply",
    title: "Başvurulacak (To Apply)",
    targetStatus: "to_apply",
    statuses: ["to_apply"],
    badgeBg: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
  },
  {
    key: "col_applied",
    title: "Başvuruldu (Applied)",
    targetStatus: "applied",
    statuses: ["applied"],
    badgeBg: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
  },
  {
    key: "col_interview",
    title: "Mülakat Sürecinde",
    targetStatus: "interview",
    statuses: ["interview"],
    badgeBg: "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
  },
  {
    key: "col_offer",
    title: "Teklif Alındı (Offer)",
    targetStatus: "offer",
    statuses: ["offer"],
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300"
  },
  {
    key: "col_rejected",
    title: "Pas Geçilenler (Skipped)",
    targetStatus: "rejected",
    statuses: ["rejected", "archived"],
    badgeBg: "bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300"
  }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  jobs,
  onSelectJob,
  onUpdateStatus
}) => {
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedJobId(id);
  };

  const handleDragEnd = () => {
    setDraggedJobId(null);
    setDragOverColKey(null);
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColKey !== colKey) {
      setDragOverColKey(colKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColKey(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: JobStatus) => {
    e.preventDefault();
    setDragOverColKey(null);
    const jobId = e.dataTransfer.getData("text/plain") || draggedJobId;
    if (!jobId) return;

    onUpdateStatus(jobId, targetStatus);
    setDraggedJobId(null);
  };

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex gap-4 min-w-[1300px] items-start">
        
        {COLUMNS.map((column) => {
          const colJobs = jobs.filter((j) => column.statuses.includes(j.status));
          const isOver = dragOverColKey === column.key;

          return (
            <div
              key={column.key}
              onDragOver={(e) => handleDragOver(e, column.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.targetStatus)}
              className={`flex-1 min-w-[260px] rounded-2xl border p-3.5 flex flex-col max-h-[calc(100vh-14rem)] shadow-2xs transition-all duration-200 ${
                isOver
                  ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 ring-2 ring-indigo-400/50 scale-[1.01]"
                  : column.key === "col_rejected"
                  ? "bg-rose-50/30 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/60"
                  : "bg-slate-100/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800"
              }`}
            >
              
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {column.title}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${column.badgeBg}`}>
                    {colJobs.length}
                  </span>
                </div>
                {isOver && (
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">
                    Buraya Bırak ⇣
                  </span>
                )}
              </div>

              {/* Cards Container */}
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                {colJobs.length === 0 ? (
                  <div className={`text-center py-8 text-xs italic rounded-xl border border-dashed transition-colors ${
                    isOver 
                      ? "border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20" 
                      : "border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                  }`}>
                    {isOver ? "Buraya bırakabilirsiniz" : "Henüz bu aşamada ilan yok."}
                  </div>
                ) : (
                  colJobs.map((job) => {
                    const verdict = job.analysis?.finalVerdict;
                    const canTR = job.analysis?.eligibility.canApplyFromTurkey;
                    const isDragging = draggedJobId === job.id;

                    return (
                      <div
                        key={job.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, job.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onSelectJob(job)}
                        className={`group bg-white dark:bg-slate-800/90 p-3.5 rounded-xl border hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-2 relative select-none ${
                          isDragging ? "opacity-35 scale-[0.98] ring-2 ring-indigo-500" : ""
                        } ${
                          job.status === "rejected" 
                            ? "border-rose-200/70 dark:border-rose-900/50 opacity-80" 
                            : "border-slate-200/80 dark:border-slate-700/80"
                        }`}
                      >
                        
                        {/* Platform & Verdict Badges + Drag Grip */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors shrink-0" />
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {job.platform}
                            </span>
                          </div>

                          {verdict ? (
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              verdict === "APPLY"
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : verdict === "SKIP"
                                ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            }`}>
                              {verdict}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" />
                              Analiz Bekliyor
                            </span>
                          )}
                        </div>

                        {/* Job Title & Company */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                            {job.title}
                          </h4>
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 font-semibold mt-1">
                            <Building2 className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="truncate">{job.company}</span>
                          </div>
                        </div>

                        {/* Location & Turkey Eligibility */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                          <span className="flex items-center gap-1 truncate max-w-[140px]" title={job.location}>
                            <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </span>

                          {canTR !== undefined && (
                            <span className="shrink-0 text-[10px] font-semibold flex items-center gap-0.5" title="Türkiye'den Çalışma Uygunluğu">
                              🇹🇷
                              {canTR === true ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              ) : canTR === false ? (
                                <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                              )}
                            </span>
                          )}
                        </div>

                        {/* Card Action Buttons */}
                        <div className="flex items-center justify-between pt-1 gap-1 border-t border-slate-100/60 dark:border-slate-700/60">
                          
                          {/* If in 'İncelenecek İlanlar', show direct Pas Geç and Başvurulacak buttons */}
                          {(job.status === "new" || job.status === "reviewed") && (
                            <div className="flex items-center justify-between w-full gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStatus(job.id, "rejected");
                                }}
                                className="flex-1 py-1 px-1.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                title="Bu ilanı pas geç ve Pas Geçilenler'e taşı"
                              >
                                <X className="w-3 h-3" />
                                <span>Pas Geç</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStatus(job.id, "to_apply");
                                }}
                                className="flex-1 py-1 px-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                title="Bu ilana başvurulacak olarak işaretle"
                              >
                                <Check className="w-3 h-3" />
                                <span>Başvur</span>
                              </button>
                            </div>
                          )}

                          {/* If in 'Pas Geçilenler', allow one-click restore */}
                          {(job.status === "rejected" || job.status === "archived") && (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                                Pas Geçildi
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStatus(job.id, "new");
                                }}
                                className="py-1 px-2 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                                title="İnceleme havuzuna geri al"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Geri Al</span>
                              </button>
                            </div>
                          )}

                          {/* In other stages (To Apply, Applied, Interview, Offer) */}
                          {job.status !== "new" && job.status !== "reviewed" && job.status !== "rejected" && job.status !== "archived" && (
                            <div className="flex items-center justify-between w-full">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStatus(job.id, "rejected");
                                }}
                                className="text-[10px] font-medium text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-0.5 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                title="Pas Geç"
                              >
                                <X className="w-3 h-3" />
                                <span>Pas Geç</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
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
                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 flex items-center gap-0.5 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                                title="Sonraki aşamaya ilerlet"
                              >
                                <span>İlerlet</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          )}

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
