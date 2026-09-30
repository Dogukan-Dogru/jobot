"use client";

import React, { useState, useEffect } from "react";
import { AppSettings, JobPosting, JobStatus, MasterProfile } from "@/types";
import { 
  getStoredJobs, 
  saveJob, 
  deleteJob, 
  saveJobs,
  resetJobsToDefault, 
  getStoredProfile, 
  saveProfile, 
  resetProfileToDefault, 
  getStoredSettings, 
  saveSettings, 
  exportJobsToCsv,
  fetchDbInitialData,
  syncDbAction
} from "@/lib/storage";
import { analyzeJobWithAI, generatePackageWithAI } from "@/lib/aiService";
import { Navbar } from "@/components/Navbar";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TableView } from "@/components/TableView";
import { ProfileView } from "@/components/ProfileView";
import { AddJobModal } from "@/components/AddJobModal";
import { JobDetailModal } from "@/components/JobDetailModal";
import { SettingsModal } from "@/components/SettingsModal";
import { LiveScannerModal } from "@/components/LiveScannerModal";
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Send, 
  Users, 
  Plus, 
  Info,
  ArrowRight,
  Search
} from "lucide-react";

export default function Home() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [profile, setProfile] = useState<MasterProfile>(getStoredProfile());
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());

  const [activeTab, setActiveTab] = useState<"kanban" | "table" | "profile">("kanban");
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [isLiveScannerOpen, setIsLiveScannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize client storage and sync with SQLite DB
  useEffect(() => {
    setIsMounted(true);
    const localJobs = getStoredJobs();
    const localProfile = getStoredProfile();
    const localSettings = getStoredSettings();

    setJobs(localJobs);
    setProfile(localProfile);
    setSettings(localSettings);

    // Fetch persistent data from SQLite backend
    async function syncWithBackendDb() {
      try {
        const dbData = await fetchDbInitialData();
        if (dbData && dbData.jobs && Array.isArray(dbData.jobs)) {
          const cleanJobs = dbData.jobs.filter((j: JobPosting) => j && j.id && !j.id.startsWith("sample-job-"));
          if (cleanJobs.length > 0) {
            setJobs(cleanJobs);
          } else if (localJobs.length === 0) {
            setJobs([]);
          }
          if (dbData.profile) setProfile(dbData.profile);
          if (dbData.settings) setSettings(dbData.settings);
        } else if (localJobs.length > 0) {
          // If SQLite was empty but localStorage had data, migrate localStorage into SQLite
          syncDbAction({
            action: "migrateFromLocalStorage",
            jobs: localJobs,
            profile: localProfile,
            settings: localSettings
          });
        }
      } catch (err) {
        console.warn("Initial DB sync error:", err);
      }
    }

    syncWithBackendDb();
  }, []);

  // Sync selected job if jobs array updates
  useEffect(() => {
    if (selectedJob) {
      const fresh = jobs.find((j) => j.id === selectedJob.id);
      if (fresh) setSelectedJob(fresh);
    }
  }, [jobs]);

  // Apply dark mode class to HTML documentElement
  useEffect(() => {
    if (!isMounted) return;
    const isDark =
      settings.theme === "dark" ||
      (settings.theme === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", isDark);
  }, [settings.theme, isMounted]);

  const handleToggleTheme = () => {
    const nextTheme: "light" | "dark" = settings.theme === "dark" ? "light" : "dark";
    const updated: AppSettings = { ...settings, theme: nextTheme };
    handleSaveSettings(updated);
  };

  // Handlers
  const handleAddJob = async (
    jobData: Omit<JobPosting, "id" | "dateAdded" | "status">,
    runAiImmediately: boolean
  ) => {
    const newJob: JobPosting = {
      ...jobData,
      id: "job-" + Date.now(),
      dateAdded: new Date().toISOString().split("T")[0],
      status: "new"
    };

    if (runAiImmediately) {
      try {
        const analysis = await analyzeJobWithAI(newJob, profile, settings);
        newJob.analysis = analysis;
        if (analysis.finalVerdict === "APPLY") {
          newJob.status = "to_apply";
        }
      } catch (e) {
        console.error("AI analysis error on add:", e);
      }
    }

    const updated = saveJob(newJob);
    setJobs(updated);
    setSelectedJob(newJob);
  };

  const handleImportLiveJobs = (newJobs: JobPosting[]) => {
    setJobs((prevJobs) => {
      const existingUrls = new Set(prevJobs.map((j) => (j.sourceUrl || "").toLowerCase().trim()).filter(Boolean));
      const seenIds = new Set(prevJobs.map((j) => j.id));

      const preparedNewJobs = newJobs
        .filter((j) => !j.sourceUrl || !existingUrls.has(j.sourceUrl.toLowerCase().trim()))
        .map((j) => {
          let id = j.id;
          if (!id || seenIds.has(id)) {
            id = `${j.platform || "job"}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
          }
          seenIds.add(id);
          return { ...j, id };
        });

      const updated = [...preparedNewJobs, ...prevJobs];
      saveJobs(updated);
      return updated;
    });
    setActiveTab("kanban");
    if (newJobs.length > 0) {
      setSelectedJob(newJobs[0]);
    }
  };

  const handleUpdateStatus = (id: string, status: JobStatus) => {
    setJobs((prevJobs) => {
      const updated = prevJobs.map((j) => (j.id === id ? { ...j, status } : j));
      saveJobs(updated);
      return updated;
    });
    setSelectedJob((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setJobs((prevJobs) => {
      const updated = prevJobs.map((j) => (j.id === id ? { ...j, notes } : j));
      saveJobs(updated);
      return updated;
    });
    setSelectedJob((prev) => (prev && prev.id === id ? { ...prev, notes } : prev));
  };

  const handleReanalyze = async (id: string) => {
    const target = jobs.find((j) => j.id === id);
    if (!target) return;
    const analysis = await analyzeJobWithAI(target, profile, settings);
    setJobs((prevJobs) => {
      const updated = prevJobs.map((j) => (j.id === id ? { ...j, analysis } : j));
      saveJobs(updated);
      return updated;
    });
    setSelectedJob((prev) => (prev && prev.id === id ? { ...prev, analysis } : prev));
  };

  const handleGeneratePackage = async (id: string) => {
    const target = jobs.find((j) => j.id === id);
    if (!target) return;
    const pkg = await generatePackageWithAI(target, profile, settings);
    setJobs((prevJobs) => {
      const updated = prevJobs.map((j) => (j.id === id ? { ...j, applicationPackage: pkg } : j));
      saveJobs(updated);
      return updated;
    });
    setSelectedJob((prev) => (prev && prev.id === id ? { ...prev, applicationPackage: pkg } : prev));
  };

  const handleDeleteJob = (id: string) => {
    setJobs((prevJobs) => {
      const updated = prevJobs.filter((j) => j.id !== id);
      saveJobs(updated);
      return updated;
    });
    setSelectedJob((prev) => (prev && prev.id === id ? null : prev));
  };

  const handleSaveProfile = (newProfile: MasterProfile) => {
    saveProfile(newProfile);
    setProfile(newProfile);
  };

  const handleResetProfile = () => {
    const def = resetProfileToDefault();
    setProfile(def);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleResetAllData = () => {
    const defJobs = resetJobsToDefault();
    const defProf = resetProfileToDefault();
    setJobs(defJobs);
    setProfile(defProf);
    setSelectedJob(null);
  };

  // KPIs
  const applyCount = jobs.filter((j) => j.analysis?.finalVerdict === "APPLY").length;
  const considerCount = jobs.filter((j) => j.analysis?.finalVerdict === "CONSIDER").length;
  const skipCount = jobs.filter((j) => j.analysis?.finalVerdict === "SKIP").length;
  const appliedCount = jobs.filter((j) => j.status === "applied" || j.status === "interview" || j.status === "offer").length;

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/60 selection:text-indigo-900 dark:selection:text-indigo-200 transition-colors">
      
      {/* Global Navbar */}
      <Navbar
        profile={profile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddJob={() => setIsAddJobOpen(true)}
        onOpenLiveScanner={() => setIsLiveScannerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportCsv={() => exportJobsToCsv(jobs)}
        jobCount={jobs.length}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        
        {/* Top KPI & Intelligence Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Başvurulacak (APPLY)
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {applyCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                İncelenecek (CONSIDER)
              </span>
              <span className="text-2xl font-black text-amber-500 dark:text-amber-400 mt-0.5 block">
                {considerCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Elenenler (SKIP)
              </span>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                {skipCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <XCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Başvuruldu / Mülakat
              </span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                {appliedCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* View Switcher Output */}
        {activeTab === "kanban" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  İş Arama & Başvuru Boru Hattı (Pipeline)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kartları sürükleyip bırakarak aşamaları değiştirebilir veya tıklayarak detaylı AI analizini inceleyebilirsiniz.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLiveScannerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Canlı Ağları Tara</span>
                </button>
                <button
                  onClick={() => setIsAddJobOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manuel İlan Ekle</span>
                </button>
              </div>
            </div>

            <KanbanBoard
              jobs={jobs}
              onSelectJob={(j) => setSelectedJob(j)}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        )}

        {activeTab === "table" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Detaylı İlan Listesi & Filtreleme
              </h2>
              <p className="text-xs text-slate-500">
                Arama yapın, AI kararına göre filtreleyin veya tüm kayıtları Excel / Google Sheets için dışa aktarın.
              </p>
            </div>

            <TableView
              jobs={jobs}
              onSelectJob={(j) => setSelectedJob(j)}
              onUpdateStatus={handleUpdateStatus}
              onDeleteJob={handleDeleteJob}
            />
          </div>
        )}

        {activeTab === "profile" && (
          <ProfileView
            profile={profile}
            onSaveProfile={handleSaveProfile}
            onResetDefault={handleResetProfile}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">JoBot AI</span>
            <span>•</span>
            <span>Windows, Mac, iOS ve Android uyumlu • Sıfır Kurulum</span>
          </div>
          <div>
            Tüm analizler ve veriler tarayıcınızda güvenle saklanmaktadır.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddJobModal
        isOpen={isAddJobOpen}
        onClose={() => setIsAddJobOpen(false)}
        onAddJob={handleAddJob}
      />

      <LiveScannerModal
        isOpen={isLiveScannerOpen}
        onClose={() => setIsLiveScannerOpen(false)}
        profile={profile}
        settings={settings}
        existingUrls={jobs.map(j => j.sourceUrl || "").filter(Boolean)}
        onImportJobs={handleImportLiveJobs}
      />

      <JobDetailModal
        job={selectedJob}
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        onUpdateStatus={handleUpdateStatus}
        onUpdateNotes={handleUpdateNotes}
        onReanalyze={handleReanalyze}
        onGeneratePackage={handleGeneratePackage}
        onDeleteJob={handleDeleteJob}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onResetAllData={handleResetAllData}
      />

    </div>
  );
}
