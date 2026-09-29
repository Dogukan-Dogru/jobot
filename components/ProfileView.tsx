"use client";

import React, { useState } from "react";
import { MasterProfile } from "@/types";
import { 
  User, 
  Save, 
  RotateCcw, 
  Check, 
  Briefcase, 
  Globe, 
  Award, 
  FileText
} from "lucide-react";

interface ProfileViewProps {
  profile: MasterProfile;
  onSaveProfile: (profile: MasterProfile) => void;
  onResetDefault: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onSaveProfile,
  onResetDefault
}) => {
  const [formData, setFormData] = useState<MasterProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"visual" | "markdown">("visual");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    if (confirm("Aday profilini varsayılan orijinal haline döndürmek istediğinize emin misiniz?")) {
      onResetDefault();
      setFormData(profile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 text-xl font-bold">
            {formData.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{formData.name}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Master Profil
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {formData.targetTitle} • {formData.yearsOfExperience}+ Yıl Deneyim • {formData.currentLocation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Varsayılana Sıfırla</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedSuccess ? "Kaydedildi!" : "Değişiklikleri Kaydet"}</span>
          </button>
        </div>
      </div>

      {/* View switcher: Visual Form vs Markdown */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 rounded-t-2xl gap-4">
        <button
          onClick={() => setActiveTab("visual")}
          className={`py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === "visual"
              ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Görsel Profil Alanları</span>
        </button>
        <button
          onClick={() => setActiveTab("markdown")}
          className={`py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === "markdown"
              ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>MASTER_PROFILE.md (Ham Markdown)</span>
        </button>
      </div>

      {/* Visual Form */}
      {activeTab === "visual" && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-6 rounded-b-2xl border-x border-b border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
          
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Aday Adı</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hedef Ünvan</label>
              <input
                type="text"
                value={formData.targetTitle}
                onChange={(e) => setFormData({ ...formData, targetTitle: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mevcut Konum</label>
              <input
                type="text"
                value={formData.currentLocation}
                onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Target Roles */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Hedeflenen Roller (AI Sistem Eşleşmesi)</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Birincil Roller:</span>
                <p className="text-slate-600 dark:text-slate-400">{formData.targetRoles.primary.join(", ")}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">İkincil Roller (Project):</span>
                <p className="text-slate-600 dark:text-slate-400">{formData.targetRoles.secondary.join(", ")}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hibrit / Yan Roller:</span>
                <p className="text-slate-600 dark:text-slate-400">{formData.targetRoles.hybrid.join(", ")}</p>
              </div>
            </div>
          </div>

          {/* Target Countries */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Hedef Ülkeler ve Pazarlar</span>
            </label>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              {formData.targetCountries.map((c, i) => (
                <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Fintech & Payment Highlights */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>ProvisionPay Ödeme Sistemleri & B2B Dashboard Uzmanlıkları</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {formData.coreExperience[0].fintechDomains.map((domain, idx) => (
                <span key={idx} className="text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                  {domain}
                </span>
              ))}
            </div>
          </div>

          {/* Project Management specific strengths */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              🚀 Proje Yönetimi & Teslimat Sorumlulukları (Transferable Skills)
            </h3>
            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {formData.projectManagementHighlights.map((hl, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                  <span>{hl}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* E-Commerce Graycat Studio */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              🛍️ Graycat Studio (E-Ticaret & Kurucu Ortak Deneyimi)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {formData.ecommerceExperience.details.join(" • ")}
            </p>
          </div>

        </form>
      )}

      {/* Markdown Editor */}
      {activeTab === "markdown" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-b-2xl border-x border-b border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Yapay zekanın ilanları analiz ederken kaynak aldığı ana metindir. İlan analizleri ve CV üretimleri bu metin baz alınarak oluşturulur:
          </p>
          <textarea
            rows={18}
            value={formData.rawMarkdown}
            onChange={(e) => setFormData({ ...formData, rawMarkdown: e.target.value })}
            className="w-full p-4 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Markdown Profilini Kaydet</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
