"use client";

import React from "react";
import { MasterProfile } from "@/types";
import { 
  Briefcase, 
  Sparkles, 
  Plus, 
  Download, 
  Settings as SettingsIcon, 
  User, 
  LayoutGrid, 
  Table as TableIcon,
  Search,
  Radar
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
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  activeTab,
  setActiveTab,
  onOpenAddJob,
  onOpenLiveScanner,
  onOpenSettings,
  onExportCsv,
  jobCount
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Jo<span className="text-indigo-600">Bot</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Web • Kurulumsuz
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                AI Destekli İş Arama & Kariyer Asistanı
              </p>
            </div>
          </div>

          {/* Navigation view tabs */}
          <div className="hidden md:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "kanban"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Pano (Kanban)</span>
              <span className="ml-1 text-xs px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-bold">
                {jobCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "table"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Liste & Tablo</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "profile"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
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
              title="RemoteOK, Jobicy ve Avrupa ağlarından en yeni ilanları otomatik tara"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span>Canlı İlanları Tara</span>
            </button>

            {/* Export CSV button */}
            <button
              onClick={onExportCsv}
              className="p-2 sm:px-2.5 sm:py-2 text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
              title="Google Sheets & Excel için CSV İndir"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">CSV İndir</span>
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2 sm:p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              title="Uygulama ve Yapay Zeka Ayarları"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            {/* Manual Add Job CTA */}
            <button
              onClick={onOpenAddJob}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-1.5"
              title="Manuel veya Linkle İlan Ekle"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">İlan Ekle</span>
            </button>

          </div>

        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === "kanban" ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Pano ({jobCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === "table" ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Liste</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === "profile" ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600"
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
