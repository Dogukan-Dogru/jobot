"use client";

import React, { useState } from "react";
import { JobPosting, MasterProfile, AppSettings } from "@/types";
import { 
  X, 
  Sparkles, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  MapPin, 
  Plus, 
  ExternalLink,
  ShieldCheck,
  Filter,
  Briefcase
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

  // Role Scope: Product Manager, Project Manager, or Both!
  const [roleScope, setRoleScope] = useState<string[]>(["product", "project"]);

  // Network selection toggles
  const [selectedSources, setSelectedSources] = useState<string[]>([
    "linkedin",
    "kariyer",
    "remoteok",
    "europe"
  ]);

  // Hide country-locked / SKIP jobs by default
  const [hideSkipped, setHideSkipped] = useState(true);

  if (!isOpen) return null;

  const toggleRole = (role: string) => {
    if (roleScope.includes(role)) {
      if (roleScope.length === 1) return; // Keep at least one role
      setRoleScope(roleScope.filter(r => r !== role));
    } else {
      setRoleScope([...roleScope, role]);
    }
  };

  const toggleSource = (source: string) => {
    if (selectedSources.includes(source)) {
      if (selectedSources.length === 1) return; // keep at least one
      setSelectedSources(selectedSources.filter(s => s !== source));
    } else {
      setSelectedSources([...selectedSources, source]);
    }
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    setScanStatusMessage("LinkedIn, Kariyer.net ve küresel ağlara bağlanılıyor...");
    setDiscoveredJobs([]);
    setSelectedIds(new Set());

    try {
      setTimeout(() => {
        setScanStatusMessage("Product Manager & Project Manager ilanları toplanıyor; alakasız roller filtreleniyor...");
      }, 1200);

      setTimeout(() => {
        setScanStatusMessage("10 adımlı AI motoru Türkiye uygunluğu ve fintech/teslimat deneyimine göre eliyor...");
      }, 2500);

      const res = await fetch("/api/scan-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          settings,
          existingUrls,
          sources: selectedSources,
          roleScope
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
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Search className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Canlı İlanları Tara (PM & Project Manager)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  PM & PjM Özel Filtresi
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                LinkedIn, Kariyer.net, RemoteOK ve küresel ağlardan Product & Project Manager ilanlarını tara.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Selection & Trigger Banner */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-3.5">
          
          {/* Target Role Scope Toggles */}
          <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Hedef Rol Odak:
            </span>

            <button
              type="button"
              onClick={() => toggleRole("product")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                roleScope.includes("product")
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
              }`}
            >
              ✓ Product Manager (Ürün Yöneticisi)
            </button>

            <button
              type="button"
              onClick={() => toggleRole("project")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                roleScope.includes("project")
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
              }`}
            >
              ✓ Project Manager (Proje Yöneticisi & Delivery)
            </button>
          </div>

          {/* Network Source toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Taranacak Ağlar:
            </span>

            <button
              type="button"
              onClick={() => toggleSource("linkedin")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                selectedSources.includes("linkedin")
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-2xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
              }`}
            >
              🔵 LinkedIn (TR & Global)
            </button>

            <button
              type="button"
              onClick={() => toggleSource("kariyer")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                selectedSources.includes("kariyer")
                  ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 shadow-2xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
              }`}
            >
              🟣 Kariyer.net (Türkiye)
            </button>

            <button
              type="button"
              onClick={() => toggleSource("remoteok")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                selectedSources.includes("remoteok")
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-2xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
              }`}
            >
              🟢 RemoteOK
            </button>

            <button
              type="button"
              onClick={() => toggleSource("europe")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                selectedSources.includes("europe")
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-2xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
              }`}
            >
              🟠 Avrupa & Global Remote (Jobicy & Remotive)
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>Sıkı Filtreleme:</strong> Software Engineer, Designer ve Account Manager rolleri otomatik elenir.
              </span>
            </div>

            <button
              onClick={handleStartScan}
              disabled={isScanning || selectedSources.length === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ağlar Taranıyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Seçili Ağları Tara</span>
                </>
              )}
            </button>
          </div>

          {/* Real-time status feedback */}
          {isScanning && (
            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
              <span>{scanStatusMessage}</span>
            </div>
          )}

        </div>

        {/* Results Header / Stats & Actions */}
        {hasScanned && (
          <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Bulunan: <strong>{discoveredJobs.length}</strong> ilan
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                ✓ {applyCount} APPLY
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                ⏳ {considerCount} CONSIDER
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold">
                ✕ {skipCount} SKIP
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle to hide SKIP / Country-locked jobs */}
              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideSkipped}
                  onChange={(e) => setHideSkipped(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium">Sahte Remote & SKIP İlanları Gizle</span>
              </label>

              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                Tümünü Seç
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Temizle
              </button>
            </div>
          </div>
        )}

        {/* Results List Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 bg-slate-50/40 dark:bg-slate-900/60">
          
          {!hasScanned && !isScanning && (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Canlı İlan Aramasını Başlatın
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                LinkedIn, Kariyer.net, RemoteOK ve küresel ağlardan hem <strong>Product Manager</strong> hem <strong>Project Manager</strong> ilanları taranır; Türkiye çalışma kısıtları ve sahte remote&apos;lar elenir.
              </p>
            </div>
          )}

          {hasScanned && discoveredJobs.length === 0 && !isScanning && (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs italic">
              Seçili kaynaklarda kriterlerinize uyan yeni ilan bulunamadı.
            </div>
          )}

          {discoveredJobs
            .filter(job => !hideSkipped || job.analysis?.finalVerdict !== "SKIP")
            .map((job) => {
            const isSelected = selectedIds.has(job.id);
            const verdict = job.analysis?.finalVerdict;
            const canTR = job.analysis?.eligibility.canApplyFromTurkey;

            const platformBadgeColor = 
              job.platform === "linkedin" ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800" :
              job.platform === "kariyer" ? "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800" :
              job.platform === "remoteok" ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" :
              "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800";

            return (
              <div
                key={job.id}
                onClick={() => handleToggleSelect(job.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 bg-white dark:bg-slate-800/90 shadow-2xs ${
                  isSelected 
                    ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/30" 
                    : "border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleSelect(job.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-500 cursor-pointer"
                />

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md border ${platformBadgeColor}`}>
                        {job.platform.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {job.workModel.toUpperCase()}
                      </span>
                      {job.salary && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                          {job.salary}
                        </span>
                      )}
                    </div>

                    {/* Verdict Tag */}
                    {verdict && (
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${
                        verdict === "APPLY"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : verdict === "SKIP"
                          ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      }`}>
                        {verdict === "APPLY" && <CheckCircle2 className="w-3 h-3" />}
                        {verdict === "SKIP" && <XCircle className="w-3 h-3" />}
                        {verdict === "CONSIDER" && <AlertTriangle className="w-3 h-3" />}
                        <span>{verdict}</span>
                      </span>
                    )}

                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {job.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{job.company}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location}
                    </span>
                    <span>•</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      🇹🇷 TR: {canTR === true ? "Uygun (Açık)" : canTR === false ? "Kısıtlı" : "Teyit Gerekir"}
                    </span>
                  </div>

                  {/* AI Reason Preview */}
                  {job.analysis?.oneSentenceReason && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700 font-medium">
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
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center gap-1 font-medium underline"
                      >
                        <span>İlanı Orijinal Kaynakta Gör</span>
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
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Seçili: <strong>{selectedIds.size}</strong> ilan
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              onClick={handleImportSelected}
              disabled={selectedIds.size === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
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
