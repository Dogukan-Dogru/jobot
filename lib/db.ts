import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { JobPosting, MasterProfile, AppSettings } from "@/types";
import { sampleJobPostings } from "@/data/sampleJobs";
import { defaultMasterProfile } from "@/data/defaultProfile";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "jobot.db");

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);
  
  // Pragmas for performance and data safety
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      status TEXT NOT NULL,
      platform TEXT,
      data_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_updated ON jobs(updated_at DESC);

    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  dbInstance = db;
  return dbInstance;
}

// -------------------------------------------------------------
// JOBS REPOSITORY
// -------------------------------------------------------------
export function dbGetJobs(): JobPosting[] {
  const db = getDatabase();
  const rows = db.prepare("SELECT data_json FROM jobs ORDER BY updated_at DESC").all() as { data_json: string }[];
  if (!rows || rows.length === 0) {
    return [];
  }
  return rows.map(r => JSON.parse(r.data_json) as JobPosting);
}

export function dbSaveJob(job: JobPosting): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO jobs (id, title, company, status, platform, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      company = excluded.company,
      status = excluded.status,
      platform = excluded.platform,
      data_json = excluded.data_json,
      updated_at = excluded.updated_at
  `);
  stmt.run(
    job.id,
    job.title,
    job.company,
    job.status,
    job.platform,
    JSON.stringify(job),
    Date.now()
  );
}

export function dbSaveJobs(jobs: JobPosting[]): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO jobs (id, title, company, status, platform, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      company = excluded.company,
      status = excluded.status,
      platform = excluded.platform,
      data_json = excluded.data_json,
      updated_at = excluded.updated_at
  `);

  const tx = db.transaction((items: JobPosting[]) => {
    for (const job of items) {
      stmt.run(
        job.id,
        job.title,
        job.company,
        job.status,
        job.platform,
        JSON.stringify(job),
        Date.now()
      );
    }
  });

  tx(jobs);
}

export function dbDeleteJob(id: string): void {
  const db = getDatabase();
  db.prepare("DELETE FROM jobs WHERE id = ?").run(id);
}

// -------------------------------------------------------------
// PROFILE & SETTINGS REPOSITORY
// -------------------------------------------------------------
export function dbGetProfile(): MasterProfile | null {
  const db = getDatabase();
  const row = db.prepare("SELECT value_json FROM kv_store WHERE key = ?").get("master_profile") as { value_json: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.value_json) as MasterProfile;
  } catch {
    return null;
  }
}

export function dbSaveProfile(profile: MasterProfile): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO kv_store (key, value_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value_json = excluded.value_json,
      updated_at = excluded.updated_at
  `).run("master_profile", JSON.stringify(profile), Date.now());
}

export function dbGetSettings(): AppSettings | null {
  const db = getDatabase();
  const row = db.prepare("SELECT value_json FROM kv_store WHERE key = ?").get("app_settings") as { value_json: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.value_json) as AppSettings;
  } catch {
    return null;
  }
}

export function dbSaveSettings(settings: AppSettings): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO kv_store (key, value_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value_json = excluded.value_json,
      updated_at = excluded.updated_at
  `).run("app_settings", JSON.stringify(settings), Date.now());
}

// -------------------------------------------------------------
// INITIAL SEEDING HELPER
// -------------------------------------------------------------
export function dbEnsureInitialData(): {
  jobs: JobPosting[];
  profile: MasterProfile;
  settings: AppSettings;
} {
  let jobs = dbGetJobs();
  let profile = dbGetProfile();
  let settings = dbGetSettings();

  if (jobs.length === 0) {
    dbSaveJobs(sampleJobPostings);
    jobs = sampleJobPostings;
  }

  if (!profile) {
    dbSaveProfile(defaultMasterProfile);
    profile = defaultMasterProfile;
  }

  if (!settings) {
    const defSettings: AppSettings = {
      aiProvider: "demo",
      apiKey: "",
      modelName: "gemini-2.0-flash",
      language: "tr",
      theme: "light"
    };
    dbSaveSettings(defSettings);
    settings = defSettings;
  }

  return { jobs, profile, settings };
}
