import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import os from "os";
import { JobPosting, MasterProfile, AppSettings } from "@/types";
import { defaultMasterProfile } from "@/data/defaultProfile";

let dbInstance: Database.Database | null = null;
let useMemoryFallback = false;

// Fallback in-memory store if SQLite cannot be opened (e.g. strict read-only serverless environments)
const memoryStore: {
  jobs: JobPosting[];
  profile: MasterProfile;
  settings: AppSettings;
} = {
  jobs: [],
  profile: defaultMasterProfile,
  settings: {
    aiProvider: "demo",
    apiKey: "",
    modelName: "gemini-2.0-flash",
    language: "tr",
    theme: "light"
  }
};

function resolveDbPath(): { dbPath: string; isServerless: boolean } {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless) {
    return {
      dbPath: path.join(os.tmpdir(), "jobot.db"),
      isServerless: true
    };
  }

  const localDir = path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return {
      dbPath: path.join(localDir, "jobot.db"),
      isServerless: false
    };
  } catch (e) {
    console.warn("Local DB dir creation failed, falling back to tmpdir:", e);
    return {
      dbPath: path.join(os.tmpdir(), "jobot.db"),
      isServerless: true
    };
  }
}

export function getDatabase(): Database.Database | null {
  if (useMemoryFallback) return null;
  if (dbInstance) return dbInstance;

  try {
    const { dbPath, isServerless } = resolveDbPath();
    const db = new Database(dbPath);

    // On serverless/Vercel, DELETE mode avoids WAL shared memory (.db-shm) crashes
    if (isServerless) {
      db.pragma("journal_mode = DELETE");
    } else {
      db.pragma("journal_mode = WAL");
    }
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

    // Purge any legacy sample jobs from database
    try {
      db.prepare("DELETE FROM jobs WHERE id LIKE 'sample-job-%'").run();
    } catch {
      // Ignore if table was just created
    }

    dbInstance = db;
    return dbInstance;
  } catch (err) {
    console.warn("SQLite initialization failed, switching to memory fallback:", err);
    useMemoryFallback = true;
    return null;
  }
}

// -------------------------------------------------------------
// JOBS REPOSITORY
// -------------------------------------------------------------
export function dbGetJobs(): JobPosting[] {
  const db = getDatabase();
  if (!db) {
    return memoryStore.jobs;
  }
  try {
    const rows = db.prepare("SELECT data_json FROM jobs ORDER BY updated_at DESC").all() as { data_json: string }[];
    if (!rows || rows.length === 0) {
      return memoryStore.jobs;
    }
    return rows.map(r => JSON.parse(r.data_json) as JobPosting);
  } catch (err) {
    console.warn("dbGetJobs error, using memory fallback:", err);
    return memoryStore.jobs;
  }
}

export function dbSaveJob(job: JobPosting): void {
  // Update memory store
  const idx = memoryStore.jobs.findIndex(j => j.id === job.id);
  if (idx >= 0) {
    memoryStore.jobs[idx] = job;
  } else {
    memoryStore.jobs.unshift(job);
  }

  const db = getDatabase();
  if (!db) return;
  try {
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
  } catch (err) {
    console.warn("dbSaveJob SQLite write error:", err);
  }
}

export function dbSaveJobs(jobs: JobPosting[]): void {
  // Update memory store
  for (const job of jobs) {
    const idx = memoryStore.jobs.findIndex(j => j.id === job.id);
    if (idx >= 0) {
      memoryStore.jobs[idx] = job;
    } else {
      memoryStore.jobs.unshift(job);
    }
  }

  const db = getDatabase();
  if (!db) return;
  try {
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
  } catch (err) {
    console.warn("dbSaveJobs SQLite write error:", err);
  }
}

export function dbDeleteJob(id: string): void {
  memoryStore.jobs = memoryStore.jobs.filter(j => j.id !== id);
  const db = getDatabase();
  if (!db) return;
  try {
    db.prepare("DELETE FROM jobs WHERE id = ?").run(id);
  } catch (err) {
    console.warn("dbDeleteJob SQLite delete error:", err);
  }
}

// -------------------------------------------------------------
// PROFILE & SETTINGS REPOSITORY
// -------------------------------------------------------------
export function dbGetProfile(): MasterProfile | null {
  const db = getDatabase();
  if (!db) return memoryStore.profile;
  try {
    const row = db.prepare("SELECT value_json FROM kv_store WHERE key = ?").get("master_profile") as { value_json: string } | undefined;
    if (!row) return memoryStore.profile;
    return JSON.parse(row.value_json) as MasterProfile;
  } catch (err) {
    console.warn("dbGetProfile error:", err);
    return memoryStore.profile;
  }
}

export function dbSaveProfile(profile: MasterProfile): void {
  memoryStore.profile = profile;
  const db = getDatabase();
  if (!db) return;
  try {
    db.prepare(`
      INSERT INTO kv_store (key, value_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value_json = excluded.value_json,
        updated_at = excluded.updated_at
    `).run("master_profile", JSON.stringify(profile), Date.now());
  } catch (err) {
    console.warn("dbSaveProfile error:", err);
  }
}

export function dbGetSettings(): AppSettings | null {
  const db = getDatabase();
  if (!db) return memoryStore.settings;
  try {
    const row = db.prepare("SELECT value_json FROM kv_store WHERE key = ?").get("app_settings") as { value_json: string } | undefined;
    if (!row) return memoryStore.settings;
    return JSON.parse(row.value_json) as AppSettings;
  } catch (err) {
    console.warn("dbGetSettings error:", err);
    return memoryStore.settings;
  }
}

export function dbSaveSettings(settings: AppSettings): void {
  memoryStore.settings = settings;
  const db = getDatabase();
  if (!db) return;
  try {
    db.prepare(`
      INSERT INTO kv_store (key, value_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value_json = excluded.value_json,
        updated_at = excluded.updated_at
    `).run("app_settings", JSON.stringify(settings), Date.now());
  } catch (err) {
    console.warn("dbSaveSettings error:", err);
  }
}

// -------------------------------------------------------------
// INITIAL SEEDING HELPER
// -------------------------------------------------------------
export function dbEnsureInitialData(): {
  jobs: JobPosting[];
  profile: MasterProfile;
  settings: AppSettings;
} {
  try {
    let jobs = dbGetJobs().filter(j => j && j.id && !j.id.startsWith("sample-job-"));
    let profile = dbGetProfile();
    let settings = dbGetSettings();

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
  } catch (err) {
    console.warn("dbEnsureInitialData fallback triggered:", err);
    return {
      jobs: [],
      profile: defaultMasterProfile,
      settings: {
        aiProvider: "demo",
        apiKey: "",
        modelName: "gemini-2.0-flash",
        language: "tr",
        theme: "light"
      }
    };
  }
}
