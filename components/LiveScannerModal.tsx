"use client";

import React, { useState } from "react";
import { JobPosting, MasterProfile, AppSettings } from "@/types";
import { 
  X, 
  Sparkles, 
  Globe, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Building2, 
  MapPin, 
  Plus, 
  ExternalLink,
  Radar
} from "lucide-react";

interface LiveScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MasterProfile;
  settings: AppSettings;
  existingUrls: string[];
  onImportJobs: (newJobs: JobPosting[]) => void;
}

export const LiveScannerModal: React.FC<LiveScannerModalProps> = ({
  isOpen,
  onClose,
  profile,
  settings,
  existingUrls,
  onImportJobs
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatusMessage, setScanStatusMessage] = useState("");
  const [discoveredJobs, setDiscoveredJobs] = useState<JobPosting[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hasScanned, setHasScanned] = useState(false);

  if (!isOpen) return null;

  const handleStartScan = async () => {
    setIsScanning(true);
    setScanStatusMessage("Jobicy, RemoteOK ve Avrupa iş ilanları taranıyor...");
    setDiscoveredJobs([]);
    setSelectedIds(new Set());

    try {
      // Step 1
      setTimeout(() => {
        setScanStatusMessage("Canlı ilanlar toplandı; 10 adımlı AI filtreleme uygulanıyor...");
      }, 1200);

      const res = await fetch("/api/scan-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          settings,
          existingUrls
        })
      });

      const data = await res.json();
      if (data.jobs && Array.isArray(data.jobs)) {
        setDiscoveredJobs(data.jobs);
        // By default select all APPLY and CONSIDER jobs
        const initialSelected = new Set<string>();
        data.jobs.forEach((j: JobPosting) => {
          if (j.analysis?.finalVerdict === "APPLY" || j.analysis?.finalVerdict === "CONSIDER") {
            initialSelected.add(j.id);
          }
        });
        setSelectedIds(initialSelected);
      }
      setHasScanned(true);
    } catch (e) {
      console.error(e);
      alert("Canlı tarama sırasında bir ağ hatası oluştu.");
    } finally {
      setIsScanning(false);
      setScanStatusMessage("");
    }
  };

  const handleToggleSelect = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedIds(updated);
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedIds(new Set(discoveredJobs.map(j => j.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleImportSelected = () => {
    const toImport = discoveredJobs.filter(j => selectedIds.has(j.id));
    if (toImport.length === 0) {
      alert("Lütfen panoya eklemek için en az bir ilan seçiniz.");
      return;
    }
    onImportJobs(toImport);
    onClose();
  };

  const applyCount = discoveredJobs.filter(j => j.analysis?.finalVerdict === "APPLY").length;
  const considerCount = discoveredJobs.filter(j => j.analysis?.finalVerdict === "CONSIDER").length;
  const skipCount = discoveredJobs.filter(j => j.analysis?.finalVerdict === "SKIP").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-blue-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Search className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Canlı İlanları Tara & Havuzu Güncelle
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Otomatik Motor
                </span>
              </div>
              <p className="text-xs text-slate-500">
                RemoteOK, Jobicy ve Avrupa ağlarından en yeni ilanları çeker, adayın kriterlerine göre anında eler.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Trigger Banner */}
        <div className="p-4 sm:p-6 border-b border-slate-200/80 bg-white shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">
                Aday Profili Kriterleri: <span className="text-indigo-600 font-bold">{profile.targetTitle}</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Türkiye remote uygunluğu, vize sponsorluğu ve fintech/ödeme deneyimleri otomatik puanlanacaktır.
              </p>
            </div>

            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all shrink-0"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ağlar Taranıyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Canlı Taramayı Başlat</span>
                </>
              )}
            </button>

          </div>

          {/* Real-time scanning feedback banner */}
          {isScanning && (
            <div className="mt-4 p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-center gap-3 animate-in fade-in">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
              <span className="font-medium">{scanStatusMessage}</span>
            </div>
          )}

          {/* Results Summary Bar */}
          {hasScanned && !isScanning && (
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900">
                  {discoveredJobs.length} Canlı İlan Taranıp Eşleştirildi:
                </span>
                <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {applyCount} APPLY (Hemen Başvur)
                </span>
                <span className="px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {considerCount} CONSIDER
                </span>
                <span className="px-2 py-0.5 rounded-md font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {skipCount} SKIP
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectAll(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                >
                  Tümünü Seç
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => handleSelectAll(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
                >
                  Temizle
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Jobs List Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          
          {!hasScanned && !isScanning && (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <Globe className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">
                Yukarıdaki <strong>"Canlı Taramayı Başlat"</strong> butonuna basarak RemoteOK, Jobicy ve Avrupa ağlarından en yeni ilanları tarayabilirsiniz.
              </p>
            </div>
          )}

          {discoveredJobs.map((job) => {
            const verdict = job.analysis?.finalVerdict;
            const isSelected = selectedIds.has(job.id);
            const canTR = job.analysis?.eligibility.canApplyFromTurkey;

            return (
              <div
                key={job.id}
                onClick={() => handleToggleSelect(job.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50/20 shadow-xs"
                    : "border-slate-200/90 hover:border-slate-300 bg-white"
                }`}
              >
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleSelect(job.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {job.platform}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        {job.workModel.toUpperCase()}
                      </span>
                      {job.salary && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          {job.salary}
                        </span>
                      )}
                    </div>

                    {/* Verdict Tag */}
                    {verdict && (
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${
                        verdict === "APPLY"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : verdict === "SKIP"
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }`}>
                        {verdict === "APPLY" && <CheckCircle2 className="w-3 h-3" />}
                        {verdict === "SKIP" && <XCircle className="w-3 h-3" />}
                        {verdict === "CONSIDER" && <AlertTriangle className="w-3 h-3" />}
                        <span>{verdict}</span>
                      </span>
                    )}

                  </div>

                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {job.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                    <span className="text-slate-800 font-bold">{job.company}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {job.location}
                    </span>
                    <span>•</span>
                    <span className="text-[11px] text-slate-500">
                      🇹🇷 TR Uygunluğu: {canTR === true ? "Evet (Açık)" : canTR === false ? "Kısıtlı" : "Teyit Gerekir"}
                    </span>
                  </div>

                  {/* AI Reason Preview */}
                  {job.analysis?.oneSentenceReason && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                      💡 {job.analysis.oneSentenceReason}
                    </p>
                  )}

                  {/* Link */}
                  {job.sourceUrl && (
                    <div className="pt-1">
                      <a
                        href={job.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 font-medium underline"
                      >
                        <span>İlan Detayını Yeni Sekmede Aç</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                </div>

              </div>
            );
          })}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-600 font-medium">
            Seçili: <strong>{selectedIds.size}</strong> ilan
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Vazgeç
            </button>
            <button
              onClick={handleImportSelected}
              disabled={selectedIds.size === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Seçilenleri Panoma Ekle ({selectedIds.size})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
