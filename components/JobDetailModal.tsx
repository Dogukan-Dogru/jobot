"use client";

import React, { useState } from "react";
import { JobPosting, JobStatus, FinalVerdict } from "@/types";
import { 
  X, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  Copy, 
  Check, 
  Send, 
  FileText, 
  Target, 
  MessageSquare, 
  Briefcase, 
  Globe, 
  MapPin, 
  DollarSign, 
  RefreshCw,
  Loader2,
  Trash2,
  Share2
} from "lucide-react";

interface JobDetailModalProps {
  job: JobPosting | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: JobStatus) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onReanalyze: (id: string) => Promise<void>;
  onGeneratePackage: (id: string) => Promise<void>;
  onDeleteJob: (id: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateNotes,
  onReanalyze,
  onGeneratePackage,
  onDeleteJob
}) => {
  const [activeTab, setActiveTab] = useState<"analysis" | "cv" | "cover" | "recruiter" | "questions" | "raw">("analysis");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [notesText, setNotesText] = useState("");

  React.useEffect(() => {
    if (job) {
      setNotesText(job.notes || "");
    }
  }, [job]);

  if (!isOpen || !job) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleReanalyzeClick = async () => {
    setIsBusy(true);
    try {
      await onReanalyze(job.id);
    } finally {
      setIsBusy(false);
    }
  };

  const handleGeneratePackageClick = async () => {
    setIsBusy(true);
    try {
      await onGeneratePackage(job.id);
      setActiveTab("cv");
    } finally {
      setIsBusy(false);
    }
  };

  const handleNotesBlur = () => {
    if (notesText !== (job.notes || "")) {
      onUpdateNotes(job.id, notesText);
    }
  };

  const analysis = job.analysis;
  const pkg = job.applicationPackage;

  // Status mapping colors & labels
  const statusOptions: { value: JobStatus; label: string }[] = [
    { value: "new", label: "Yeni / İnceleniyor" },
    { value: "reviewed", label: "İncelendi" },
    { value: "to_apply", label: "Başvurulacak (To Apply)" },
    { value: "applied", label: "Başvuruldu (Applied)" },
    { value: "interview", label: "Mülakat Aşamasında" },
    { value: "offer", label: "Teklif Alındı (Offer)" },
    { value: "rejected", label: "Reddedildi / Pas Geçildi" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Top Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-start justify-between gap-4">
            
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {job.platform.toUpperCase()}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {job.workModel.toUpperCase()}
                </span>
                {job.salary && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {job.salary}
                  </span>
                )}
                {job.sourceUrl && (
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium underline"
                  >
                    <span>Orijinal İlanı Aç</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
                {job.title}
              </h1>

              <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                <span className="text-slate-900 font-bold">{job.company}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {job.location === job.country || job.location.toLowerCase().includes(job.country.toLowerCase()) 
                    ? job.location 
                    : `${job.location} (${job.country})`}
                </span>
              </div>
            </div>

            {/* Status Dropdown & Close */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                  Başvuru Durumu
                </label>
                <div className="flex items-center gap-1.5">
                  {job.status !== "rejected" ? (
                    <button
                      onClick={() => onUpdateStatus(job.id, "rejected")}
                      title="İlanı Pas Geç / Reddet"
                      className="text-xs font-semibold px-2 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5 text-rose-500" />
                      <span>Pas Geç</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateStatus(job.id, "new")}
                      title="İnceleneceklere Geri Al"
                      className="text-xs font-semibold px-2 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors"
                    >
                      ↩ Geri Al
                    </button>
                  )}

                  {job.status !== "to_apply" && job.status !== "applied" && (
                    <button
                      onClick={() => onUpdateStatus(job.id, "to_apply")}
                      title="Başvurulacak Listesine Ekle"
                      className="text-xs font-semibold px-2 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Başvurulacak</span>
                    </button>
                  )}

                  <select
                    value={job.status}
                    onChange={(e) => onUpdateStatus(job.id, e.target.value as JobStatus)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          </div>

          {/* VERDICT HERO BANNER */}
          {analysis && (
            <div className={`mt-4 p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              analysis.finalVerdict === "APPLY"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950"
                : analysis.finalVerdict === "SKIP"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-950"
                : "bg-amber-500/10 border-amber-500/30 text-amber-950"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                  analysis.finalVerdict === "APPLY"
                    ? "bg-emerald-600 text-white"
                    : analysis.finalVerdict === "SKIP"
                    ? "bg-rose-600 text-white"
                    : "bg-amber-500 text-white"
                }`}>
                  {analysis.finalVerdict === "APPLY" ? "APPLY" : analysis.finalVerdict === "SKIP" ? "SKIP" : "CONSIDER"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm tracking-tight">
                      {analysis.finalVerdict === "APPLY" && "✅ BAŞVURULMASI ÖNERİLİYOR (APPLY)"}
                      {analysis.finalVerdict === "CONSIDER" && "⚠️ İNCELE / TEYİT ET (CONSIDER)"}
                      {analysis.finalVerdict === "SKIP" && "🚫 BAŞVURU ÖNERİLMİYOR (SKIP)"}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-white/70">
                      Rol: {analysis.roleType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed font-medium">
                    {analysis.oneSentenceReason}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={handleReanalyzeClick}
                  disabled={isBusy}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white/80 hover:bg-white text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-all"
                  title="Yeniden Analiz Et"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Yeniden Analiz</span>
                </button>

                {!pkg && (
                  <button
                    onClick={handleGeneratePackageClick}
                    disabled={isBusy}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Başvuru Paketi Üret</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {!analysis && (
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
              <p className="text-xs font-semibold">Bu ilan henüz analiz edilmedi.</p>
              <button
                onClick={handleReanalyzeClick}
                disabled={isBusy}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Hemen Analiz Et</span>
              </button>
            </div>
          )}

        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-white overflow-x-auto shrink-0 gap-1 sm:gap-4 scrollbar-none">
          <button
            onClick={() => setActiveTab("analysis")}
            className={`py-3 px-2 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "analysis"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>10 Adımlı Analiz</span>
          </button>

          <button
            onClick={() => setActiveTab("cv")}
            className={`py-3 px-2 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "cv"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Özel CV Maddeleri</span>
            {pkg && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
          </button>

          <button
            onClick={() => setActiveTab("cover")}
            className={`py-3 px-2 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "cover"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Ön Yazı (Cover Letter)</span>
            {pkg && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
          </button>

          <button
            onClick={() => setActiveTab("recruiter")}
            className={`py-3 px-2 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "recruiter"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>LinkedIn Recruiter Notu</span>
          </button>

          <button
            onClick={() => setActiveTab("questions")}
            className={`py-3 px-2 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "questions"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Tarama Soruları</span>
          </button>

          <button
            onClick={() => setActiveTab("raw")}
            className={`py-3 px-2 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "raw"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>İlan Metni & Notlarım</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: 10-STEP ANALYSIS & ELIGIBILITY */}
          {activeTab === "analysis" && analysis && (
            <div className="space-y-6">

              {/* ELIGIBILITY GRID */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>Kritik Uygunluk Değerlendirmesi (Eligibility)</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  
                  <div className="p-3 rounded-lg bg-white border border-slate-200/80">
                    <span className="text-[11px] text-slate-500 block">Türkiye'den Başvuru</span>
                    <span className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${
                      analysis.eligibility.canApplyFromTurkey === true ? "text-emerald-700" :
                      analysis.eligibility.canApplyFromTurkey === false ? "text-rose-700" : "text-amber-700"
                    }`}>
                      {analysis.eligibility.canApplyFromTurkey === true && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {analysis.eligibility.canApplyFromTurkey === false && <XCircle className="w-3.5 h-3.5" />}
                      {analysis.eligibility.canApplyFromTurkey === "unclear" && <AlertTriangle className="w-3.5 h-3.5" />}
                      {analysis.eligibility.canApplyFromTurkey === true ? "Uygun (Evet)" : analysis.eligibility.canApplyFromTurkey === false ? "Uygun Değil" : "Teyit Gerekir"}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200/80">
                    <span className="text-[11px] text-slate-500 block">Türkiye'den Remote</span>
                    <span className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${
                      analysis.eligibility.remoteFromTurkey === true ? "text-emerald-700" :
                      analysis.eligibility.remoteFromTurkey === false ? "text-rose-700" : "text-amber-700"
                    }`}>
                      {analysis.eligibility.remoteFromTurkey === true && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {analysis.eligibility.remoteFromTurkey === false && <XCircle className="w-3.5 h-3.5" />}
                      {analysis.eligibility.remoteFromTurkey === "unclear" && <AlertTriangle className="w-3.5 h-3.5" />}
                      {analysis.eligibility.remoteFromTurkey === true ? "Evet (EOR/Remote)" : analysis.eligibility.remoteFromTurkey === false ? "Hayır (Bölge Kısıtı)" : "Belirsiz"}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200/80">
                    <span className="text-[11px] text-slate-500 block">Vize Sponsorluğu</span>
                    <span className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${
                      analysis.eligibility.visaSponsorship === "offered" ? "text-emerald-700" :
                      analysis.eligibility.visaSponsorship === "not_offered" ? "text-rose-700" : "text-slate-600"
                    }`}>
                      {analysis.eligibility.visaSponsorship === "offered" && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {analysis.eligibility.visaSponsorship === "not_offered" && <XCircle className="w-3.5 h-3.5" />}
                      {analysis.eligibility.visaSponsorship === "offered" ? "Mevcut / Açık" : analysis.eligibility.visaSponsorship === "not_offered" ? "Sağlanmıyor" : "Belirtilmemiş"}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200/80">
                    <span className="text-[11px] text-slate-500 block">Relokasyon Paketi</span>
                    <span className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${
                      analysis.eligibility.relocationOffered === true ? "text-emerald-700" : "text-slate-600"
                    }`}>
                      {analysis.eligibility.relocationOffered === true ? "Destek Var" : "Belirtilmemiş"}
                    </span>
                  </div>

                </div>

                <p className="text-xs text-slate-700 bg-white/70 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed font-medium">
                  <strong>Özet:</strong> {analysis.eligibility.summary}
                </p>
              </div>

              {/* MATCHES, TRANSFERABLE, GAPS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Strong Matches */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
                  <div className="flex items-center gap-2 mb-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Güçlü Eşleşmeler ({analysis.strongMatches.length})</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-800">
                    {analysis.strongMatches.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Transferable Skills */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30">
                  <div className="flex items-center gap-2 mb-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    <span>Aktarılabilir Deneyim ({analysis.transferableExperience.length})</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-800">
                    {analysis.transferableExperience.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-blue-600 font-bold">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gaps */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30">
                  <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Tespit Edilen Eksikler ({analysis.gaps.length})</span>
                  </div>
                  {analysis.gaps.length === 0 ? (
                    <p className="text-xs text-emerald-700 italic">Belirgin bir teknik veya sektörel eksiklik tespit edilmedi.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-slate-800">
                      {analysis.gaps.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">✗</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>

              {/* PRODUCT & PROJECT FIT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    🎯 Ürün Yönetimi Uyumu (Product Fit)
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                    {analysis.productFit.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    🚀 Proje & Teslimat Uyumu (Project Fit)
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                    {analysis.projectFit.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* RED FLAGS & INTERVIEW RISKS */}
              {(analysis.redFlags.length > 0 || analysis.interviewRisks.length > 0) && (
                <div className="space-y-4">
                  {analysis.redFlags.length > 0 && (
                    <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
                      <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Kırmızı Bayraklar (Red Flags)</span>
                      </h4>
                      <ul className="space-y-1 text-xs text-rose-950 font-medium">
                        {analysis.redFlags.map((flag, idx) => (
                          <li key={idx}>⚠️ {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.interviewRisks.length > 0 && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-white">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-indigo-600" />
                        <span>Mülakatta Challenge Edilebilecek Alanlar & Dürüst Strateji</span>
                      </h4>
                      <div className="space-y-3">
                        {analysis.interviewRisks.map((risk, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                            <p className="font-bold text-slate-900">Gereksinim: {risk.requirement}</p>
                            <p className="text-slate-600"><strong>Aday Deneyimi:</strong> {risk.candidateExperience}</p>
                            <p className="text-amber-800"><strong>Eksik Nokta:</strong> {risk.gap}</p>
                            <p className="text-indigo-900 bg-indigo-50/80 p-2 rounded border border-indigo-100 font-medium mt-1">
                              💡 <strong>Dürüst Yanıt Stratejisi:</strong> {risk.honestStrategy}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: TAILORED CV BULLET POINTS */}
          {activeTab === "cv" && (
            <div className="space-y-4">
              {!pkg ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-900">İlana Özel CV Henüz Üretilmedi</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    Yapay zeka, bu ilanın beklentilerine uygun olarak gerçek deneyiminizden PM ve Project Manager odaklı CV maddeleri üretsin.
                  </p>
                  <button
                    onClick={handleGeneratePackageClick}
                    disabled={isBusy}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2"
                  >
                    {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Başvuru Paketini Hemen Üret</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-slate-600 tracking-wider">
                        İlana Özel CV Özeti (Professional Summary)
                      </span>
                      <button
                        onClick={() => handleCopy(pkg.tailoredCvSummary, "summary")}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        {copiedItem === "summary" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedItem === "summary" ? "Kopyalandı!" : "Kopyala"}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                      {pkg.tailoredCvSummary}
                    </p>
                  </div>

                  {/* Bullet points per flavor */}
                  {pkg.tailoredBulletPoints.map((flavorGroup, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                          {flavorGroup.roleFlavor} Odaklı CV Maddeleri
                        </span>
                        <button
                          onClick={() => handleCopy(flavorGroup.bullets.map(b => `• ${b}`).join("\n"), `flavor-${idx}`)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          {copiedItem === `flavor-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedItem === `flavor-${idx}` ? "Kopyalandı!" : "Maddeleri Kopyala"}</span>
                        </button>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-800">
                        {flavorGroup.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-indigo-600 font-bold shrink-0">▪</span>
                            <span className="leading-relaxed">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COVER LETTER */}
          {activeTab === "cover" && (
            <div className="space-y-4">
              {!pkg ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Send className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-900">Ön Yazı Henüz Üretilmedi</h3>
                  <button
                    onClick={handleGeneratePackageClick}
                    disabled={isBusy}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Ön Yazı ve Başvuru Paketini Üret</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* English Cover Letter */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                        🇬🇧 English Cover Letter
                      </span>
                      <button
                        onClick={() => handleCopy(pkg.coverLetterEn, "cover-en")}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        {copiedItem === "cover-en" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Kopyala</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-800 bg-slate-50 p-3.5 rounded-lg border border-slate-200/60 font-sans whitespace-pre-wrap leading-relaxed flex-1">
                      {pkg.coverLetterEn}
                    </pre>
                  </div>

                  {/* Turkish Cover Letter */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                        🇹🇷 Türkçe Ön Yazı
                      </span>
                      <button
                        onClick={() => handleCopy(pkg.coverLetterTr, "cover-tr")}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        {copiedItem === "cover-tr" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Kopyala</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-800 bg-slate-50 p-3.5 rounded-lg border border-slate-200/60 font-sans whitespace-pre-wrap leading-relaxed flex-1">
                      {pkg.coverLetterTr}
                    </pre>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 4: LINKEDIN RECRUITER MESSAGE */}
          {activeTab === "recruiter" && (
            <div className="space-y-4">
              {!pkg ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-xs text-slate-500 mb-3">LinkedIn karakter sınırına uygun kısa recruiter mesajı üretmek için:</p>
                  <button
                    onClick={handleGeneratePackageClick}
                    disabled={isBusy}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Mesajı Üret</span>
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-xl border border-slate-200 bg-white max-w-2xl mx-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        LinkedIn Bağlantı / InMail Mesajı
                      </h4>
                      <p className="text-xs text-slate-500">
                        LinkedIn davetlerinde 300 karakter kısıtlamasına tam uyumlu format.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${
                        pkg.recruiterMessage.length <= 300 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {pkg.recruiterMessage.length} / 300 Karakter
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      readOnly
                      rows={4}
                      value={pkg.recruiterMessage}
                      className="w-full p-3.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 font-sans leading-relaxed focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopy(pkg.recruiterMessage, "recruiter")}
                      className="absolute right-3 bottom-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copiedItem === "recruiter" ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedItem === "recruiter" ? "Kopyalandı!" : "Metni Kopyala"}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                    💡 <strong>İpucu:</strong> İlana başvurduktan hemen sonra ilanı açan işe alım uzmanına veya Head of Product / Engineering yöneticisine bu mesajla bağlantı isteği atabilirsiniz.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SCREENING QUESTIONS */}
          {activeTab === "questions" && (
            <div className="space-y-4">
              {!pkg ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-xs text-slate-500 mb-3">Tarama formlarındaki klasik sorular için hazır yanıt üretmek için:</p>
                  <button
                    onClick={handleGeneratePackageClick}
                    disabled={isBusy}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Cevapları Üret</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pkg.screeningAnswers.map((qa, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900">
                          Soru {idx + 1}: {qa.question}
                        </span>
                        <button
                          onClick={() => handleCopy(qa.answer, `qa-${idx}`)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          {copiedItem === `qa-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Kopyala</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200/60 leading-relaxed font-medium">
                        {qa.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: RAW DESCRIPTION & NOTES */}
          {activeTab === "raw" && (
            <div className="space-y-5">
              
              {/* Personal Notes */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  📝 Bu İlana Dair Kişisel Notlarım
                </label>
                <textarea
                  rows={3}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Mülakat tarihi, maaş pazarlığı, görüşülen kişi vb. notları buraya yazabilirsiniz (otomatik kaydedilir)..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Raw Job Description */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Orijinal İlan Metni
                  </span>
                  <button
                    onClick={() => handleCopy(job.rawDescription, "raw")}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    {copiedItem === "raw" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Kopyala</span>
                  </button>
                </div>
                <pre className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200/60 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {job.rawDescription}
                </pre>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              if (confirm("Bu ilanı takip listenizden silmek istediğinize emin misiniz?")) {
                onDeleteJob(job.id);
                onClose();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>İlanı Sil</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
