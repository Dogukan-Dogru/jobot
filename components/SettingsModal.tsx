"use client";

import React, { useState } from "react";
import { AppSettings } from "@/types";
import { 
  Settings as SettingsIcon, 
  X, 
  Check, 
  RotateCcw, 
  ShieldCheck,
  Moon,
  Sun
} from "lucide-react";

interface SettingsModalProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings: (settings: AppSettings) => void;
  onResetAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSaveSettings,
  onResetAllData
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetData = () => {
    if (confirm("DİKKAT: Tüm ilanlar, analizler ve profil orijinal başlangıç durumuna döndürülecektir. Devam etmek istiyor musunuz?")) {
      onResetAllData();
      alert("Tüm veriler başarıyla sıfırlandı.");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Uygulama Ayarları</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tema ve veri tercihleriniz.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Görünüm & Tema (Dark Mode)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, theme: "light" })}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  formData.theme === "light"
                    ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Açık Mod (Light)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, theme: "dark" })}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  formData.theme === "dark"
                    ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Karanlık Mod (Dark)</span>
              </button>
            </div>
          </div>

          {/* Çalışma modu bilgisi */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>Analiz Motoru:</strong> İlanlar, profilinizdeki bilgilere göre kurallarla değerlendirilir. Herhangi bir API anahtarı veya hesap gerekmez.
          </div>

          {/* Privacy info banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Gizlilik & Güvenlik:</strong> Profiliniz yalnızca bu tarayıcıda saklanır; sunucularımıza kaydedilmez.
            </div>
          </div>

          {/* Danger zone: Reset all data */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetData}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Verileri Sıfırla (Fabrika Ayarları)</span>
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5 text-white" /> : null}
              <span>{savedSuccess ? "Kaydedildi!" : "Ayarları Kaydet"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
