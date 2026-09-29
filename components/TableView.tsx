"use client";

import React, { useState } from "react";
import { JobPosting, JobStatus } from "@/types";
import { 
  Building2, 
  MapPin, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Trash2,
  Filter
} from "lucide-react";

interface TableViewProps {
  jobs: JobPosting[];
  onSelectJob: (job: JobPosting) => void;
  onUpdateStatus: (id: string, status: JobStatus) => void;
  onDeleteJob: (id: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  jobs,
  onSelectJob,
  onUpdateStatus,
  onDeleteJob
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVerdict = 
      verdictFilter === "all" || job.analysis?.finalVerdict === verdictFilter;

    const matchesPlatform = 
      platformFilter === "all" || job.platform === platformFilter;

    return matchesSearch && matchesVerdict && matchesPlatform;
  });

  const statusLabels: Record<JobStatus, { label: string; color: string }> = {
    new: { label: "Yeni", color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" },
    reviewed: { label: "İncelendi", color: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300" },
    to_apply: { label: "Başvurulacak", color: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300" },
    applied: { label: "Başvuruldu", color: "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300" },
    interview: { label: "Mülakat", color: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300" },
    offer: { label: "Teklif", color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300" },
    rejected: { label: "Red / Pas", color: "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300" },
    archived: { label: "Arşiv", color: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" }
  };

  return (
    <div className="space-y-4">
      
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pozisyon, şirket veya konuma göre ara..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Verdict Filter */}
        <div className="flex items-center gap-2">
          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tüm AI Kararları</option>
            <option value="APPLY">Yalnızca APPLY (Başvur)</option>
            <option value="CONSIDER">Yalnızca CONSIDER (İncele)</option>
            <option value="SKIP">Yalnızca SKIP (Pas Geç)</option>
          </select>

          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tüm Platformlar</option>
            <option value="linkedin">LinkedIn</option>
            <option value="kariyer">Kariyer.net</option>
            <option value="indeed">Indeed</option>
            <option value="wellfound">Wellfound</option>
            <option value="remoteok">RemoteOK</option>
          </select>
        </div>

      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Pozisyon & Şirket</th>
                <th className="py-3 px-3">Rol Tipi</th>
                <th className="py-3 px-3">Konum & Model</th>
                <th className="py-3 px-3">AI Kararı</th>
                <th className="py-3 px-3">TR / Vize Durumu</th>
                <th className="py-3 px-3">Başvuru Durumu</th>
                <th className="py-3 px-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 dark:text-slate-500 italic">
                    Arama kriterlerine uygun ilan bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const verdict = job.analysis?.finalVerdict;
                  const canTR = job.analysis?.eligibility.canApplyFromTurkey;

                  return (
                    <tr
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      {/* Title & Company */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {job.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{job.company}</span>
                          <span>•</span>
                          <span className="uppercase text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            {job.platform}
                          </span>
                        </div>
                      </td>

                      {/* Role Type */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {job.analysis?.roleType || "—"}
                        </span>
                      </td>

                      {/* Location & Work model */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{job.location}</div>
                        <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                          {job.workModel}
                        </div>
                      </td>

                      {/* AI Verdict */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {verdict ? (
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border ${
                            verdict === "APPLY"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              : verdict === "SKIP"
                              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          }`}>
                            {verdict}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Analiz Yok</span>
                        )}
                      </td>

                      {/* Turkey & Visa Eligibility */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="flex items-center gap-1.5">
                          <span>🇹🇷</span>
                          {canTR === true && (
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Uygun
                            </span>
                          )}
                          {canTR === false && (
                            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              Kısıtlı
                            </span>
                          )}
                          {canTR === "unclear" && (
                            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Belirsiz
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {job.analysis?.eligibility.summary || "Belirtilmemiş"}
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td 
                        className="py-3 px-3 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={job.status}
                          onChange={(e) => onUpdateStatus(job.id, e.target.value as JobStatus)}
                          className={`text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            statusLabels[job.status]?.color || "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          <option value="new">Yeni</option>
                          <option value="reviewed">İncelendi</option>
                          <option value="to_apply">Başvurulacak</option>
                          <option value="applied">Başvuruldu</option>
                          <option value="interview">Mülakat</option>
                          <option value="offer">Teklif</option>
                          <option value="rejected">Red / Pas</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td 
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            if (confirm("Bu ilanı silmek istediğinize emin misiniz?")) {
                              onDeleteJob(job.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="İlanı Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
