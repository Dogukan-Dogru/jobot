import { AppSettings, JobPosting, MasterProfile } from "@/types";
import { defaultMasterProfile } from "@/data/defaultProfile";
import { sampleJobPostings } from "@/data/sampleJobs";

const STORAGE_KEYS = {
  JOBS: "jobot_saved_jobs_v1",
  PROFILE: "jobot_master_profile_v1",
  SETTINGS: "jobot_app_settings_v1"
};

export const defaultSettings: AppSettings = {
  aiProvider: "demo",
  apiKey: "",
  modelName: "gemini-2.0-flash",
  language: "tr",
  theme: "light"
};

// Safe localStorage checker
const isBrowser = typeof window !== "undefined";

export function getStoredJobs(): JobPosting[] {
  if (!isBrowser) return sampleJobPostings;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.JOBS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(sampleJobPostings));
      return sampleJobPostings;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return sampleJobPostings;

    // Sanitize any missing or duplicate IDs from previous scans
    const seenIds = new Set<string>();
    let hasModified = false;
    const sanitized: JobPosting[] = parsed.map((job: JobPosting, idx: number) => {
      if (!job.id || seenIds.has(job.id)) {
        hasModified = true;
        const newId = `${job.platform || "job"}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}-${idx}`;
        seenIds.add(newId);
        return { ...job, id: newId };
      }
      seenIds.add(job.id);
      return job;
    });

    if (hasModified) {
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (error) {
    console.error("Error reading jobs from localStorage:", error);
    return sampleJobPostings;
  }
}

export function saveJobs(jobs: JobPosting[]): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  } catch (error) {
    console.error("Error saving jobs to localStorage:", error);
  }
}

export function saveJob(job: JobPosting): JobPosting[] {
  const jobs = getStoredJobs();
  const existingIdx = jobs.findIndex(j => j.id === job.id);
  let updated: JobPosting[];
  if (existingIdx >= 0) {
    updated = [...jobs];
    updated[existingIdx] = job;
  } else {
    updated = [job, ...jobs];
  }
  saveJobs(updated);
  return updated;
}

export function deleteJob(id: string): JobPosting[] {
  const jobs = getStoredJobs();
  const updated = jobs.filter(j => j.id !== id);
  saveJobs(updated);
  return updated;
}

export function resetJobsToDefault(): JobPosting[] {
  if (isBrowser) {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(sampleJobPostings));
  }
  return sampleJobPostings;
}

export function getStoredProfile(): MasterProfile {
  if (!isBrowser) return defaultMasterProfile;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(defaultMasterProfile));
      return defaultMasterProfile;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading profile from localStorage:", error);
    return defaultMasterProfile;
  }
}

export function saveProfile(profile: MasterProfile): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error("Error saving profile to localStorage:", error);
  }
}

export function resetProfileToDefault(): MasterProfile {
  if (isBrowser) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(defaultMasterProfile));
  }
  return defaultMasterProfile;
}

export function getStoredSettings(): AppSettings {
  if (!isBrowser) return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      return defaultSettings;
    }
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (error) {
    console.error("Error reading settings from localStorage:", error);
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving settings to localStorage:", error);
  }
}

// Export jobs to CSV for Google Sheets & Excel compatibility
export function exportJobsToCsv(jobs: JobPosting[]): void {
  if (!isBrowser) return;

  const headers = [
    "ID",
    "Tarih",
    "Şirket",
    "Pozisyon",
    "Rol Tipi",
    "Konum",
    "Çalışma Modeli",
    "Maaş",
    "Kaynak",
    "Durum",
    "AI Kararı",
    "Türkiye Uygunluğu",
    "Vize Sponsorluğu",
    "Karar Gerekçesi",
    "İlan Linki"
  ];

  const escapeCsv = (str: string | undefined | null) => {
    if (!str) return '""';
    const clean = String(str).replace(/"/g, '""').replace(/\n/g, " ");
    return `"${clean}"`;
  };

  const rows = jobs.map(job => [
    escapeCsv(job.id),
    escapeCsv(job.dateAdded),
    escapeCsv(job.company),
    escapeCsv(job.title),
    escapeCsv(job.analysis?.roleType || "Belirtilmemiş"),
    escapeCsv(job.location),
    escapeCsv(job.workModel),
    escapeCsv(job.salary || "Belirtilmemiş"),
    escapeCsv(job.platform),
    escapeCsv(job.status),
    escapeCsv(job.analysis?.finalVerdict || "Analiz Edilmedi"),
    escapeCsv(job.analysis?.eligibility.summary || "Belirsiz"),
    escapeCsv(job.analysis?.eligibility.visaSponsorship || "Belirsiz"),
    escapeCsv(job.analysis?.oneSentenceReason || job.notes || ""),
    escapeCsv(job.sourceUrl || "")
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `jobot_basvuru_takip_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
