"use client";

import React, { useState } from "react";
import { AppSettings } from "@/types";
import { 
  Settings as SettingsIcon, 
  X, 
  Key, 
  Check, 
  RotateCcw, 
  ExternalLink,
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
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Uygulama & Yapay Zeka Ayarları</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Çalışma modu, tema ve API sağlayıcı tercihleriniz.</p>
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

          {/* AI Provider Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Yapay Zeka Motoru / Çalışma Modu
            </label>
            
            <div className="space-y-2">
              
              {/* Demo Mode */}
              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                formData.aiProvider === "demo"
                  ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-2xs"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300"
              }`}>
                <input
                  type="radio"
                  name="provider"
                  value="demo"
                  checked={formData.aiProvider === "demo"}
                  onChange={() => setFormData({ ...formData, aiProvider: "demo" })}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      🟢 Dahili Akıllı Analiz Motoru (Sıfır Kurulum / API Key Gerekmez)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      Önerilen
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Hiçbir API anahtarı girmeden, 10 adımlı kurallara göre ilanları anında analiz eder ve başvuru paketini hazırlar.
                  </p>
                </div>
              </label>

              {/* Gemini Mode */}
              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                formData.aiProvider === "gemini"
                  ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-2xs"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300"
              }`}>
                <input
                  type="radio"
                  name="provider"
                  value="gemini"
                  checked={formData.aiProvider === "gemini"}
                  onChange={() => setFormData({ ...formData, aiProvider: "gemini" })}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    ✨ Google Gemini 2.0 Flash (Kişisel API Key)
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Google AI Studio üzerinden alacağınız ücretsiz API anahtarı ile en derin muhakeme.
                  </p>
                </div>
              </label>

              {/* OpenAI Mode */}
              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                formData.aiProvider === "openai"
                  ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-2xs"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300"
              }`}>
                <input
                  type="radio"
                  name="provider"
                  value="openai"
                  checked={formData.aiProvider === "openai"}
                  onChange={() => setFormData({ ...formData, aiProvider: "openai" })}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    ⚡ OpenAI GPT-4o / GPT-4o-mini
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Kendi OpenAI API anahtarınız ile GPT-4o modelleri üzerinden canlı çalıştırma.
                  </p>
                </div>
              </label>

            </div>
          </div>

          {/* API Key Input (if not demo) */}
          {formData.aiProvider !== "demo" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {formData.aiProvider.toUpperCase()} API Anahtarınız
                </label>
                {formData.aiProvider === "gemini" && (
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                  >
                    <span>Ücretsiz Anahtar Al</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={formData.apiKey || ""}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder={formData.aiProvider === "gemini" ? "AIzaSy..." : "sk-..."}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                API anahtarınız kesinlikle sunucuya kaydedilmez; yalnızca sizin cihazınızda saklanır.
              </p>
            </div>
          )}

          {/* Privacy info banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Gizlilik & Güvenlik:</strong> Tüm eklediğiniz ilanlar, oluşturulan CV ve ön yazılar yerel SQLite veritabanınızda saklanır.
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
