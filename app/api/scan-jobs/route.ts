import { NextRequest, NextResponse } from "next/server";
import { JobPosting, MasterProfile, AppSettings } from "@/types";
import { runHeuristicAnalysis } from "@/lib/aiService";
import crypto from "crypto";

// Helper to strip HTML tags
function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#038;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// Strict Whitelist & Blacklist filter to eliminate Software Engineer, Account Manager, Designer, etc.
function isValidTargetRole(title: string): boolean {
  const t = title.toLowerCase().trim();

  // 1. Strict Blacklist (Negative keywords - reject immediately)
  const blacklist = [
    "software engineer", "software developer", "frontend", "backend", "fullstack",
    "full stack", "devops", "sre", "qa engineer", "test engineer", "architect",
    "product designer", "ui/ux", "ux designer", "ui designer", "graphic designer",
    "account manager", "account executive", "sales manager", "sales executive",
    "business development", "customer success", "customer support", "recruiter",
    "hr manager", "talent acquisition", "general manager assistant", "medikal",
    "medical", "export", "pharmaceutical", "data engineer", "data scientist",
    "financial analyst", "product marketing manager", "pmm", "asistan", "assistant",
    "relations specialist", "specialist (spanish", "satış", "pazarlama uzmanı"
  ];

  for (const neg of blacklist) {
    if (t.includes(neg)) {
      return false;
    }
  }

  // 2. Whitelist (Must match legitimate target roles)
  const whitelist = [
    "product manager", "product owner", "project manager", "technical product",
    "technical project", "delivery manager", "program manager", "product lead",
    "head of product", "vp of product", "scrum master", "product operations",
    "ürün yöneticisi", "ürün müdürü", "proje yöneticisi", "proje müdürü",
    "associate product manager", "senior product manager", "lead product manager",
    "junior product manager", "apm", "tpm", "group product manager"
  ];

  return whitelist.some(pos => t.includes(pos));
}

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8"
};

export async function POST(req: NextRequest) {
  try {
    const { 
      profile, 
      existingUrls = [],
      sources = ["linkedin", "kariyer", "remoteok", "europe"]
    }: { 
      profile: MasterProfile; 
      settings?: AppSettings; 
      existingUrls: string[];
      sources?: string[];
    } = await req.json();

    const fetchedJobs: JobPosting[] = [];
    const seenUrls = new Set(existingUrls.map(u => (u || "").toLowerCase().trim()).filter(Boolean));

    const tasks: Promise<void>[] = [];

    // -------------------------------------------------------------
    // SOURCE 1: LinkedIn Guest Job Search API (Parallel TR & Global)
    // -------------------------------------------------------------
    if (sources.includes("linkedin")) {
      const fetchLinkedIn = async () => {
        const liUrls = [
          "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Product%20Manager&location=Turkey&start=0",
          "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Product%20Manager&location=Worldwide&f_WT=2&start=0"
        ];

        const subFetches = liUrls.map(async (liUrl) => {
          try {
            const liRes = await fetch(liUrl, {
              headers: BROWSER_HEADERS,
              signal: AbortSignal.timeout(5000)
            });

            if (!liRes.ok) return;

            const html = await liRes.text();
            const titleRegex = /<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/gi;
            const companyRegex = /<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/gi;
            const linkRegex = /<a[^>]*class="[^"]*base-card__full-link[^"]*"[^>]*href="([^"]+)"/gi;
            const locRegex = /<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;

            const titles = [...html.matchAll(titleRegex)].map(m => stripHtml(m[1]));
            const companies = [...html.matchAll(companyRegex)].map(m => stripHtml(m[1]));
            const links = [...html.matchAll(linkRegex)].map(m => m[1].split("?")[0]);
            const locations = [...html.matchAll(locRegex)].map(m => stripHtml(m[1]));

            for (let i = 0; i < titles.length; i++) {
              const title = titles[i];
              if (!isValidTargetRole(title)) continue; // STRICT FILTER

              const url = links[i] || "";
              const urlKey = url.toLowerCase().trim();
              if (urlKey && seenUrls.has(urlKey)) continue;
              if (urlKey) seenUrls.add(urlKey);

              const company = companies[i] || "LinkedIn Company";
              const location = locations[i] || "Turkey / Remote";

              const newJob: JobPosting = {
                id: `live-linkedin-${crypto.randomUUID()}`,
                title,
                company,
                location,
                country: location.includes("Turkey") || location.includes("Istanbul") ? "Türkiye" : "Global Remote",
                workModel: location.toLowerCase().includes("remote") ? "remote" : "hybrid",
                platform: "linkedin",
                sourceUrl: url,
                rawDescription: `${company} bünyesinde ${title} pozisyonu. Lokasyon: ${location}.\nDetaylı görev tanımı ve başvuru için LinkedIn bağlantısını ziyaret ediniz.`,
                dateAdded: new Date().toISOString().split("T")[0],
                status: "new"
              };

              newJob.analysis = runHeuristicAnalysis(newJob, profile);
              if (newJob.analysis.finalVerdict === "APPLY") {
                newJob.status = "to_apply";
              }
              fetchedJobs.push(newJob);
            }
          } catch (e) {
            console.warn("LinkedIn sub-fetch error:", e);
          }
        });

        await Promise.allSettled(subFetches);
      };

      tasks.push(fetchLinkedIn());
    }

    // -------------------------------------------------------------
    // SOURCE 2: Kariyer.net Live Search (Türkiye)
    // -------------------------------------------------------------
    if (sources.includes("kariyer")) {
      const fetchKariyer = async () => {
        try {
          const kariyerUrl = "https://www.kariyer.net/is-ilanlari?kw=product%20manager";
          const kRes = await fetch(kariyerUrl, {
            headers: BROWSER_HEADERS,
            signal: AbortSignal.timeout(5000)
          });

          if (!kRes.ok) return;

          const html = await kRes.text();
          const cardRegex = /<a[^>]*href="(\/is-ilani\/[^"]+)"[^>]*>[\s\S]*?<span[^>]*data-test="ad-card-title"[^>]*>([\s\S]*?)<\/span>/gi;
          const matches = [...html.matchAll(cardRegex)];

          for (const m of matches) {
            const rawUrl = "https://www.kariyer.net" + m[1];
            const title = stripHtml(m[2]);

            if (!isValidTargetRole(title)) continue;
            const urlKey = rawUrl.toLowerCase().trim();
            if (seenUrls.has(urlKey)) continue;
            seenUrls.add(urlKey);

            const slugParts = m[1].split("-");
            const companyNameGuess = slugParts.length > 2 
              ? slugParts.slice(1, -2).join(" ").toUpperCase() 
              : "Kariyer.net Şirketi";

            const newJob: JobPosting = {
              id: `live-kariyer-${crypto.randomUUID()}`,
              title,
              company: companyNameGuess.substring(0, 30),
              location: "İstanbul / Türkiye",
              country: "Türkiye",
              workModel: "hybrid",
              platform: "kariyer",
              sourceUrl: rawUrl,
              rawDescription: `Kariyer.net üzerinden yayınlanan ${title} ilanı.\nŞirket: ${companyNameGuess}.\nBaşvuru ve detaylar için Kariyer.net bağlantısını kullanabilirsiniz.`,
              dateAdded: new Date().toISOString().split("T")[0],
              status: "new"
            };

            newJob.analysis = runHeuristicAnalysis(newJob, profile);
            if (newJob.analysis.finalVerdict === "APPLY") {
              newJob.status = "to_apply";
            }
            fetchedJobs.push(newJob);
          }
        } catch (err) {
          console.warn("Kariyer.net fetch failed:", err);
        }
      };

      tasks.push(fetchKariyer());
    }

    // -------------------------------------------------------------
    // SOURCE 3: RemoteOK API (Public JSON API)
    // -------------------------------------------------------------
    if (sources.includes("remoteok")) {
      const fetchRemoteOK = async () => {
        try {
          const res = await fetch("https://remoteok.com/api", {
            headers: BROWSER_HEADERS,
            signal: AbortSignal.timeout(5000)
          });

          if (!res.ok) return;

          const data = await res.json();
          if (!Array.isArray(data)) return;

          // data[0] is often legal/disclaimer object, items start at 1
          const items = data.slice(1);

          for (const item of items) {
            const title = item.position || "";
            if (!isValidTargetRole(title)) continue;

            const url = item.url || (item.id ? `https://remoteok.com/remote-jobs/${item.id}` : "");
            const urlKey = url.toLowerCase().trim();
            if (urlKey && seenUrls.has(urlKey)) continue;
            if (urlKey) seenUrls.add(urlKey);

            const desc = stripHtml(item.description || "");
            const location = item.location || "Worldwide Remote";
            const salary = (item.salary_min && item.salary_max) 
              ? `$${Math.round(item.salary_min / 1000)}k - $${Math.round(item.salary_max / 1000)}k` 
              : undefined;

            const newJob: JobPosting = {
              id: `live-remoteok-${crypto.randomUUID()}`,
              title,
              company: item.company || "Remote Company",
              location,
              country: location.toLowerCase().includes("us") ? "United States" : "Worldwide Remote",
              workModel: "remote",
              platform: "remoteok",
              salary,
              sourceUrl: url,
              rawDescription: desc.length > 50 ? desc : `${item.company} bünyesinde ${title} pozisyonu. RemoteOK ilanı.`,
              dateAdded: new Date().toISOString().split("T")[0],
              status: "new"
            };

            newJob.analysis = runHeuristicAnalysis(newJob, profile);
            if (newJob.analysis.finalVerdict === "APPLY") {
              newJob.status = "to_apply";
            }
            fetchedJobs.push(newJob);
          }
        } catch (err) {
          console.warn("RemoteOK fetch failed:", err);
        }
      };

      tasks.push(fetchRemoteOK());
    }

    // -------------------------------------------------------------
    // SOURCE 4: Jobicy & Remotive (Europe & Global Remote)
    // -------------------------------------------------------------
    if (sources.includes("europe")) {
      const fetchEurope = async () => {
        const subFetches = [
          // Jobicy
          (async () => {
            try {
              const res = await fetch("https://jobicy.com/api/v2/remote-jobs?count=20&tag=product", {
                headers: BROWSER_HEADERS,
                signal: AbortSignal.timeout(5000)
              });
              if (!res.ok) return;
              const data = await res.json();
              const jobs = data.jobs || [];

              for (const item of jobs) {
                const title = item.jobTitle || "";
                if (!isValidTargetRole(title)) continue;

                const url = item.url || "";
                const urlKey = url.toLowerCase().trim();
                if (urlKey && seenUrls.has(urlKey)) continue;
                if (urlKey) seenUrls.add(urlKey);

                const desc = stripHtml(item.jobDescription || item.jobExcerpt || "");
                const location = item.jobGeo || "Worldwide Remote";

                const newJob: JobPosting = {
                  id: `live-jobicy-${crypto.randomUUID()}`,
                  title,
                  company: item.companyName || "Tech Company",
                  location,
                  country: location.includes("Europe") ? "Europe" : "Worldwide Remote",
                  workModel: "remote",
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
              }
            } catch (e) {
              console.warn("Jobicy sub-fetch failed:", e);
            }
          })(),

          // Remotive
          (async () => {
            try {
              const res = await fetch("https://remotive.com/api/remote-jobs?category=product", {
                headers: BROWSER_HEADERS,
                signal: AbortSignal.timeout(5000)
              });
              if (!res.ok) return;
              const data = await res.json();
              const jobs = data.jobs || [];

              for (const item of jobs) {
                const title = item.title || "";
                if (!isValidTargetRole(title)) continue;

                const url = item.url || "";
                const urlKey = url.toLowerCase().trim();
                if (urlKey && seenUrls.has(urlKey)) continue;
                if (urlKey) seenUrls.add(urlKey);

                const desc = stripHtml(item.description || "");
                const location = item.candidate_required_location || "Worldwide";

                const newJob: JobPosting = {
                  id: `live-remotive-${crypto.randomUUID()}`,
                  title,
                  company: item.company_name || "Tech Company",
                  location,
                  country: location.includes("Europe") ? "Europe" : location.includes("USA") ? "United States" : "Worldwide Remote",
                  workModel: "remote",
                  platform: "company",
                  salary: item.salary || undefined,
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
              }
            } catch (e) {
              console.warn("Remotive sub-fetch failed:", e);
            }
          })()
        ];

        await Promise.allSettled(subFetches);
      };

      tasks.push(fetchEurope());
    }

    // Execute all sources concurrently
    await Promise.allSettled(tasks);

    // Sort with APPLY first, then CONSIDER, then SKIP (including country-locked ones) at the very bottom
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
