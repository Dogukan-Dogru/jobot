"use client";

import React, { useRef, useState } from "react";
import { MasterProfile } from "@/types";
import { ProfileForm } from "@/components/ProfileForm";
import { buildRawMarkdown } from "@/lib/cvParser";
import { Save, Check, Download, Upload, Trash2, ShieldCheck } from "lucide-react";

interface ProfileViewProps {
  profile: MasterProfile;
  onSaveProfile: (profile: MasterProfile) => void;
  onDeleteAllData: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onSaveProfile, onDeleteAllData }) => {
  const [formData, setFormData] = useState<MasterProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importError, setImportError] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned: MasterProfile = {
      ...formData,
      coreExperience: formData.coreExperience.map((x) => ({ ...x, highlights: x.highlights.map((h) => h.trim()).filter(Boolean) })),
      languages: formData.languages.filter((l) => l.language.trim())
    };
    cleaned.rawMarkdown = buildRawMarkdown(cleaned);
    onSaveProfile(cleaned);
    setFormData(cleaned);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jobot_profil.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    setImportError("");
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || typeof parsed.name !== "string" || !parsed.targetRoles || !Array.isArray(parsed.coreExperience)) {
        throw new Error("invalid");
      }
      setFormData({ ...parsed, id: "user-profile" } as MasterProfile);
    } catch {
      setImportError("Geçersiz profil dosyası. JoBot'tan dışa aktardığınız bir .json dosyası seçin.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  const handleDelete = () => {
    if (confirm("Profiliniz, kayıtlı ilanlarınız ve ayarlarınız bu tarayıcıdan KALICI olarak silinecek. Önce profilinizi dışa aktararak yedek almak ister misiniz? Devam etmek istediğinize emin misiniz?")) {
      onDeleteAllData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 text-xl font-bold">
            {(formData.name || "?").charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{formData.name || "Profil"}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {formData.targetTitle} • {formData.yearsOfExperience} Yıl Deneyim • {formData.currentLocation}
            </p>
          </div>
        </div>
        <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer">
          {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{savedSuccess ? "Kaydedildi!" : "Değişiklikleri Kaydet"}</span>
        </button>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Profiliniz yalnızca bu tarayıcıda saklanır, sunucularımıza kaydedilmez. Tarayıcı verilerini silmeden önce yedek almanızı öneririz.</span>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <ProfileForm value={formData} onChange={setFormData} idPrefix="prof" />
      </form>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Verilerim</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExport} className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-1.5 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Profili dışa aktar (JSON)
          </button>
          <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => handleImport(e.target.files?.[0])} />
          <button type="button" onClick={() => importRef.current?.click()} className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Profil içe aktar
          </button>
          <button type="button" onClick={handleDelete} className="px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-1.5 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" /> Tüm verilerimi sil
          </button>
        </div>
        {importError && <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">{importError}</p>}
        <p className="text-[11px] text-slate-500 dark:text-slate-400">İçe aktarılan profil forma yüklenir; kaydetmek için &quot;Değişiklikleri Kaydet&quot;e basın.</p>
      </div>
    </div>
  );
};
