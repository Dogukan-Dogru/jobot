import { NextRequest, NextResponse } from "next/server";
import { JobPosting, MasterProfile, AppSettings } from "@/types";
import { runHeuristicAnalysis, parseGeoLocation, detectWorkModel } from "@/lib/aiService";
import crypto from "crypto";
import { fetchJobDescription, htmlToStructuredText } from "@/lib/jobDescription";
import { buildSearchPlan, buildSourceQueries, isValidTargetRole as planAccepts, SearchPlan } from "@/lib/searchPlan";

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
      sources = ["linkedin", "kariyer", "remoteok", "europe"],
      roleIds
    }: { 
      profile: MasterProfile; 
      settings?: AppSettings; 
      existingUrls: string[];
      sources?: string[];
      roleIds?: string[];
    } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: "Profil gerekli" }, { status: 400 });
    }

    // Arama tamamen profilden üretilir (roller, ülkeler, kaynak sorguları, başlık filtresi)
    const plan: SearchPlan = buildSearchPlan(profile);
    const queries = buildSourceQueries(plan, roleIds);
    const isValidTargetRole = (title: string) => planAccepts(title, plan, roleIds);

    const fetchedJobs: JobPosting[] = [];
    const seenUrls = new Set(existingUrls.map(u => (u || "").toLowerCase().trim()).filter(Boolean));

    const tasks: Promise<void>[] = [];

    // -------------------------------------------------------------
    // SOURCE 1: LinkedIn Guest Job Search API (Both Product & Project)
    // -------------------------------------------------------------
    if (sources.includes("linkedin")) {
      const fetchLinkedIn = async () => {
        const liUrls = queries.linkedin.map((q) => {
          const base = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(q.keywords)}&location=${encodeURIComponent(q.location)}`;
          return q.remote ? `${base}&f_WT=2&start=0` : `${base}&start=0`;
        });

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
              const rawLoc = locations[i] || "Remote";
              const { location, country } = parseGeoLocation(rawLoc);

              const newJob: JobPosting = {
                id: `live-linkedin-${crypto.randomUUID()}`,
                title,
                company,
                location,
                country,
                workModel: detectWorkModel(title, rawLoc, `${company} ${title}`),
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
    // SOURCE 2: Kariyer.net Live Search (yalnızca Türkiye hedefliyorsa)
    // -------------------------------------------------------------
    if (sources.includes("kariyer") && queries.kariyer.length > 0) {
      const fetchKariyer = async () => {
        const kariyerUrls = queries.kariyer.map((kw) => `https://www.kariyer.net/is-ilanlari?kw=${encodeURIComponent(kw)}`);

        const subFetches = kariyerUrls.map(async (kariyerUrl) => {
          try {
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
                workModel: detectWorkModel(title, "İstanbul / Türkiye", companyNameGuess),
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
            console.warn("Kariyer.net sub-fetch failed:", err);
          }
        });

        await Promise.allSettled(subFetches);
      };

      tasks.push(fetchKariyer());
    }

    // -------------------------------------------------------------
    // SOURCE 3: RemoteOK API (Public JSON API - PM & Project Manager)
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

          const items = data.slice(1);

          for (const item of items) {
            const title = item.position || "";
            if (!isValidTargetRole(title)) continue;

            const url = item.url || (item.id ? `https://remoteok.com/remote-jobs/${item.id}` : "");
            const urlKey = url.toLowerCase().trim();
            if (urlKey && seenUrls.has(urlKey)) continue;
            if (urlKey) seenUrls.add(urlKey);

            const desc = htmlToStructuredText(item.description || "");
            const { location, country } = parseGeoLocation(item.location);
            const salary = (item.salary_min && item.salary_max) 
              ? `$${Math.round(item.salary_min / 1000)}k - $${Math.round(item.salary_max / 1000)}k` 
              : undefined;

            const newJob: JobPosting = {
              id: `live-remoteok-${crypto.randomUUID()}`,
              title,
              company: item.company || "Remote Company",
              location,
              country,
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
    // SOURCE 4: Jobicy & Remotive (Europe & Global PM / Project Management)
    // -------------------------------------------------------------
    if (sources.includes("europe")) {
      const fetchEurope = async () => {
        const subFetches: Promise<void>[] = [];

        // Jobicy queries
        const jobicyTags = queries.jobicyTags;

        for (const tag of jobicyTags) {
          subFetches.push((async () => {
            try {
              const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=20&tag=${tag}`, {
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

                const desc = htmlToStructuredText(item.jobDescription || item.jobExcerpt || "");
                const { location, country } = parseGeoLocation(item.jobGeo);

                const newJob: JobPosting = {
                  id: `live-jobicy-${crypto.randomUUID()}`,
                  title,
                  company: item.companyName || "Tech Company",
                  location,
                  country,
                  workModel: detectWorkModel(title, location, desc),
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
              console.warn(`Jobicy (${tag}) sub-fetch failed:`, e);
            }
          })());
        }

        // Remotive queries
        const remotiveUrls = [
          ...queries.remotiveCategories.map((c) => ({ key: c, url: `https://remotive.com/api/remote-jobs?category=${encodeURIComponent(c)}` })),
          ...queries.remotiveSearches.map((q) => ({ key: q, url: `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}` }))
        ];

        for (const { key: cat, url: remotiveUrl } of remotiveUrls) {
          subFetches.push((async () => {
            try {
              const res = await fetch(remotiveUrl, {
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

                const desc = htmlToStructuredText(item.description || "");
                const { location, country } = parseGeoLocation(item.candidate_required_location);

                const newJob: JobPosting = {
                  id: `live-remotive-${crypto.randomUUID()}`,
                  title,
                  company: item.company_name || "Tech Company",
                  location,
                  country,
                  workModel: detectWorkModel(title, location, desc),
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
              console.warn(`Remotive (${cat}) sub-fetch failed:`, e);
            }
          })());
        }

        await Promise.allSettled(subFetches);
      };

      tasks.push(fetchEurope());
    }

    // Execute all sources concurrently
    await Promise.allSettled(tasks);

    // İlan metni zenginleştirme: LinkedIn/Kariyer.net kayıtları yalnızca başlık+şirket içerir.
    // Elenmemiş ilanların tam metnini çekip gereksinim karşılaştırmasını (eksik beceri, deneyim yılı, sertifika, dil) yeniden çalıştır.
    const needsDetail = fetchedJobs
      .filter(
        (j) =>
          j.sourceUrl &&
          (j.rawDescription || "").length < 400 &&
          j.analysis?.finalVerdict !== "SKIP" &&
          (j.platform === "linkedin" || j.platform === "kariyer")
      )
      .slice(0, 20);
    const queue = [...needsDetail];
    const deadline = Date.now() + 18000;
    const worker = async () => {
      while (queue.length && Date.now() < deadline) {
        const j = queue.shift();
        if (!j || !j.sourceUrl) continue;
        const text = await fetchJobDescription(j.sourceUrl, 4000);
        if (text.length > 200) {
          j.rawDescription = text;
          j.analysis = runHeuristicAnalysis(j, profile);
          j.status = j.analysis.finalVerdict === "APPLY" ? "to_apply" : "new";
        }
      }
    };
    await Promise.allSettled(Array.from({ length: 5 }, worker));

    // Sort with APPLY first, then CONSIDER, then SKIP (including country-locked ones) at the very bottom.
    // Within the same verdict, push jobs ineligible from Turkey (canApplyFromTurkey === false) after others.
    const verdictPriority: Record<string, number> = { APPLY: 1, CONSIDER: 2, SKIP: 3 };
    fetchedJobs.sort((a, b) => {
      const vA = a.analysis?.finalVerdict ? verdictPriority[a.analysis.finalVerdict] || 99 : 99;
      const vB = b.analysis?.finalVerdict ? verdictPriority[b.analysis.finalVerdict] || 99 : 99;
      if (vA !== vB) return vA - vB;

      const trA = a.analysis?.eligibility.canApplyFromTurkey === false ? 2 : 1;
      const trB = b.analysis?.eligibility.canApplyFromTurkey === false ? 2 : 1;
      return trA - trB;
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
