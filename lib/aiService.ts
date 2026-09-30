import { AppSettings, ApplicationPackage, JobAnalysis, JobPosting, MasterProfile } from "@/types";

// The master prompt matching the ChatGPT specifications
export function buildAnalysisSystemPrompt(profile: MasterProfile): string {
  return `You are JoBot, an elite career intelligence analyst for candidate: ${profile.name}.
Target Title: ${profile.targetTitle} (4+ years in Fintech, SoftPOS, Payments, B2B dashboards, e-commerce).
Current Location: ${profile.currentLocation}.
Target Roles:
- Primary: ${profile.targetRoles.primary.join(", ")}
- Secondary: ${profile.targetRoles.secondary.join(", ")}
- Hybrid: ${profile.targetRoles.hybrid.join(", ")}

TARGET GEOGRAPHY & ELIGIBILITY RULES:
- The candidate lives in Türkiye.
- The candidate seeks international roles (US, UK, Europe, Global Remote) and local Türkiye roles.
- NEVER assume "Remote" means worldwide remote.
- STRICT VISA RULE: For any overseas/international role (outside Türkiye), if the job does NOT explicitly offer Visa Sponsorship or Relocation, and is NOT confirmed 100% Worldwide Remote (work from anywhere via EOR/contractor), you MUST set canApplyFromTurkey: false, visaSponsorship: "not_offered", and finalVerdict: "SKIP". Do NOT classify overseas jobs without visa sponsorship as "CONSIDER"!
- If "Remote within EU / US / UK only" or "Remote from: USA/UK" or "Must have local work permit / No visa sponsorship", flag it immediately as NOT eligible from Turkey (canApplyFromTurkey: false, finalVerdict: "SKIP").
- CRITICAL: If an overseas job requires candidates to reside in the US (e.g. "Remote from: USA", "US Only", "Must reside in the US", "located in San Francisco/New York") and does NOT offer visa sponsorship or relocation, set canApplyFromTurkey: false and finalVerdict: "SKIP", regardless of skill match.
- If the job is located in Türkiye, visa is not required (canApplyFromTurkey: true).
- If Türkiye is eligible (e.g. Worldwide remote, EOR/Deel, or Visa Sponsorship / Relocation offered), mark eligible (canApplyFromTurkey: true).
- If canApplyFromTurkey is false, finalVerdict MUST ALWAYS be "SKIP".
- IMPORTANT RULE ON ROLES: Do NOT evaluate the candidate only through a Product Management title lens. The candidate has performed substantial technical project management, delivery coordination, SDK release management, and EMVCo certification processes. Identify transferable project management skills for Project Manager roles.
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

  // Worldwide / Anywhere / Global
  if (
    lower.includes("worldwide") ||
    lower.includes("anywhere") ||
    lower.includes("global") ||
    lower.includes("all")
  ) {
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

// Built-in intelligent heuristic engine (Runs 100% offline / without API key)
export function runHeuristicAnalysis(job: JobPosting, profile: MasterProfile): JobAnalysis {
  // Normalize geo to avoid default fallbacks overriding real locations
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
  } else {
    roleType = "PRODUCT";
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

  const isTurkeyJob = 
    effectiveCountry.toLowerCase() === "türkiye" ||
    locLower.includes("turkey") ||
    locLower.includes("türkiye") || 
    locLower.includes("istanbul") || 
    locLower.includes("ankara") || 
    locLower.includes("izmir") ||
    text.includes("türkiye") || 
    text.includes("turkey");

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

  const isRestrictedRemote = 
    isUsOnly ||
    isUkOnly ||
    isCanadaOnly ||
    locLower.includes("only") ||
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

  if (!isTurkeyJob && !hasSponsorship) {
    if (isUsOnly) {
      isCountryLocked = true;
      lockedReason = "Yalnızca ABD (USA) sınırları içinden uzaktan çalışma kabul ediliyor (Remote from: USA / US Only)";
    } else if (isUkOnly) {
      isCountryLocked = true;
      lockedReason = "Yalnızca Birleşik Krallık (UK) sınırları içinden uzaktan çalışma kabul ediliyor (UK Only)";
    } else if (isCanadaOnly) {
      isCountryLocked = true;
      lockedReason = "Yalnızca Kanada (Canada) sınırları içinden uzaktan çalışma kabul ediliyor (Canada Only)";
    } else {
      for (const pat of countryLockPatterns) {
        const match = text.match(pat);
        if (match) {
          const matchedText = match[0].toLowerCase();
          if (!matchedText.includes("turkey") && !matchedText.includes("türkiye")) {
            isCountryLocked = true;
            lockedReason = match[0];
            break;
          }
        }
      }
    }
  }

  // Worldwide Remote check: ONLY valid if not locked to a specific country
  const hasWorldwideInGeo = 
    effectiveCountry.toLowerCase() === "worldwide remote" ||
    locLower.includes("worldwide") ||
    locLower.includes("global remote") ||
    locLower.includes("anywhere remote");

  const hasWorldwideInText =
    text.includes("work from anywhere") ||
    text.includes("remote worldwide") ||
    text.includes("remote - worldwide") ||
    text.includes("worldwide remote") ||
    text.includes("anywhere in the world") ||
    text.includes("hire globally") ||
    text.includes("hire anywhere") ||
    /\bdeel\b/i.test(text) ||
    /\b(eor|employer of record)\b/i.test(text);

  const isWorldwideRemote = !isCountryLocked && (hasWorldwideInGeo || hasWorldwideInText);

  let canApplyFromTurkey: boolean | "unclear" = "unclear";
  let remoteFromTurkey: boolean | "unclear" = "unclear";
  let relocationOffered: boolean | "unclear" = false;
  let visaSponsorship: JobAnalysis["eligibility"]["visaSponsorship"] = "unclear";
  let eligibilitySummary = "";

  if (isTurkeyJob) {
    canApplyFromTurkey = true;
    remoteFromTurkey = job.workModel === "remote" ? true : "unclear";
    visaSponsorship = "unclear";
    eligibilitySummary = "Pozisyon Türkiye merkezli olduğundan yasal veya lokasyon engeli bulunmuyor.";
  } else if (isCountryLocked) {
    canApplyFromTurkey = false;
    remoteFromTurkey = false;
    visaSponsorship = "not_offered";
    eligibilitySummary = `İlan uzaktan çalışma (remote) görünse de adayın ilgili ülkede yerel ikamet etmesini şart koşuyor (${lockedReason}). Vize veya relokasyon desteği bulunmadığından Türkiye'de ikamet eden adaylar için uygun değildir.`;
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
    eligibilitySummary = "Vize sponsorluğu veya relokasyon desteği belirtilmiş; Türkiye'den başvuruya uygun.";
  } else if (isWorldwideRemote) {
    canApplyFromTurkey = true;
    remoteFromTurkey = true;
    visaSponsorship = "unclear";
    eligibilitySummary = "Global / Worldwide remote ve EOR desteği mevcut; Türkiye'den çalışılabilir.";
  } else {
    // Overseas job without confirmed worldwide remote and without sponsorship
    canApplyFromTurkey = false;
    remoteFromTurkey = false;
    visaSponsorship = "not_offered";
    eligibilitySummary = "İlan yurtdışı merkezli olup Türkiye'den başvuru için vize sponsorluğu veya relokasyon desteği belirtilmemiştir. Vize sponsoru bulunmadığından Türkiye'den başvuruya uygun değildir.";
  }

  // 3. Domain matches
  const strongMatches: string[] = [];
  const transferableExperience: string[] = [];
  const gaps: string[] = [];
  const redFlags: string[] = [];

  if (text.includes("softpos") || text.includes("pos") || text.includes("payment") || text.includes("ödeme")) {
    strongMatches.push("SoftPOS ve Ödeme Sistemleri (Payment Gateways) uzmanlığı");
  }
  if (text.includes("sdk") || text.includes("mastercard") || text.includes("emvco") || text.includes("hce")) {
    strongMatches.push("Mastercard SDK, HCE ve EMVCo sertifikasyon tecrübesi");
  }
  if (text.includes("b2b") || text.includes("dashboard") || text.includes("merchant") || text.includes("üye işyeri")) {
    strongMatches.push("B2B Merchant yönetim paneli ve back-office ürün sahipliği");
  }
  if (text.includes("jira") || text.includes("agile") || text.includes("scrum") || text.includes("backlog")) {
    strongMatches.push("Agile / Scrum metodolojisi ve Jira ile sprint & backlog yönetimi");
  }
  if (text.includes("api") || text.includes("integration") || text.includes("entegrasyon")) {
    strongMatches.push("REST API ve backend teknik gereksinim analizi");
  }
  if (isProject) {
    strongMatches.push("Agile / Scrum teslimat koordinasyonu, sprint takvimi ve teknik bağımlılık yönetimi");
  }

  // Transferable
  if (text.includes("project manager") || text.includes("delivery") || text.includes("timeline")) {
    transferableExperience.push("Product Manager rolünde yürütülen teknik teslimat ve çapraz fonksiyonel koordinasyon");
  }
  if (text.includes("e-commerce") || text.includes("e-ticaret") || text.includes("shopify")) {
    transferableExperience.push("Graycat Studio kurucu ortaklığından gelen e-ticaret ve D2C dinamikleri");
  }

  // Red flags
  if (isCountryLocked) {
    redFlags.push(`Ülke kısıtlamalı remote: Yalnızca ilgili ülkede yerel ikamet edenler kabul ediliyor (${lockedReason})`);
  }
  if (!isTurkeyJob && !isWorldwideRemote && !hasSponsorship) {
    redFlags.push("Vize sponsorluğu sunulmuyor veya belirtilmemiş (Yurtdışı pozisyon)");
  }
  if (hasNoSponsorship && !isTurkeyJob && !redFlags.some(r => r.includes("Vize sponsorluğu"))) {
    redFlags.push("Vize sponsorluğu sunulmuyor (No sponsorship)");
  }
  if (isRestrictedRemote && !isCountryLocked) {
    redFlags.push("Remote çalışma belirli bir ülke/bölge (EU/US/UK) ile sınırlandırılmış");
  }
  if (text.includes("7+ years") || text.includes("8+ years") || text.includes("10+ years") || text.includes("director")) {
    redFlags.push("Yüksek kıdem seviyesi gereksinimi (7+ yıl)");
    gaps.push("Beklenen kıdem yılı (Aday 4+ yıl)");
  }

  // Final Verdict determination
  let finalVerdict: JobAnalysis["finalVerdict"] = "CONSIDER";
  let oneSentenceReason = "";

  if (isCountryLocked) {
    finalVerdict = "SKIP";
    oneSentenceReason = `İlan uzaktan çalışma (remote) görünse de yalnızca ilgili ülkede yerel ikamet edenleri kabul ediyor (${lockedReason}); Türkiye'den başvuruya kapalıdır.`;
  } else if (!isTurkeyJob && !isWorldwideRemote && !hasSponsorship) {
    finalVerdict = "SKIP";
    oneSentenceReason = "Yurtdışı pozisyon için vize sponsorluğu veya relokasyon desteği belirtilmemiştir; Türkiye'den çalışma izni/vize olmadan başvuru yapılamaz.";
  } else if (hasNoSponsorship && !isTurkeyJob && !isWorldwideRemote) {
    finalVerdict = "SKIP";
    oneSentenceReason = "Teknik gereksinimler uygun olsa da vize sponsorluğu verilmiyor ve yerel çalışma izni zorunlu tutuluyor.";
  } else if (canApplyFromTurkey === false) {
    finalVerdict = "SKIP";
    oneSentenceReason = "Lokasyon ve yasal kısıtlar nedeniyle Türkiye'den başvuruya uygun değildir.";
  } else if (strongMatches.length >= 2 && canApplyFromTurkey === true) {
    finalVerdict = "APPLY";
    oneSentenceReason = `İlandaki temel gereksinimler (${strongMatches[0] || "fintech/ürün yönetimi"}) adayın deneyimiyle güçlü şekilde örtüşüyor.`;
  } else if (gaps.length > 2) {
    finalVerdict = "SKIP";
    oneSentenceReason = "Deneyim eksiklikleri veya lokasyon kısıtları nedeniyle başvuru öncelikli önerilmiyor.";
  } else {
    finalVerdict = "CONSIDER";
    oneSentenceReason = "Profil ile uyumlu noktalar bulunuyor ancak çalışma şartları veya detayların teyit edilmesi tavsiye edilir.";
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
    strongMatches: strongMatches.length ? strongMatches : ["Yazılım ve ürün geliştirme süreçleri deneyimi", "Paydaş ve ekip koordinasyonu"],
    transferableExperience: transferableExperience.length ? transferableExperience : ["Teknik ekiplerle koordinasyon ve teslimat yönetimi"],
    gaps,
    productFit: ["Ürün yaşam döngüsü, backlog ve kullanıcı gereksinim analizi adayın PM deneyimiyle örtüşmektedir."],
    projectFit: ["Teslimat takvimi, paydaş iletişimi ve mühendislik koordinasyonu tecrübesi rolü desteklemektedir."],
    experienceToEmphasize: [
      "ProvisionPay bünyesinde yönetilen SoftPOS ve ödeme altyapısı projeleri",
      "B2B kurumsal merchant panelleri ve API entegrasyonları"
    ],
    redFlags,
    interviewRisks: [
      {
        requirement: "İlanda aranan spesifik teknoloji veya pazar regülasyonları",
        candidateExperience: "Ödeme sistemleri, EMVCo ve SDK altyapılarında doğrudan pratik çalışma",
        gap: "Şirketin kullandığı spesifik iç araçlar veya farklı bir ödeme şeması",
        honestStrategy: "Mevcut ödeme protokolü ve SDK deneyiminin hızla transfer edilebileceğini somut örneklerle ifade etmek."
      }
    ],
    finalVerdict,
    oneSentenceReason,
    analyzedAt: new Date().toISOString()
  };
}

// Built-in intelligent heuristic generator for Application Package
export function runHeuristicGenerator(job: JobPosting, profile: MasterProfile): ApplicationPackage {
  const isPjM = job.analysis?.roleType === "PROJECT";
  
  return {
    tailoredCvSummary: isPjM
      ? `${profile.name}, ödeme teknolojileri (SoftPOS, HCE, Mastercard SDK) ve B2B SaaS platformlarında 4+ yıllık teknik proje koordinasyonu ve ürün teslimatı deneyimine sahip profesyonel. Karmaşık entegrasyonlar, EMVCo sertifikasyon takvimleri ve çapraz fonksiyonel mühendislik ekipleri yönetiminde kanıtlanmış başarı.`
      : `${profile.name}, ödeme sistemleri, SoftPOS ve B2B kurumsal merchant yönetim platformlarında 4 yılı aşkın uçtan uca ürün yönetimi (Product Management) deneyimine sahip Product Manager. SDK/API entegrasyonları, ürün yol haritası (roadmap) ve backlog önceliklendirmesinde güçlü uzmanlık.`,
    tailoredBulletPoints: [
      {
        roleFlavor: "Product Manager",
        bullets: [
          `${job.company} gereksinimlerine uygun olarak; SoftPOS ve mobil ödeme çözümlerinin vizyon, roadmap ve sprint backlog süreçlerini yönetti.`,
          "Merchant kayıt, terminal yönetimi ve işlem raporlamasını içeren B2B back-office platformunun ürün gereksinimlerini (PRD) hazırladı.",
          "Geliştirici ve QA ekipleriyle yakın çalışarak kabul kriterlerini (acceptance criteria) ve kullanıcı deneyimi standartlarını belirledi."
        ]
      },
      {
        roleFlavor: "Project Manager",
        bullets: [
          `SoftPOS çözümünün harici kurumsal ortaklara entegrasyonunda teknik bağımlılıkları ve kritik teslimat takvimini başarıyla koordine etti.`,
          "Mastercard SDK ve EMVCo sertifikasyon süreçlerinde mühendislik, güvenlik ve test ekipleri arasındaki riskleri yönetti."
        ]
      }
    ],
    coverLetterEn: `Dear Hiring Team at ${job.company},

I am writing to express my enthusiastic interest in the ${job.title} opportunity. With over 4 years of hands-on experience at ProvisionPay managing SoftPOS, HCE, and Mastercard SDK payment products, I have developed deep expertise in payment technologies and technical delivery.

In my current role, I own B2B merchant back-office portals, coordinate complex certification pipelines, and drive cross-functional delivery between engineering squads and key clients. My background provides a unique blend of strategic product thinking and rigorous project execution.

I would welcome the opportunity to discuss how my payments background and track record of delivery can contribute to ${job.company}'s continued success.

Sincerely,
${profile.name}`,
    coverLetterTr: `Sayın ${job.company} İşe Alım Ekibi,

Bünyenizde açılan ${job.title} pozisyonuna başvurmaktan büyük bir memnuniyet duyuyorum. ProvisionPay'de 4 yılı aşkın süredir SoftPOS, HCE, Mastercard SDK tabanlı ödeme çözümleri ve B2B merchant yönetim panellerinin ürün yaşam döngüsünü ve teknik teslimat koordinasyonunu yürütmekteyim.

Çapraz fonksiyonel mühendislik ekipleriyle yürüttüğüm sprint süreçleri, EMVCo sertifikasyon deneyimim ve ürün sahipliği vizyonumla ${job.company}'nin hedeflerine somut değer katacağıma inanıyorum.

Saygılarımla,
${profile.name}`,
    recruiterMessage: `Hi there! I noticed the ${job.title} role at ${job.company}. Having managed SoftPOS, Mastercard SDK & B2B merchant platforms for 4+ yrs at ProvisionPay, I'd love to connect and share how my payments background aligns!`,
    screeningAnswers: [
      {
        question: `Why do you want to join ${job.company}?`,
        answer: `${job.company}'s work and product vision align directly with my 4+ years of specialized experience in payment technologies, merchant dashboards, and API/SDK integrations.`
      },
      {
        question: "Tell us about a challenging technical project you delivered.",
        answer: "At ProvisionPay, I led the delivery of a SoftPOS and Mastercard SDK rollout, coordinating EMVCo certification requirements and synchronizing engineering, QA, and external banking stakeholders under tight deadlines."
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
