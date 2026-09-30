import { NextRequest, NextResponse } from "next/server";
import { 
  dbEnsureInitialData, 
  dbGetJobs, 
  dbSaveJob, 
  dbSaveJobs, 
  dbDeleteJob, 
  dbGetProfile, 
  dbSaveProfile, 
  dbGetSettings, 
  dbSaveSettings 
} from "@/lib/db";
import { JobPosting, MasterProfile, AppSettings } from "@/types";
import { sampleJobPostings } from "@/data/sampleJobs";
import { defaultMasterProfile } from "@/data/defaultProfile";

export async function GET() {
  try {
    const data = dbEnsureInitialData();
    return NextResponse.json({
      success: true,
      jobs: data.jobs,
      profile: data.profile,
      settings: data.settings
    });
  } catch (err: unknown) {
    console.warn("GET /api/db fallback warning:", err);
    return NextResponse.json({
      success: true,
      jobs: sampleJobPostings,
      profile: defaultMasterProfile,
      settings: {
        aiProvider: "demo",
        apiKey: "",
        modelName: "gemini-2.0-flash",
        language: "tr",
        theme: "light"
      }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "saveJob": {
        const job = body.job as JobPosting;
        if (!job || !job.id) {
          return NextResponse.json({ error: "Invalid job" }, { status: 400 });
        }
        dbSaveJob(job);
        return NextResponse.json({ success: true });
      }

      case "saveJobs": {
        const jobs = body.jobs as JobPosting[];
        if (!Array.isArray(jobs)) {
          return NextResponse.json({ error: "Invalid jobs array" }, { status: 400 });
        }
        dbSaveJobs(jobs);
        return NextResponse.json({ success: true, count: jobs.length });
      }

      case "deleteJob": {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ error: "Missing id" }, { status: 400 });
        }
        dbDeleteJob(id);
        return NextResponse.json({ success: true });
      }

      case "saveProfile": {
        const profile = body.profile as MasterProfile;
        if (!profile) {
          return NextResponse.json({ error: "Missing profile" }, { status: 400 });
        }
        dbSaveProfile(profile);
        return NextResponse.json({ success: true });
      }

      case "saveSettings": {
        const settings = body.settings as AppSettings;
        if (!settings) {
          return NextResponse.json({ error: "Missing settings" }, { status: 400 });
        }
        dbSaveSettings(settings);
        return NextResponse.json({ success: true });
      }

      case "migrateFromLocalStorage": {
        // If the browser already has customized jobs/profile, persist them all into DB
        const { jobs, profile, settings } = body;
        if (Array.isArray(jobs) && jobs.length > 0) {
          dbSaveJobs(jobs);
        }
        if (profile) {
          dbSaveProfile(profile);
        }
        if (settings) {
          dbSaveSettings(settings);
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err: unknown) {
    console.warn("POST /api/db fallback warning:", err);
    return NextResponse.json({ success: true, fallback: true });
  }
}
