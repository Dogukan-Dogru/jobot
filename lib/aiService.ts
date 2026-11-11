import { AppSettings, ApplicationPackage, JobAnalysis, JobPosting, MasterProfile } from "@/types";
import { buildSearchPlan, homeCountryOf, isValidTargetRole as planAccepts } from "@/lib/searchPlan";
import { SKILL_DICTIONARY } from "@/lib/cvParser";
import { countryMatchesTargets, detectCountry } from "@/lib/geo";

// The master prompt matching the ChatGPT specifications
export function buildAnalysisSystemPrompt(profile: MasterProfile): string {
  return `You are JoBot, an elite career intelligence analyst for candidate: ${profile.name}.
Target Title: ${profile.targetTitle} (${profile.yearsOfExperience}+ years of experience${profile.skills && profile.skills.length ? "; key skills: " + profile.skills.slice(0, 12).join(", ") : ""}).
Current Location: ${profile.currentLocation}.
Target Roles:
- Primary: ${profile.targetRoles.primary.join(", ")}
- Secondary: ${profile.targetRoles.secondary.join(", ")}
- Hybrid: ${profile.targetRoles.hybrid.join(", ")}
Visa sponsorship needed for overseas roles: ${profile.needsVisaSponsorship ? "yes" : "not specified"}.

TARGET GEOGRAPHY & ELIGIBILITY RULES:
- The candidate lives in ${profile.currentLocation}.
- The candidate seeks international roles (US, UK, Europe, Global Remote) and local ${profile.currentLocation} roles.
- NEVER assume "Remote" means worldwide remote.
- STRICT VISA RULE: For any overseas/international role (outside ${profile.currentLocation}), if the job does NOT explicitly offer Visa Sponsorship or Relocation, and is NOT confirmed 100% Worldwide Remote (work from anywhere via EOR/contractor), you MUST set canApplyFromTurkey: false, visaSponsorship: "not_offered", and finalVerdict: "SKIP". Do NOT classify overseas jobs without visa sponsorship as "CONSIDER"!
- If "Remote within EU / US / UK only" or "Remote from: USA/UK" or "Must have local work permit / No visa sponsorship", flag it immediately as NOT eligible from Turkey (canApplyFromTurkey: false, finalVerdict: "SKIP").
- CRITICAL: If an overseas job requires candidates to reside in the US (e.g. "Remote from: USA", "US Only", "Must reside in the US", "located in San Francisco/New York") and does NOT offer visa sponsorship or relocation, set canApplyFromTurkey: false and finalVerdict: "SKIP", regardless of skill match.
- STRICT HYBRID / ON-SITE RULE: For any overseas/international role (outside ${profile.currentLocation}), if the job is HYBRID or ON-SITE (e.g. requires office attendance, has '(hybrid)', '[hybrid]', 'hybrid', 'hibrit', 'on-site', 'in-office') and does NOT explicitly provide Visa Sponsorship AND Relocation, it CANNOT be worked from ${profile.currentLocation}. You MUST set canApplyFromTurkey: false, remoteFromTurkey: false, visaSponsorship: "not_offered", and finalVerdict: "SKIP". Foreign hybrid jobs CANNOT be worked remotely from ${profile.currentLocation} via EOR!
- If the job is located in ${profile.currentLocation}, visa is not required (canApplyFromTurkey: true).
- If ${profile.currentLocation} is eligible (e.g. 100% Worldwide remote without country lock, EOR/Deel, or Visa Sponsorship / Relocation offered), mark eligible (canApplyFromTurkey: true).
- If canApplyFromTurkey is false, finalVerdict MUST ALWAYS be "SKIP".
- IMPORTANT RULE ON ROLES: Do NOT evaluate the candidate only through a Product Management title lens. Identify the candidate's transferable skills from the profile below for both Product and Project Management style roles where relevant.
- NEVER fabricate experience. If a requirement is missing, label it as a GAP.

Output strictly valid JSON matching this schema:
{
  "roleType": "PRODUCT" | "PROJECT" | "HYBRID" | "OTHER",
  "eligibility": {
    "canApplyFromTurkey": boolean | "unclear",
    "remoteFromTurkey": boolean | "unclear",
    "relocationOffered": boolean | "unclear",
    "visaSponsorship": "offered" | "not_offered" | "unclear",
    "summary": "Brief summary of eligibility"
  },
  "strongMatches": ["Match 1", "Match 2", ...],
  "transferableExperience": ["Transferable 1", ...],
  "gaps": ["Gap 1", ...],
  "productFit": ["Fit point 1", ...],
  "projectFit": ["Fit point 1", ...],
  "experienceToEmphasize": ["Point 1", ...],
  "redFlags": ["Flag 1", ...],
  "interviewRisks": [
    {
      "requirement": "Requirement text",
      "candidateExperience": "What candidate actually did",
      "gap": "Specific gap",
      "honestStrategy": "How to address honestly"
    }
  ],
  "finalVerdict": "APPLY" | "CONSIDER" | "SKIP",
  "oneSentenceReason": "One crisp sentence explaining why to APPLY, CONSIDER or SKIP."
}`;
}

export function buildApplicationPackagePrompt(job: JobPosting, profile: MasterProfile): string {
  return `You are JoBot application package generator.
Candidate: ${profile.name} (${profile.targetTitle})
Job: ${job.title} at ${job.company}
Job Description:
${job.rawDescription}

Candidate Profile & Experience:
${profile.rawMarkdown}

Generate a complete application package with:
1. Tailored CV Summary (2-3 sentences emphasizing relevant keywords without fabricating anything).
2. Tailored Bullet Points separated into 'Product Manager' and 'Project Manager' flavors for the same experience.
3. Professional Cover Letter in English.
4. Professional Cover Letter in Turkish.
5. Recruiter Outreach Message for LinkedIn (strictly UNDER 300 characters, warm and punchy).
6. 2 Common Screening Questions answered honestly based on candidate background.

Output strictly valid JSON matching this schema:
{
  "tailoredCvSummary": "string",
  "tailoredBulletPoints": [
    {
      "roleFlavor": "Product Manager",
      "bullets": ["bullet 1", "bullet 2", "bullet 3"]
    },
    {
      "roleFlavor": "Project Manager",
      "bullets": ["bullet 1", "bullet 2"]
    }
  ],
  "coverLetterEn": "string",
  "coverLetterTr": "string",
  "recruiterMessage": "string (under 300 chars)",
  "screeningAnswers": [
    { "question": "string", "answer": "string" },
    { "question": "string", "answer": "string" }
  ]
}`;
}

// Parse & normalize raw geo/location strings into structured location & country
export function parseGeoLocation(rawGeo: string | undefined | null): {
  location: string;
  country: string;
} {
  const geo = (rawGeo || "").trim();
  if (!geo) {
    return { location: "Worldwide Remote", country: "Worldwide Remote" };
  }

  const lower = geo.toLowerCase();

  // Turkey
  if (
    lower.includes("turkey") ||
    lower.includes("türkiye") ||
    lower.includes("istanbul") ||
    lower.includes("ankara") ||
    lower.includes("izmir")
  ) {
    return {
      location: geo || "Türkiye",
      country: "Türkiye"
    };
  }

  // USA / United States
  const isUsMatch = 
    lower === "usa" ||
    lower === "us" ||
    lower === "united states" ||
    lower === "usa only" ||
    lower === "us only" ||
    lower.includes("united states") ||
    lower.endsWith(", us") ||
    lower.endsWith(", usa") ||
    lower.endsWith(", ca") ||
    lower.endsWith(", tx") ||
    lower.endsWith(", ny") ||
    lower.endsWith(", wa") ||
    lower.endsWith(", fl") ||
    lower.endsWith(", ma") ||
    lower.endsWith(", il") ||
    lower.endsWith(", co") ||
    /\b(usa|u\.s\.a\.|u\.s\.)\b/i.test(geo) ||
    (/\bus\b/i.test(geo) && !lower.includes("cyprus") && !lower.includes("belarus") && !lower.includes("russia") && !lower.includes("austria"));

  if (isUsMatch) {
    const locDisplay = lower.includes("only") || lower.includes("remote") 
      ? geo 
      : `${geo} (Remote - US Only)`;
    return {
      location: locDisplay,
      country: "United States"
    };
  }

  // UK / United Kingdom
  const isUkMatch =
    lower === "uk" ||
    lower === "united kingdom" ||
    lower === "uk only" ||
    lower.includes("united kingdom") ||
    lower.includes("london") ||
    lower.includes("england") ||
    /\buk\b/i.test(geo);

  if (isUkMatch) {
    const locDisplay = lower.includes("only") || lower.includes("remote") 
      ? geo 
      : `${geo} (Remote - UK Only)`;
    return {
      location: locDisplay,
      country: "United Kingdom"
    };
  }

  // Canada
  if (lower.includes("canada") || lower === "ca" || lower === "canada only") {
    return {
      location: lower.includes("only") || lower.includes("remote") ? geo : `${geo} (Remote - Canada Only)`,
      country: "Canada"
    };
  }

  // Specific European countries
  const euCountries = [
    "germany", "deutschland", "berlin", "munich",
    "spain", "españa", "madrid", "barcelona",
    "france", "paris",
    "netherlands", "amsterdam",
    "ireland", "dublin",
    "poland", "warsaw",
    "italy", "rome", "milan",
    "switzerland", "zurich",
    "sweden", "stockholm",
    "portugal", "lisbon"
  ];

  for (const c of euCountries) {
    if (lower.includes(c)) {
      const countryName = c.charAt(0).toUpperCase() + c.slice(1);
      return {
        location: lower.includes("remote") ? geo : `${geo} (Remote - ${countryName} Only)`,
        country: countryName
      };
    }
  }

  // Europe / EU / EMEA
  if (
    lower.includes("europe") ||
    lower.includes("emea") ||
    lower === "eu" ||
    lower.includes("european union")
  ) {
    return {
      location: lower.includes("remote") ? geo : `${geo} (Europe Remote)`,
      country: "Europe"
    };
  }

  // Latin America / APAC
  if (lower.includes("latin america") || lower.includes("latam")) {
    return { location: `${geo} (LATAM Remote)`, country: "Latin America" };
  }
  if (lower.includes("apac") || lower.includes("asia")) {
    return { location: `${geo} (APAC Remote)`, country: "APAC" };
  }

  // Australia / Oceania
  const isAusMatch =
    lower.includes("australia") ||
    lower.includes("sydney") ||
    lower.includes("melbourne") ||
    lower.includes("brisbane") ||
    lower.includes("perth") ||
    lower.includes("adelaide") ||
    lower.includes("canberra") ||
    /\b(aus|nsw|vic|qld|wa)\b/i.test(geo);

  if (isAusMatch) {
    const locDisplay = lower.includes("only") || lower.includes("remote") 
      ? geo 
      : `${geo} (Australia)`;
    return {
      location: locDisplay,
      country: "Australia"
    };
  }

  if (lower.includes("new zealand") || lower.includes("auckland") || lower.includes("wellington") || /\bnz\b/i.test(geo)) {
    return {
      location: lower.includes("only") || lower.includes("remote") ? geo : `${geo} (New Zealand)`,
      country: "New Zealand"
    };
  }

  // Asia / Middle East
  if (lower.includes("singapore")) return { location: geo, country: "Singapore" };
  if (lower.includes("japan") || lower.includes("tokyo")) return { location: geo, country: "Japan" };
  if (lower.includes("india") || lower.includes("bengaluru") || lower.includes("bangalore")) return { location: geo, country: "India" };
  if (lower.includes("dubai") || lower.includes("united arab emirates") || lower.includes("uae")) return { location: geo, country: "United Arab Emirates" };

  // Worldwide / Anywhere / Global
  const isWorldwideTerm =
    lower.includes("worldwide") ||
    lower.includes("anywhere") ||
    lower.includes("global") ||
    lower === "all" ||
    lower.includes("all locations") ||
    lower.includes("all regions");

  if (isWorldwideTerm) {
    if (lower.includes("hybrid") || lower.includes("hibrit")) {
      return {
        location: geo || "Worldwide (Hybrid)",
        country: "International"
      };
    }
    return {
      location: "Worldwide Remote",
      country: "Worldwide Remote"
    };
  }

  return {
    location: geo,
    country: geo
  };
}

// Helper to reliably detect work model from title, location, or job description
export function detectWorkModel(
  title: string = "",
  location: string = "",
  description: string = ""
): "remote" | "hybrid" | "onsite" {
  const combined = `${title} ${location} ${description}`.toLowerCase();

  // Explicit hybrid indicators (parentheses, brackets, or keywords)
  if (
    combined.includes("(hybrid)") ||
    combined.includes("[hybrid]") ||
    combined.includes("(hibrit)") ||
    combined.includes("[hibrit]") ||
    /\b(hybrid|hibrit)\b/i.test(title) ||
    /\b(hybrid|hibrit)\b/i.test(location) ||
    /\b(days? (?:in|a|per) (?:the )?office|office-based|in-office|office attendance)\b/i.test(combined) ||
    /\bhybrid and flexible\b/i.test(combined) ||
    /\bhybrid working\b/i.test(combined)
  ) {
    return "hybrid";
  }

  // Explicit onsite indicators
  if (
    combined.includes("(onsite)") ||
    combined.includes("[onsite]") ||
    combined.includes("(on-site)") ||
    combined.includes("[on-site]") ||
    /\b(onsite|on-site)\b/i.test(title) ||
    /\b(onsite|on-site)\b/i.test(location) ||
    /\b(onsite|on-site)\b/i.test(combined)
  ) {
    return "onsite";
  }

  // Explicit remote indicators
  if (
    combined.includes("(remote)") ||
    combined.includes("[remote]") ||
    combined.includes("(uzaktan)") ||
    combined.includes("[uzaktan]") ||
    /\bremote\b/i.test(title) ||
    /\bremote\b/i.test(location) ||
    combined.includes("remote") ||
    combined.includes("uzaktan") ||
    combined.includes("work from anywhere") ||
    combined.includes("telework")
  ) {
    return "remote";
  }

  return "hybrid";
}

// Built-in intelligent heuristic engine (Runs 100% offline / without API key)
export function runHeuristicAnalysis(job: JobPosting, profile: MasterProfile): JobAnalysis {
  // Normalize geo to avoid default fallbacks overriding real locations
  const homeRaw = homeCountryOf(profile);
  const home = homeRaw || "ikamet ettiğiniz ülke";
  const homeLc = homeRaw.toLowerCase();
  const homeIsTR = /^(türkiye|turkey|turkiye)$/i.test(homeRaw.trim());
  const homeCanonLc = homeRaw ? parseGeoLocation(homeRaw).country.toLowerCase() : "";
  const mentionsHome = (t: string) => (homeIsTR ? /turkey|türkiye/.test(t) : Boolean(homeLc) && t.includes(homeLc));
  const plan = buildSearchPlan(profile);
  const normalizedGeo = parseGeoLocation(job.location || job.country);
  const effectiveCountry = (job.country && job.country !== "Worldwide Remote") ? job.country : normalizedGeo.country;
  const effectiveLocation = job.location || normalizedGeo.location;

  const text = (job.title + " " + job.company + " " + effectiveLocation + " " + effectiveCountry + " " + job.rawDescription).toLowerCase();
  const locLower = (effectiveLocation + " " + effectiveCountry).toLowerCase();
  
  // 1. Role classification
  let roleType: JobAnalysis["roleType"] = "PRODUCT";
  const isProject = 
    text.includes("technical project manager") || 
    text.includes("project manager") || 
    text.includes("delivery manager") || 
    text.includes("proje yöneticisi") || 
    text.includes("proje müdürü") ||
    text.includes("proje lideri") ||
    text.includes("it project manager") ||
    text.includes("agile project manager") ||
    text.includes("program manager") ||
    text.includes("scrum master") ||
    text.includes("tpm");

  const isProduct = 
    text.includes("product manager") || 
    text.includes("product owner") || 
    text.includes("ürün yöneticisi") || 
    text.includes("ürün müdürü") ||
    text.includes("apm");

  if (isProject && isProduct) {
    roleType = "HYBRID";
  } else if (isProject) {
    roleType = "PROJECT";
  } else if (isProduct) {
    roleType = "PRODUCT";
  } else {
    roleType = "OTHER";
  }

  // 2. Eligibility checks
  const hasNoSponsorship = 
    text.includes("no visa sponsorship") || 
    text.includes("without sponsorship") ||
    text.includes("cannot provide sponsorship") ||
    text.includes("will not sponsor") ||
    text.includes("not sponsoring") ||
    text.includes("must have the right to work") || 
    text.includes("unrestricted right to work") ||
    text.includes("vize sponsoru sağlanmamaktadır") ||
    text.includes("us citizenship required") ||
    text.includes("authorised to work in") ||
    text.includes("authorized to work in the united states") ||
    text.includes("authorized to work in the us") ||
    text.includes("legally authorized to work");

  const hasSponsorship = 
    (text.includes("visa sponsorship") && !hasNoSponsorship) || 
    text.includes("sponsorship available") || 
    text.includes("relocation package") || 
    text.includes("relocation assistance") ||
    text.includes("relocation support");

  const targetCountriesLc = (profile.targetCountries || []).map((c) => c.toLowerCase());
  // Çalışma izni için vize gerekmiyorsa (profilde açıkça işaretlenmişse) hedef ülkelerdeki ilanlar da yerel sayılır
  const visaFreeTarget =
    profile.needsVisaSponsorship === false &&
    targetCountriesLc.some((c) => c && (effectiveCountry.toLowerCase() === c || locLower.includes(c)));
  const isHomeJob =
    visaFreeTarget ||
    (homeIsTR
      ? effectiveCountry.toLowerCase() === "türkiye" ||
        locLower.includes("turkey") ||
        locLower.includes("türkiye") ||
        locLower.includes("istanbul") ||
        locLower.includes("ankara") ||
        locLower.includes("izmir") ||
        text.includes("türkiye") ||
        text.includes("turkey")
      : Boolean(homeLc) && (effectiveCountry.toLowerCase() === homeCanonLc || effectiveCountry.toLowerCase() === homeLc || locLower.includes(homeLc)));

  // Country lock indicators
  const isUsOnly = 
    effectiveCountry === "United States" ||
    locLower.includes("us only") ||
    locLower.includes("usa only") ||
    locLower.includes("remote - us") ||
    locLower.includes("remote (us") ||
    text.includes("remote from: usa") ||
    text.includes("remote from: us") ||
    text.includes("remote from usa") ||
    text.includes("remote within us") ||
    text.includes("remote within the us") ||
    text.includes("remote in the us") ||
    text.includes("us remote") ||
    text.includes("united states remote") ||
    text.includes("must be based in the us") ||
    text.includes("must be based in the united states") ||
    text.includes("must reside in the us") ||
    text.includes("must reside in the united states") ||
    text.includes("only open to candidates in the us") ||
    text.includes("only open to candidates in the united states") ||
    text.includes("reside in the united states") ||
    text.includes("located in san francisco") ||
    text.includes("located in new york") ||
    text.includes("authorized to work in the united states without sponsorship") ||
    text.includes("authorized to work in the us without sponsorship");

  const isUkOnly =
    effectiveCountry === "United Kingdom" ||
    locLower.includes("uk only") ||
    locLower.includes("remote - uk") ||
    text.includes("remote from: uk") ||
    text.includes("remote within the uk") ||
    text.includes("must be based in the uk") ||
    text.includes("must reside in the uk");

  const isCanadaOnly =
    effectiveCountry === "Canada" ||
    locLower.includes("canada only") ||
    text.includes("must be based in canada") ||
    text.includes("remote within canada");

  const isGermanyOnly =
    effectiveCountry === "Germany" ||
    locLower.includes("germany") ||
    locLower.includes("deutschland") ||
    text.includes("remote from: germany") ||
    text.includes("remote within germany") ||
    text.includes("must be based in germany") ||
    text.includes("must reside in germany") ||
    text.includes("based in germany");

  const isSpecificForeignCountry = 
    !isHomeJob && 
    effectiveCountry !== "Worldwide Remote" && 
    effectiveCountry !== "Global Remote" && 
    effectiveCountry !== "Remote" && 
    effectiveCountry !== "Europe";

  const isLocationMarkedOnly = 
    locLower.includes("only") || 
    locLower.includes("remote - ");

  const isRestrictedRemote = 
    isUsOnly ||
    isUkOnly ||
    isCanadaOnly ||
    isGermanyOnly ||
    isSpecificForeignCountry ||
    isLocationMarkedOnly ||
    text.includes("remote within us") || 
    text.includes("us only") || 
    text.includes("uk only") || 
    text.includes("remote within uk") || 
    text.includes("remote within germany") ||
    text.includes("remote within eu only") ||
    text.includes("eu only");

  // Detect country-locked remote (e.g. "must be based in Spain", "Remote from: USA")
  const countryLockPatterns = [
    /remote from:?\s*(?:usa|us|united states|uk|canada|spain|germany|france|australia|italy|netherlands)/i,
    /must be based in (?:the )?([a-z\s]+)/i,
    /should already be based in (?:the )?([a-z\s]+)/i,
    /must reside in (?:the )?([a-z\s]+)/i,
    /must be located in (?:the )?([a-z\s]+)/i,
    /remote within (?:the )?([a-z\s]+)/i,
    /remote in (?:the )?([a-z\s]+) only/i,
    /hiring specifically for this market/i,
    /candidates must be based in/i,
    /applicants should already be based in/i,
    /only open to candidates (?:based|residing|located) in/i,
    /residents? of (?:the )?([a-z\s]+) only/i,
    /based in spain/i,
    /based in the uk/i,
    /based in the us/i,
    /based in the united states/i,
    /based in germany/i,
    /based in france/i
  ];

  let isCountryLocked = false;
  let lockedReason = "";

  if (!isHomeJob && !hasSponsorship) {
    if (isUsOnly) {
      isCountryLocked = true;
      lockedReason = "Yalnızca ABD (USA) sınırları içinden uzaktan çalışma kabul ediliyor (Remote from: USA / US Only)";
    } else if (isUkOnly) {
      isCountryLocked = true;
      lockedReason = "Yalnızca Birleşik Krallık (UK) sınırları içinden uzaktan çalışma kabul ediliyor (UK Only)";
    } else if (isCanadaOnly) {
      isCountryLocked = true;
      lockedReason = "Yalnızca Kanada (Canada) sınırları içinden uzaktan çalışma kabul ediliyor (Canada Only)";
    } else if (isGermanyOnly || isSpecificForeignCountry || isLocationMarkedOnly) {
      isCountryLocked = true;
      lockedReason = `Yalnızca ${effectiveCountry} sınırları içinden uzaktan çalışma kabul ediliyor (${effectiveLocation})`;
    } else {
      for (const pat of countryLockPatterns) {
        const match = text.match(pat);
        if (match) {
          const matchedText = match[0].toLowerCase();
          if (!mentionsHome(matchedText)) {
            isCountryLocked = true;
            lockedReason = match[0];
            break;
          }
        }
      }
    }
  }

  // Check if job is hybrid or on-site
  const isHybridOrOnsite = 
    job.workModel === "hybrid" || 
    job.workModel === "onsite" ||
    text.includes("(hybrid)") ||
    text.includes("[hybrid]") ||
    text.includes("(hibrit)") ||
    text.includes("[hibrit]") ||
    /\b(hybrid|hibrit|onsite|on-site)\b/i.test(job.title) ||
    /\b(hybrid|hibrit|onsite|on-site)\b/i.test(job.location) ||
    /\b(days? (?:in|a|per) (?:the )?office|office-based|in-office|office attendance)\b/i.test(text);

  // Worldwide Remote check: ONLY valid if not locked to a specific country AND not hybrid/onsite
  const hasWorldwideInGeo = 
    !isCountryLocked &&
    !isHybridOrOnsite &&
    (effectiveCountry.toLowerCase() === "worldwide remote" ||
    locLower === "worldwide remote" ||
    locLower === "global remote");

  const hasWorldwideInText =
    !isCountryLocked &&
    !isSpecificForeignCountry &&
    !isHybridOrOnsite &&
    (
      text.includes("work from anywhere") ||
      text.includes("remote worldwide") ||
      text.includes("remote - worldwide") ||
      text.includes("worldwide remote") ||
      text.includes("anywhere in the world") ||
      /\bdeel\b/i.test(text) ||
      /\b(eor|employer of record)\b/i.test(text)
    );

  const isWorldwideRemote = !isCountryLocked && !isHybridOrOnsite && (hasWorldwideInGeo || hasWorldwideInText);

  let canApplyFromTurkey: boolean | "unclear" = "unclear";
  let remoteFromTurkey: boolean | "unclear" = "unclear";
  let relocationOffered: boolean | "unclear" = false;
  let visaSponsorship: JobAnalysis["eligibility"]["visaSponsorship"] = "unclear";
  let eligibilitySummary = "";

  if (isHomeJob) {
    canApplyFromTurkey = true;
    remoteFromTurkey = job.workModel === "remote" ? true : "unclear";
    visaSponsorship = "unclear";
    eligibilitySummary = `Pozisyon ${home} merkezli olduğundan yasal veya lokasyon engeli bulunmuyor.`;
  } else if (isHybridOrOnsite) {
    // Foreign hybrid or on-site role: strictly requires physical office attendance abroad!
    if (hasSponsorship) {
      canApplyFromTurkey = true;
      remoteFromTurkey = false; // Cannot be remote from Turkey because of regular office attendance abroad
      relocationOffered = true;
      visaSponsorship = "offered";
      eligibilitySummary = `İlan yurtdışında ${job.workModel === "onsite" ? "ofiste" : "hibrit"} çalışma modeli gerektirmektedir. Vize sponsorluğu ve relokasyon desteği belirtildiğinden taşınarak çalışma amacıyla ${home} konumundan başvuruya uygundur.`;
    } else {
      canApplyFromTurkey = false;
      remoteFromTurkey = false;
      visaSponsorship = "not_offered";
      eligibilitySummary = `İlan ${job.workModel === "onsite" ? "ofiste (on-site)" : "hibrit (ofis + ev)"} çalışma modeli gerektirmekte ve yurtdışındaki ofise fiziksel katılım beklemektedir. Vize sponsorluğu veya relokasyon desteği bulunmadığından ${home} konumunda ikamet eden adaylar için uygun değildir.`;
    }
  } else if (isCountryLocked) {
    canApplyFromTurkey = false;
    remoteFromTurkey = false;
    visaSponsorship = "not_offered";
    eligibilitySummary = `İlan uzaktan çalışma (remote) görünse de adayın ilgili ülkede yerel ikamet etmesini şart koşuyor (${lockedReason}). Vize veya relokasyon desteği bulunmadığından ${home} konumunda ikamet eden adaylar için uygun değildir.`;
  } else if (hasNoSponsorship && (isRestrictedRemote || job.workModel === "onsite" || job.workModel === "hybrid")) {
    canApplyFromTurkey = false;
    remoteFromTurkey = false;
    visaSponsorship = "not_offered";
    eligibilitySummary = "İlan açıkça vize sponsorluğu vermeyeceğini ve yerel çalışma hakkı gerektiğini belirtiyor.";
  } else if (hasSponsorship) {
    canApplyFromTurkey = true;
    relocationOffered = true;
    visaSponsorship = "offered";
    remoteFromTurkey = isWorldwideRemote ? true : "unclear";
    eligibilitySummary = `Vize sponsorluğu veya relokasyon desteği belirtilmiş; ${home} konumundan başvuruya uygun.`;
  } else if (isWorldwideRemote) {
    canApplyFromTurkey = true;
    remoteFromTurkey = true;
    visaSponsorship = "unclear";
    eligibilitySummary = `Global / Worldwide remote ve EOR desteği mevcut; ${home} konumundan çalışılabilir.`;
  } else {
    // Overseas job without confirmed worldwide remote and without sponsorship
    canApplyFromTurkey = false;
    remoteFromTurkey = false;
    visaSponsorship = "not_offered";
    eligibilitySummary = `İlan yurtdışı merkezli olup ${home} konumundan başvuru için vize sponsorluğu veya relokasyon desteği belirtilmemiştir. Vize sponsoru bulunmadığından ${home} konumundan başvuruya uygun değildir.`;
  }

  // 3. Profil ile ilan eşleşmesi (tamamen profildeki verilerden; sabit alan/sektör varsayımı yok)
  const strongMatches: string[] = [];
  const transferableExperience: string[] = [];
  const gaps: string[] = [];
  const redFlags: string[] = [];

  const escapeRe = (x: string) => x.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const hasTerm = (haystack: string, term: string) =>
    new RegExp(`(^|[^\\p{L}0-9])${escapeRe(term.toLowerCase())}([^\\p{L}0-9]|$)`, "iu").test(haystack);

  // Başlık, hedef rollerinizden biriyle uyumlu mu?
  const titleFits = planAccepts(job.title, plan);
  if (titleFits) strongMatches.push(`Pozisyon başlığı hedef rollerinizle uyumlu: ${job.title}`);

  // İlanda geçen ve profilinizde bulunan beceriler
  const profileSkills = Array.from(
    new Set([...(profile.skills || []), ...profile.coreExperience.flatMap((e) => [...e.tools, ...e.technologies, ...e.fintechDomains])].filter(Boolean))
  );
  const matchedSkills = profileSkills.filter((sk) => hasTerm(text, sk)).slice(0, 6);
  for (const sk of matchedSkills) strongMatches.push(`${sk} deneyimi (ilanda geçiyor)`);

  // İlanda geçen ama profilinizde bulunmayan bilinen beceri/araçlar (eksik gereksinimler)
  const profileSkillsLc = profileSkills.map((x) => x.toLowerCase());
  const descLc = (job.rawDescription || "").toLowerCase();
  const missingSkills = SKILL_DICTIONARY.filter(
    (sk) =>
      hasTerm(descLc, sk) &&
      !profileSkillsLc.some((ps) => ps === sk.toLowerCase() || ps.includes(sk.toLowerCase()) || sk.toLowerCase().includes(ps))
  ).slice(0, 6);
  for (const sk of missingSkills) gaps.push(`${sk}: ilanda geçiyor, profilinizde belirtilmemiş`);

  // Aktarılabilir deneyim: ilan metniyle en çok örtüşen profil maddeleri
  const jobWordSet = new Set(text.split(/[^a-zçğıöşü0-9+#.]+/i).filter((w) => w.length > 3));
  const rankedHighlights = profile.coreExperience
    .flatMap((e) => e.highlights.map((h) => ({ h, company: e.company })))
    .map((x) => ({ ...x, score: x.h.toLowerCase().split(/[^a-zçğıöşü0-9+#.]+/i).filter((w) => jobWordSet.has(w)).length }))
    .filter((x) => x.score >= 2)
    .sort((x, y) => y.score - x.score);
  for (const x of rankedHighlights.slice(0, 3)) transferableExperience.push(x.h);

  // Red flags
  if (!isHomeJob && isHybridOrOnsite && !hasSponsorship) {
    redFlags.push(`Yurtdışı ofiste ${job.workModel === "onsite" ? "fiziki/ofis" : "hibrit"} katılım şartı (Vize/relokasyon desteği yok)`);
  }
  if (isCountryLocked) {
    redFlags.push(`Ülke kısıtlamalı remote: Yalnızca ilgili ülkede yerel ikamet edenler kabul ediliyor (${lockedReason})`);
  }
  if (!isHomeJob && !isWorldwideRemote && !hasSponsorship && !redFlags.some(r => r.includes("Vize sponsorluğu"))) {
    redFlags.push("Vize sponsorluğu sunulmuyor veya belirtilmemiş (Yurtdışı pozisyon)");
  }
  if (hasNoSponsorship && !isHomeJob && !redFlags.some(r => r.includes("Vize sponsorluğu"))) {
    redFlags.push("Vize sponsorluğu sunulmuyor (No sponsorship)");
  }
  if (isRestrictedRemote && !isCountryLocked) {
    redFlags.push("Remote çalışma belirli bir ülke/bölge (EU/US/UK) ile sınırlandırılmış");
  }
  if (profile.yearsOfExperience < 7 && (text.includes("7+ years") || text.includes("8+ years") || text.includes("10+ years") || text.includes("director"))) {
    redFlags.push("Yüksek kıdem seviyesi gereksinimi (7+ yıl)");
    gaps.push(`Beklenen kıdem yılı (Aday ${profile.yearsOfExperience}+ yıl)`);
  }

  // Final Verdict determination
  let finalVerdict: JobAnalysis["finalVerdict"] = "CONSIDER";
  let oneSentenceReason = "";

  if (canApplyFromTurkey === false) {
    finalVerdict = "SKIP";
    oneSentenceReason = eligibilitySummary || `Lokasyon ve yasal kısıtlar nedeniyle ${home} konumundan başvuruya uygun değildir.`;
  } else if (isCountryLocked) {
    finalVerdict = "SKIP";
    oneSentenceReason = `İlan uzaktan çalışma (remote) görünse de yalnızca ilgili ülkede yerel ikamet edenleri kabul ediyor (${lockedReason}); ${home} konumundan başvuruya kapalıdır.`;
  } else if (!isHomeJob && !isWorldwideRemote && !hasSponsorship) {
    finalVerdict = "SKIP";
    oneSentenceReason = `Yurtdışı pozisyon için vize sponsorluğu veya relokasyon desteği belirtilmemiştir; ${home} konumundan çalışma izni/vize olmadan başvuru yapılamaz.`;
  } else if (hasNoSponsorship && !isHomeJob && !isWorldwideRemote) {
    finalVerdict = "SKIP";
    oneSentenceReason = "Teknik gereksinimler uygun olsa da vize sponsorluğu verilmiyor ve yerel çalışma izni zorunlu tutuluyor.";
  } else if (strongMatches.length >= 2 && canApplyFromTurkey === true) {
    finalVerdict = "APPLY";
    oneSentenceReason = `İlandaki temel gereksinimler (${strongMatches[0] || "hedef rol"}) profilinizle güçlü şekilde örtüşüyor.`;
  } else if (gaps.length > 4) {
    finalVerdict = "SKIP";
    oneSentenceReason = "Deneyim eksiklikleri veya lokasyon kısıtları nedeniyle başvuru öncelikli önerilmiyor.";
  } else {
    finalVerdict = "CONSIDER";
    oneSentenceReason = "Profil ile uyumlu noktalar bulunuyor ancak çalışma şartları veya detayların teyit edilmesi tavsiye edilir.";
  }

  // 4. Hedef ülke / bölge ve çalışma şekli tercihleri (profildeki konum tercihleri)
  const geoText = `${effectiveCountry} ${effectiveLocation}`;
  const jobCountry = detectCountry(geoText);
  const isWorldwideJob = !jobCountry && /worldwide|global remote|anywhere/i.test(geoText);
  const targetList = profile.targetCountries || [];
  const outOfTarget =
    !isHomeJob && !isWorldwideJob && Boolean(jobCountry) && targetList.length > 0 && !countryMatchesTargets(jobCountry as string, targetList);

  const explicitHybrid =
    /\b(hybrid|hibrit)\b/i.test(`${job.title} ${job.location}`) || /\b(days? (?:in|a|per) (?:the )?office|office attendance)\b/i.test(text);
  const explicitOnsite = /\bon-?site\b/i.test(`${job.title} ${job.location}`) || /\bon-?site\b/i.test(text);
  const workPref = profile.workPreference || "any";
  const prefMismatch = (workPref === "remote" && (explicitHybrid || explicitOnsite)) || (workPref === "hybrid" && explicitOnsite);

  if (outOfTarget) {
    redFlags.push(`İlan hedef ülke/bölgelerinizin dışında (${jobCountry})`);
    if (finalVerdict !== "SKIP") {
      finalVerdict = "SKIP";
      oneSentenceReason = `İlan ${jobCountry} merkezli; hedef ülke/bölgelerinizin (${targetList.join(", ")}) dışında kalıyor.`;
    }
  }
  if (prefMismatch) {
    const need = workPref === "remote" ? "yalnızca uzaktan" : "uzaktan veya hibrit";
    redFlags.push(`Çalışma şekli tercihinizle uyuşmuyor (siz ${need} çalışmak istiyorsunuz; ilan ${explicitOnsite ? "ofis" : "hibrit"} gerektiriyor)`);
    if (finalVerdict !== "SKIP") {
      finalVerdict = "SKIP";
      oneSentenceReason = `Çalışma şekli tercihinizle (${need}) uyuşmuyor: ilan ${explicitOnsite ? "ofiste çalışma" : "hibrit çalışma"} gerektiriyor.`;
    }
  }

  return {
    roleType,
    eligibility: {
      canApplyFromTurkey,
      remoteFromTurkey,
      relocationOffered,
      visaSponsorship,
      summary: eligibilitySummary
    },
    strongMatches: strongMatches.length ? strongMatches : ["İlan metninde profilinizle doğrudan örtüşen bir beceri/başlık bulunamadı"],
    transferableExperience: transferableExperience.length ? transferableExperience : ["Profilinizdeki deneyimlerle ilan metni arasında belirgin bir örtüşme tespit edilemedi"],
    gaps,
    productFit: roleType === "PRODUCT" || roleType === "HYBRID" ? ["Ürün odaklı bir rol; profilinizdeki ürün/iş gereksinimi deneyimleri değerlendirilmeli."] : [],
    projectFit: roleType === "PROJECT" || roleType === "HYBRID" ? ["Teslimat/koordinasyon odaklı bir rol; profilinizdeki proje ve paydaş yönetimi deneyimleri değerlendirilmeli."] : [],
    experienceToEmphasize: rankedHighlights.length
      ? rankedHighlights.slice(0, 3).map((x) => (x.company ? `${x.company}: ${x.h}` : x.h))
      : profile.coreExperience.slice(0, 2).map((e) => `${e.title}${e.company ? " — " + e.company : ""}`.trim()).filter(Boolean),
    redFlags,
    interviewRisks: missingSkills.slice(0, 3).map((sk) => ({
      requirement: `${sk} bilgisi/deneyimi`,
      candidateExperience: "Profilinizde bu beceri belirtilmemiş",
      gap: `İlan ${sk} gerektiriyor; profilinizde doğrudan karşılığı görünmüyor`,
      honestStrategy: `Doğrudan deneyiminiz yoksa bunu açıkça söyleyin; benzer bir araç/yaklaşımla elde ettiğiniz somut bir sonucu örnekleyip ${sk} için öğrenme planınızı belirtin.`
    })),
    finalVerdict,
    oneSentenceReason,
    analyzedAt: new Date().toISOString()
  };
}

// Built-in rule-based generator for Application Package (profil verisinden dinamik üretir)
export function runHeuristicGenerator(job: JobPosting, profile: MasterProfile): ApplicationPackage {
  const isPjM = job.analysis?.roleType === "PROJECT";
  const years = profile.yearsOfExperience > 0 ? `${profile.yearsOfExperience}+ yıl` : "";
  const yearsEn = profile.yearsOfExperience > 0 ? `${profile.yearsOfExperience}+ years` : "";
  const latest = profile.coreExperience[0];
  const company = latest?.company || "";
  const role = latest?.title || profile.targetTitle;

  // İlan metni ile profil becerileri arasındaki kesişim (uydurma yok: yalnızca profilde olan beceriler)
  const jobText = (job.title + " " + job.rawDescription).toLowerCase();
  const skills = profile.skills || [];
  const matched = skills.filter((s) => jobText.includes(s.toLowerCase())).slice(0, 6);
  const topSkills = (matched.length ? matched : skills.slice(0, 5)).join(", ");

  const allHighlights = profile.coreExperience.flatMap((e) => e.highlights).filter(Boolean);
  const jobWords = new Set(jobText.split(/[^a-zçğıöşü0-9+#.]+/i).filter((w) => w.length > 3));
  const scored = allHighlights
    .map((h) => ({ h, score: h.toLowerCase().split(/[^a-zçğıöşü0-9+#.]+/i).filter((w) => jobWords.has(w)).length }))
    .sort((x, y) => y.score - x.score)
    .map((x) => x.h);
  const bestBullets = scored.slice(0, 3);

  const summaryBase = profile.summary?.trim();
  const tailoredCvSummary = [
    `${profile.name}${years ? `, ${years} deneyime sahip` : ","} ${role}${company ? ` (${company})` : ""}.`,
    topSkills ? `${isPjM ? "Teslimat ve koordinasyon" : "Ürün ve iş"} odağında ${topSkills} alanlarında deneyimli.` : "",
    summaryBase ? summaryBase.slice(0, 240) : ""
  ].filter(Boolean).join(" ");

  const flavorBullets = (flavor: "Product Manager" | "Project Manager") => ({
    roleFlavor: flavor,
    bullets: bestBullets.length
      ? bestBullets
      : [`${job.company} için ${flavor === "Product Manager" ? "ürün" : "proje"} odaklı deneyiminizi profilinizden ekleyin.`]
  });

  const experienceLineEn = company
    ? `With ${yearsEn || "solid"} of experience, most recently as ${role} at ${company}, I have built a track record in ${topSkills || "delivering results across teams"}.`
    : `With ${yearsEn || "solid"} of professional experience as ${role}, I have built a track record in ${topSkills || "delivering results across teams"}.`;
  const experienceLineTr = company
    ? `${years ? years + "lık" : ""} deneyimimle, en son ${company} bünyesinde ${role} olarak ${topSkills || "ekipler arası teslimat"} alanlarında çalıştım.`
    : `${years ? years + "lık" : ""} deneyimimle ${role} olarak ${topSkills || "ekipler arası teslimat"} alanlarında çalıştım.`;
  const highlightEn = bestBullets[0] ? `

A relevant example from my background: ${bestBullets[0]}` : "";
  const highlightTr = bestBullets[0] ? `

Geçmişimden ilgili bir örnek: ${bestBullets[0]}` : "";

  return {
    tailoredCvSummary,
    tailoredBulletPoints: [
      flavorBullets("Product Manager"),
      flavorBullets("Project Manager")
    ],
    coverLetterEn: `Dear Hiring Team at ${job.company},

I am writing to express my interest in the ${job.title} opportunity. ${experienceLineEn}${highlightEn}

I would welcome the opportunity to discuss how my background can contribute to ${job.company}'s success.

Sincerely,
${profile.name}`,
    coverLetterTr: `Sayın ${job.company} İşe Alım Ekibi,

Bünyenizde açılan ${job.title} pozisyonuna başvurmak istiyorum. ${experienceLineTr}${highlightTr}

Deneyimimin ${job.company}'nin hedeflerine katkı sağlayacağına inanıyor, görüşme fırsatı için teşekkür ediyorum.

Saygılarımla,
${profile.name}`,
    recruiterMessage: `Hi! I saw the ${job.title} role at ${job.company}. ${yearsEn ? yearsEn + " in " : "Experienced in "}${topSkills || role} – I'd love to connect and share how my background fits.`.slice(0, 300),
    screeningAnswers: [
      {
        question: `Why do you want to join ${job.company}?`,
        answer: `${job.company}'s work aligns with my experience${topSkills ? " in " + topSkills : ""}. (Bu cevabı şirkete özel gerekçenizle kişiselleştirin.)`
      },
      {
        question: "Tell us about a challenging project you delivered.",
        answer: bestBullets[0] || "Profilinize bir deneyim başarısı ekleyerek bu cevabı oluşturabilirsiniz."
      }
    ],
    generatedAt: new Date().toISOString()
  };
}

// Live AI Engine caller with fallback
export async function analyzeJobWithAI(
  job: JobPosting, 
  profile: MasterProfile, 
  settings: AppSettings
): Promise<JobAnalysis> {
  // If demo mode or no key, return heuristic analysis immediately
  if (settings.aiProvider === "demo" || !settings.apiKey) {
    // Add artificial tiny delay for smooth realistic UX
    await new Promise(r => setTimeout(r, 600));
    return runHeuristicAnalysis(job, profile);
  }

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job, profile, settings })
    });

    if (!response.ok) {
      console.warn("AI API response not ok, falling back to heuristic engine.");
      return runHeuristicAnalysis(job, profile);
    }

    const data = await response.json();
    return data.analysis || runHeuristicAnalysis(job, profile);
  } catch (err) {
    console.error("AI call failed, using heuristic engine:", err);
    return runHeuristicAnalysis(job, profile);
  }
}

export async function generatePackageWithAI(
  job: JobPosting,
  profile: MasterProfile,
  settings: AppSettings
): Promise<ApplicationPackage> {
  if (settings.aiProvider === "demo" || !settings.apiKey) {
    await new Promise(r => setTimeout(r, 600));
    return runHeuristicGenerator(job, profile);
  }

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job, profile, settings })
    });

    if (!response.ok) {
      console.warn("AI generate API response not ok, using heuristic generator.");
      return runHeuristicGenerator(job, profile);
    }

    const data = await response.json();
    return data.package || runHeuristicGenerator(job, profile);
  } catch (err) {
    console.error("AI package generator failed, using heuristic generator:", err);
    return runHeuristicGenerator(job, profile);
  }
}
