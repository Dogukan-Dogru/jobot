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
  exportJobsToCsv 
} from "@/lib/storage";
import { analyzeJobWithAI, generatePackageWithAI } from "@/lib/aiService";
import { Navbar } from "@/components/Navbar";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TableView } from "@/components/TableView";
import { ProfileView } from "@/components/ProfileView";
import { AddJobModal } from "@/components/AddJobModal";
import { JobDetailModal } from "@/components/JobDetailModal";
import { SettingsModal } from "@/components/SettingsModal";
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Send, 
  Users, 
  Plus, 
  Info,
  ArrowRight
} from "lucide-react";

export default function Home() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [profile, setProfile] = useState<MasterProfile>(getStoredProfile());
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());

  const [activeTab, setActiveTab] = useState<"kanban" | "table" | "profile">("kanban");
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize client storage
  useEffect(() => {
    setIsMounted(true);
    setJobs(getStoredJobs());
    setProfile(getStoredProfile());
    setSettings(getStoredSettings());
  }, []);

  // Sync selected job if jobs array updates
  useEffect(() => {
    if (selectedJob) {
      const fresh = jobs.find((j) => j.id === selectedJob.id);
      if (fresh) setSelectedJob(fresh);
    }
  }, [jobs]);

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

  const handleUpdateStatus = (id: string, status: JobStatus) => {
    const target = jobs.find((j) => j.id === id);
    if (!target) return;
    const updatedJob = { ...target, status };
    const updated = saveJob(updatedJob);
    setJobs(updated);
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    const target = jobs.find((j) => j.id === id);
    if (!target) return;
    const updatedJob = { ...target, notes };
    const updated = saveJob(updatedJob);
    setJobs(updated);
  };

  const handleReanalyze = async (id: string) => {
    const target = jobs.find((j) => j.id === id);
    if (!target) return;
    const analysis = await analyzeJobWithAI(target, profile, settings);
    const updatedJob = { ...target, analysis };
    const updated = saveJob(updatedJob);
    setJobs(updated);
  };

  const handleGeneratePackage = async (id: string) => {
    const target = jobs.find((j) => j.id === id);
    if (!target) return;
    const pkg = await generatePackageWithAI(target, profile, settings);
    const updatedJob = { ...target, applicationPackage: pkg };
    const updated = saveJob(updatedJob);
    setJobs(updated);
  };

  const handleDeleteJob = (id: string) => {
    const updated = deleteJob(id);
    setJobs(updated);
    if (selectedJob?.id === id) setSelectedJob(null);
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Global Navbar */}
      <Navbar
        profile={profile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddJob={() => setIsAddJobOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportCsv={() => exportJobsToCsv(jobs)}
        jobCount={jobs.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        
        {/* Top KPI & Intelligence Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Başvurulacak (APPLY)
              </span>
              <span className="text-2xl font-black text-emerald-600 mt-0.5 block">
                {applyCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                İncelenecek (CONSIDER)
              </span>
              <span className="text-2xl font-black text-amber-500 mt-0.5 block">
                {considerCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Elenenler (SKIP)
              </span>
              <span className="text-2xl font-black text-rose-600 mt-0.5 block">
                {skipCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <XCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Başvuruldu / Mülakat
              </span>
              <span className="text-2xl font-black text-indigo-600 mt-0.5 block">
                {appliedCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* View Switcher Output */}
        {activeTab === "kanban" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  İş Arama & Başvuru Boru Hattı (Pipeline)
                </h2>
                <p className="text-xs text-slate-500">
                  İlanları kartlara tıklayarak detaylı analiz edebilir, sağ alt butondan sonraki aşamaya taşıyabilirsiniz.
                </p>
              </div>
              <button
                onClick={() => setIsAddJobOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Hızlı İlan Ekle</span>
              </button>
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
