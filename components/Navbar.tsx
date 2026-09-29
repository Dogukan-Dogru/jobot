"use client";

import React from "react";
import { MasterProfile } from "@/types";
import { 
  Sparkles, 
  Plus, 
  Download, 
  Settings as SettingsIcon, 
  User, 
  LayoutGrid, 
  Table as TableIcon,
  Search,
  Sun,
  Moon
} from "lucide-react";

interface NavbarProps {
  profile: MasterProfile;
  activeTab: "kanban" | "table" | "profile";
  setActiveTab: (tab: "kanban" | "table" | "profile") => void;
  onOpenAddJob: () => void;
  onOpenLiveScanner: () => void;
  onOpenSettings: () => void;
  onExportCsv: () => void;
  jobCount: number;
  theme?: "light" | "dark" | "system";
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  activeTab,
  setActiveTab,
  onOpenAddJob,
  onOpenLiveScanner,
  onOpenSettings,
  onExportCsv,
  jobCount,
  theme,
  onToggleTheme
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  Jo<span className="text-indigo-600 dark:text-indigo-400">Bot</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  SQLite • Web
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                AI Destekli İş Arama & Kariyer Asistanı
              </p>
            </div>
          </div>

          {/* Navigation view tabs */}
          <div className="hidden md:flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "kanban"
                  ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Pano (Kanban)</span>
              <span className="ml-1 text-xs px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold">
                {jobCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "table"
                  ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Liste & Tablo</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "profile"
                  ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Aday Profili</span>
            </button>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Live Scanner CTA Button */}
            <button
              onClick={onOpenLiveScanner}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-linear-to-r from-sky-500 via-indigo-600 to-indigo-700 hover:from-sky-600 hover:to-indigo-800 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              title="LinkedIn, Kariyer.net, RemoteOK ve küresel ağlardan en yeni ilanları otomatik tara"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span>Canlı İlanları Tara</span>
            </button>

            {/* Dark Mode Toggle */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                title={theme === "dark" ? "Açık Mod'a Geç" : "Karanlık Mod'a Geç (Dark Mode)"}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>
            )}

            {/* Export CSV button */}
            <button
              onClick={onExportCsv}
              className="p-2 sm:px-2.5 sm:py-2 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Google Sheets & Excel için CSV İndir"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">CSV İndir</span>
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Uygulama ve Yapay Zeka Ayarları"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            {/* Manual Add Job CTA */}
            <button
              onClick={onOpenAddJob}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Manuel veya Linkle İlan Ekle"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">İlan Ekle</span>
            </button>

          </div>

        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === "kanban" 
                ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold" 
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Pano ({jobCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === "table" 
                ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold" 
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Tablo</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === "profile" 
                ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold" 
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil</span>
          </button>
        </div>

      </div>
    </header>
  );
};
