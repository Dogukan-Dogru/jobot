import { NextRequest, NextResponse } from "next/server";
import { JobPosting, MasterProfile, AppSettings } from "@/types";
import { runHeuristicAnalysis } from "@/lib/aiService";

// Helper to strip HTML tags from descriptions
function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const { 
      profile, 
      settings, 
      existingUrls = [],
      query = "product" 
    }: { 
      profile: MasterProfile; 
      settings: AppSettings; 
      existingUrls: string[];
      query?: string;
    } = await req.json();

    const fetchedJobs: JobPosting[] = [];
    const existingUrlSet = new Set(existingUrls.map(u => (u || "").toLowerCase().trim()));

    // 1. Fetch from Jobicy (Remote jobs API)
    try {
      const jobicyRes = await fetch("https://jobicy.com/api/v2/remote-jobs?count=20&tag=product", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JoBot/1.0" },
        signal: AbortSignal.timeout(6000)
      });
      if (jobicyRes.ok) {
        const data = await jobicyRes.json();
        const jobs = data.jobs || [];
        for (const item of jobs) {
          const url = item.url || "";
          if (existingUrlSet.has(url.toLowerCase().trim())) continue;

          const desc = stripHtml(item.jobDescription || item.jobExcerpt || "");
          const title = item.jobTitle || "Product Role";
          const company = item.companyName || "Tech Company";
          const location = item.jobGeo || "Worldwide Remote";

          const newJob: JobPosting = {
            id: `live-jobicy-${item.id || Math.random().toString(36).substring(7)}`,
            title,
            company,
            location,
            country: location.includes("Europe") ? "Europe" : location.includes("USA") ? "United States" : "Remote",
            workModel: "remote",
            platform: "remoteok",
            sourceUrl: url,
            rawDescription: desc,
            dateAdded: new Date().toISOString().split("T")[0],
            status: "new"
          };

          // Analyze with heuristic engine
          newJob.analysis = runHeuristicAnalysis(newJob, profile);
          if (newJob.analysis.finalVerdict === "APPLY") {
            newJob.status = "to_apply";
          }
          fetchedJobs.push(newJob);
        }
      }
    } catch (e) {
      console.warn("Jobicy fetch failed:", e);
    }

    // 2. Fetch from Arbeitnow (European & Remote tech jobs)
    try {
      const arbeitRes = await fetch("https://www.arbeitnow.com/api/job-board-api", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JoBot/1.0" },
        signal: AbortSignal.timeout(6000)
      });
      if (arbeitRes.ok) {
        const data = await arbeitRes.json();
        const items = data.data || [];
        for (const item of items) {
          const titleLower = (item.title || "").toLowerCase();
          const descLower = (item.description || "").toLowerCase();
          
          // Filter for Product, Project, Delivery, or Fintech roles
          const isTargetRole = 
            titleLower.includes("product") || 
            titleLower.includes("project manager") || 
            titleLower.includes("delivery manager") ||
            titleLower.includes("fintech") ||
            titleLower.includes("payments");

          if (!isTargetRole) continue;

          const url = item.url || "";
          if (existingUrlSet.has(url.toLowerCase().trim())) continue;

          const desc = stripHtml(item.description || "");
          const location = item.location || (item.remote ? "Remote Europe" : "Germany");

          const newJob: JobPosting = {
            id: `live-arbeit-${item.slug || Math.random().toString(36).substring(7)}`,
            title: item.title,
            company: item.company_name,
            location,
            country: location.includes("Germany") ? "Germany" : location.includes("UK") ? "United Kingdom" : "Europe",
            workModel: item.remote ? "remote" : "hybrid",
            platform: "company",
            sourceUrl: url,
            rawDescription: desc,
            dateAdded: new Date().toISOString().split("T")[0],
            status: "new"
          };

          newJob.analysis = runHeuristicAnalysis(newJob, profile);
          if (newJob.analysis.finalVerdict === "APPLY") {
            newJob.status = "to_apply";
          }
          fetchedJobs.push(newJob);

          if (fetchedJobs.length >= 15) break; // Keep payload fast and responsive
        }
      }
    } catch (e) {
      console.warn("Arbeitnow fetch failed:", e);
    }

    // 3. Fetch from RemoteOK API
    if (fetchedJobs.length < 15) {
      try {
        const remoteOkRes = await fetch("https://remoteok.com/api?tag=product", {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JoBot/1.0" },
          signal: AbortSignal.timeout(6000)
        });
        if (remoteOkRes.ok) {
          const list = await remoteOkRes.json();
          const items = Array.isArray(list) ? list.slice(1) : []; // First is legal text
          for (const item of items) {
            if (!item.position) continue;
            const url = item.url || "";
            if (existingUrlSet.has(url.toLowerCase().trim())) continue;

            const desc = stripHtml(item.description || "");
            const newJob: JobPosting = {
              id: `live-remoteok-${item.id || Math.random().toString(36).substring(7)}`,
              title: item.position,
              company: item.company || "Tech Company",
              location: item.location || "Remote Worldwide",
              country: "Global Remote",
              workModel: "remote",
              salary: item.salary_min && item.salary_max ? `$${item.salary_min.toLocaleString()} - $${item.salary_max.toLocaleString()}` : undefined,
              platform: "remoteok",
              sourceUrl: url,
              rawDescription: desc,
              dateAdded: new Date().toISOString().split("T")[0],
              status: "new"
            };

            newJob.analysis = runHeuristicAnalysis(newJob, profile);
            if (newJob.analysis.finalVerdict === "APPLY") {
              newJob.status = "to_apply";
            }
            fetchedJobs.push(newJob);

            if (fetchedJobs.length >= 20) break;
          }
        }
      } catch (e) {
        console.warn("RemoteOK fetch failed:", e);
      }
    }

    // Sort with APPLY first, then CONSIDER, then SKIP
    const verdictPriority: Record<string, number> = { APPLY: 1, CONSIDER: 2, SKIP: 3 };
    fetchedJobs.sort((a, b) => {
      const vA = a.analysis?.finalVerdict ? verdictPriority[a.analysis.finalVerdict] || 99 : 99;
      const vB = b.analysis?.finalVerdict ? verdictPriority[b.analysis.finalVerdict] || 99 : 99;
      return vA - vB;
    });

    return NextResponse.json({
      success: true,
      scannedCount: fetchedJobs.length,
      jobs: fetchedJobs,
      timestamp: new Date().toISOString()
    });

  } catch (err: unknown) {
    console.error("Scan jobs endpoint error:", err);
    return NextResponse.json({ error: "İlanlar taranamadı", details: String(err) }, { status: 500 });
  }
}
