import { MasterProfile } from "@/types";
import { canonicalCountry, parseLocation, toSearchLocation } from "@/lib/geo";

/**
 * Profilden arama planı üretir: hangi roller aranacak, hangi başlıklar kabul/ret edilecek,
 * hangi ülkelerde/kaynaklarda aranacak. Saf fonksiyonlar; hem tarayıcıda hem sunucuda çalışır.
 */

interface RoleFamily {
  id: string;
  label: string;
  /** Başlık eşleştirme için kabul edilen ifadeler (EN + TR) */
  phrases: string[];
  /** İlan sitelerinde aranacak sorgular */
  searchEn: string;
  searchTr?: string;
  remotiveCategory?: string;
  jobicyTag?: string;
  /** Bu aile hedefliyken bile reddedilecek komşu başlıklar */
  excludes: string[];
  /** Aile hedef DEĞİLKEN reddedilecek başlıklar */
  rejectWhenOther: string[];
  detect: RegExp;
}

const FAMILIES: RoleFamily[] = [
  {
    id: "devops", label: "DevOps / Platform", detect: /devops|\bsre\b|site reliability|platform engineer|cloud engineer/i,
    phrases: ["devops engineer", "site reliability engineer", "platform engineer", "cloud engineer", "sre"],
    searchEn: "DevOps Engineer", remotiveCategory: "devops", jobicyTag: "devops", excludes: [],
    rejectWhenOther: ["devops", "site reliability", "platform engineer", "cloud engineer"]
  },
  {
    id: "qa", label: "QA / Test", detect: /\bqa\b|quality assurance|test engineer|tester|test mühendis/i,
    phrases: ["qa engineer", "quality assurance", "test engineer", "sdet", "test mühendisi"],
    searchEn: "QA Engineer", searchTr: "test muhendisi", remotiveCategory: "qa", jobicyTag: "qa", excludes: [],
    rejectWhenOther: ["qa engineer", "test engineer", "quality assurance engineer"]
  },
  {
    id: "data", label: "Veri / Analitik", detect: /data (scientist|analyst|engineer)|analytics|veri (analist|bilim|mühendis)|business intelligence|\bbi\b analyst/i,
    phrases: ["data analyst", "data scientist", "data engineer", "analytics engineer", "business intelligence", "veri analisti", "veri bilimci", "veri mühendisi"],
    searchEn: "Data Analyst", searchTr: "veri analisti", remotiveCategory: "data", jobicyTag: "data", excludes: [],
    rejectWhenOther: ["data engineer", "data scientist", "machine learning engineer"]
  },
  {
    id: "engineering", label: "Yazılım Geliştirme", detect: /engineer|developer|programmer|yazılım|mühendis|geliştirici/i,
    phrases: ["software engineer", "software developer", "backend developer", "backend engineer", "frontend developer", "frontend engineer", "full stack", "fullstack", "mobile developer", "android developer", "ios developer", "web developer", "yazılım mühendisi", "yazılım geliştirici", "developer", "engineer"],
    searchEn: "Software Engineer", searchTr: "yazilim gelistirici", remotiveCategory: "software-dev", jobicyTag: "engineering", excludes: ["sales engineer", "support engineer"],
    rejectWhenOther: ["software engineer", "software developer", "frontend", "backend", "fullstack", "full stack", "mobile developer", "android developer", "ios developer"]
  },
  {
    id: "design", label: "Tasarım", detect: /design|tasar|ux|ui\b/i,
    phrases: ["product designer", "ux designer", "ui designer", "ui/ux", "graphic designer", "visual designer", "ux researcher", "tasarımcı"],
    searchEn: "Product Designer", searchTr: "tasarimci", remotiveCategory: "design", jobicyTag: "design", excludes: [],
    rejectWhenOther: ["product designer", "ui/ux", "ux designer", "ui designer", "graphic designer"]
  },
  {
    id: "product", label: "Ürün Yönetimi", detect: /product|ürün/i,
    phrases: ["product manager", "product owner", "technical product", "product lead", "head of product", "vp of product", "vp product", "chief product", "product operations", "ürün yöneticisi", "ürün müdürü", "ürün sahibi", "group product", "apm"],
    searchEn: "Product Manager", searchTr: "product manager", remotiveCategory: "product", jobicyTag: "product",
    excludes: ["product designer", "product marketing", "pmm", "product support", "product specialist", "product analyst"],
    rejectWhenOther: ["product manager", "product owner"]
  },
  {
    id: "project", label: "Proje / Teslimat Yönetimi", detect: /project|program manager|delivery|scrum|proje|implementation/i,
    phrases: ["project manager", "technical project", "delivery manager", "program manager", "scrum master", "project lead", "implementation manager", "proje yöneticisi", "proje müdürü", "proje lideri", "tpm"],
    searchEn: "Project Manager", searchTr: "proje yoneticisi", remotiveCategory: "project-management", jobicyTag: "project-management", excludes: [],
    rejectWhenOther: ["project manager", "program manager", "scrum master", "delivery manager"]
  },
  {
    id: "marketing", label: "Pazarlama", detect: /marketing|pazarlama|growth|seo\b|content (manager|strategist)|brand/i,
    phrases: ["marketing manager", "digital marketing", "growth manager", "content marketing", "seo specialist", "brand manager", "pazarlama uzmanı", "pazarlama yöneticisi"],
    searchEn: "Marketing Manager", searchTr: "pazarlama uzmani", remotiveCategory: "marketing", jobicyTag: "marketing", excludes: [],
    rejectWhenOther: ["marketing manager", "digital marketing", "growth marketing", "product marketing", "pazarlama uzmanı"]
  },
  {
    id: "sales", label: "Satış / İş Geliştirme", detect: /sales|satış|account (manager|executive)|business development|bdr|sdr/i,
    phrases: ["sales manager", "sales executive", "account executive", "account manager", "business development", "sales representative", "satış yöneticisi", "satış uzmanı"],
    searchEn: "Account Manager", searchTr: "satis", remotiveCategory: "sales-business", jobicyTag: "sales", excludes: [],
    rejectWhenOther: ["account manager", "account executive", "sales manager", "sales executive", "business development", "satış"]
  },
  {
    id: "support", label: "Müşteri Destek / Başarı", detect: /customer (success|support|service)|support (engineer|specialist)|müşteri/i,
    phrases: ["customer success", "customer support", "customer service", "support specialist", "müşteri destek", "müşteri temsilcisi"],
    searchEn: "Customer Success Manager", searchTr: "musteri destek", remotiveCategory: "customer-support", jobicyTag: "customer-success", excludes: [],
    rejectWhenOther: ["customer success", "customer support", "customer service"]
  },
  {
    id: "hr", label: "İnsan Kaynakları", detect: /recruit|talent|human resources|\bhr\b|insan kaynak/i,
    phrases: ["recruiter", "talent acquisition", "hr manager", "hr business partner", "human resources", "insan kaynakları"],
    searchEn: "Recruiter", searchTr: "insan kaynaklari", remotiveCategory: "human-resources", jobicyTag: "hr", excludes: [],
    rejectWhenOther: ["recruiter", "talent acquisition", "hr manager"]
  },
  {
    id: "finance", label: "Finans / Muhasebe", detect: /financ|accountant|accounting|muhasebe|finans|controller/i,
    phrases: ["financial analyst", "finance manager", "accountant", "accounting", "controller", "muhasebe", "finans uzmanı"],
    searchEn: "Financial Analyst", searchTr: "finans uzmani", remotiveCategory: "finance-legal", jobicyTag: "finance", excludes: [],
    rejectWhenOther: ["financial analyst", "accountant", "finance manager"]
  }
];

const SENIORITY = /^(?:(?:senior|sr\.?|junior|jr\.?|lead|principal|staff|associate|kıdemli|yardımcı|baş|mid-level|mid)\s+)+/i;
const KEEP_FULL = /^(?:head of|vp of|vp|director of|chief|group)\b/i;

export interface PlanRole {
  id: string;
  /** Kullanıcıya gösterilen ad (profildeki hâliyle) */
  label: string;
  /** Aramada kullanılan çekirdek ifade (kıdem sözcükleri atılmış) */
  query: string;
  queryTr?: string;
  familyId: string;
  tier: "primary" | "secondary" | "hybrid";
  defaultOn: boolean;
}

export interface SearchPlan {
  roles: PlanRole[];
  families: string[];
  homeCountry: string;
  /** Aranacak ülkeler (İngilizce ad, LinkedIn konum parametresi için) */
  locations: string[];
  wantsRemote: boolean;
  /** Kariyer.net yalnızca Türkiye hedefliyse anlamlı */
  turkeyRelevant: boolean;
  /** Başlık kabul listesi (tüm roller) */
  matchPhrases: string[];
}

const ASCII_FOLD: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i", Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u" };
export function asciiFold(s: string): string {
  return s.replace(/[çğıöşüİÇĞÖŞÜ]/g, (c) => ASCII_FOLD[c] || c);
}

function slug(s: string): string {
  return asciiFold(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function detectFamily(phrase: string): RoleFamily | null {
  for (const f of FAMILIES) if (f.detect.test(phrase)) return f;
  return null;
}

function corePhrase(role: string): string {
  const t = role.trim().replace(/\s+/g, " ");
  if (KEEP_FULL.test(t)) return t;
  const stripped = t.replace(SENIORITY, "").trim();
  return stripped.length >= 3 ? stripped : t;
}

export function homeCountryOf(profile: MasterProfile): string {
  return parseLocation(profile.currentLocation || "").country;
}

export function buildSearchPlan(profile: MasterProfile): SearchPlan {
  const rawRoles: { label: string; tier: PlanRole["tier"] }[] = [];
  const push = (arr: string[] | undefined, tier: PlanRole["tier"]) => (arr || []).forEach((r) => r && r.trim() && rawRoles.push({ label: r.trim(), tier }));
  push(profile.targetRoles?.primary, "primary");
  if (rawRoles.length === 0 && profile.targetTitle) rawRoles.push({ label: profile.targetTitle.trim(), tier: "primary" });
  push(profile.targetRoles?.secondary, "secondary");
  push(profile.targetRoles?.hybrid, "hybrid");

  const roles: PlanRole[] = [];
  const seen = new Set<string>();
  for (const r of rawRoles) {
    const core = corePhrase(r.label);
    const key = core.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const fam = detectFamily(core);
    roles.push({
      id: slug(core) || `role-${roles.length}`,
      label: r.label,
      query: core,
      queryTr: fam?.searchTr,
      familyId: fam?.id || "custom",
      tier: r.tier,
      defaultOn: r.tier !== "hybrid"
    });
    if (roles.length >= 8) break;
  }

  const families = Array.from(new Set(roles.map((r) => r.familyId)));

  // Başlık kabul listesi: profil rollerinin kendisi + ilgili ailelerin eşanlamlıları
  const matchSet = new Set<string>();
  for (const r of roles) matchSet.add(r.query.toLowerCase());
  for (const fid of families) {
    const fam = FAMILIES.find((f) => f.id === fid);
    // Ailenin genel eşanlamlıları yalnızca kullanıcı o ailenin rolünü hedefliyorsa eklenir
    if (fam) fam.phrases.filter((p) => p !== "developer" && p !== "engineer").forEach((p) => matchSet.add(p));
  }

  const countries = (profile.targetCountries || []).filter((c) => c && !/global remote|worldwide/i.test(c));
  const home = homeCountryOf(profile);
  // Tercih edilen şehirler önce aranır (ör. "Berlin"), ardından ülkeler/bölgeler
  const cities = (profile.targetCities || []).map((c) => c.trim()).filter(Boolean);
  const locations = Array.from(new Set([...cities, ...countries.map(toSearchLocation)]));
  if (locations.length === 0 && home) locations.push(toSearchLocation(home));

  const wantsRemote =
    profile.workPreference === "remote" ||
    profile.workPreference === "any" ||
    !profile.workPreference ||
    (profile.targetCountries || []).some((c) => /global remote|worldwide/i.test(c));

  const turkeyRelevant = [home, ...countries].some((c) => canonicalCountry(c) === "Türkiye");

  return { roles, families, homeCountry: home, locations, wantsRemote, turkeyRelevant, matchPhrases: Array.from(matchSet) };
}

export function defaultSelectedRoleIds(plan: SearchPlan): string[] {
  const on = plan.roles.filter((r) => r.defaultOn).map((r) => r.id);
  return on.length ? on : plan.roles.slice(0, 1).map((r) => r.id);
}

function containsPhrase(title: string, phrase: string): boolean {
  const t = title.toLowerCase();
  const p = phrase.toLowerCase();
  if (p.length <= 4) return new RegExp(`(^|[^a-z0-9çğıöşü])${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9çğıöşü]|$)`, "i").test(t);
  return t.includes(p);
}

/** Reddedilecek başlıklar: kullanıcının hedeflemediği ailelerin başlıkları + hedeflenen ailelerin komşu başlıkları */
export function buildBlacklist(plan: SearchPlan): string[] {
  const own = plan.matchPhrases.map((p) => p.toLowerCase());
  const list: string[] = [
    "intern", "stajyer", "assistant to", "asistan", "medikal", "medical", "pharmaceutical", "relations specialist", "specialist (spanish"
  ];
  for (const fam of FAMILIES) {
    const targeted = plan.families.includes(fam.id);
    list.push(...(targeted ? fam.excludes : fam.rejectWhenOther));
  }
  // Kullanıcının kendi hedef ifadesiyle çakışan reddetme girdilerini ayıkla
  return Array.from(new Set(list.map((l) => l.toLowerCase()))).filter(
    (neg) => !own.some((p) => p === neg || p.includes(neg) || neg.includes(p))
  );
}

/** Başlık, seçili rollerden birine uyuyor ve kara listede değilse true */
export function isValidTargetRole(title: string, plan: SearchPlan, selectedRoleIds?: string[]): boolean {
  const t = (title || "").toLowerCase().trim();
  if (!t) return false;

  const blacklist = buildBlacklist(plan);
  if (blacklist.some((neg) => containsPhrase(t, neg))) return false;

  const selected = selectedRoleIds && selectedRoleIds.length ? plan.roles.filter((r) => selectedRoleIds.includes(r.id)) : plan.roles;
  const phrases = new Set<string>();
  for (const r of selected) {
    phrases.add(r.query.toLowerCase());
    const fam = FAMILIES.find((f) => f.id === r.familyId);
    if (fam) fam.phrases.filter((p) => p !== "developer" && p !== "engineer").forEach((p) => phrases.add(p));
  }
  return Array.from(phrases).some((p) => containsPhrase(t, p));
}

export interface SourceQueries {
  linkedin: { keywords: string; location: string; remote: boolean }[];
  kariyer: string[];
  jobicyTags: string[];
  remotiveCategories: string[];
  remotiveSearches: string[];
}

/** Seçili rollerden kaynak bazlı sorgular üretir (istek sayısı sınırlı tutulur) */
export function buildSourceQueries(plan: SearchPlan, selectedRoleIds?: string[]): SourceQueries {
  const selected = (selectedRoleIds && selectedRoleIds.length ? plan.roles.filter((r) => selectedRoleIds.includes(r.id)) : plan.roles.filter((r) => r.defaultOn)).slice(0, 4);
  const linkedin: SourceQueries["linkedin"] = [];

  // Kapsamı sınırlı tut: en fazla 4 rol, her rol için en fazla 2 ülke + 1 uzaktan sorgu
  for (const r of selected) {
    for (const loc of plan.locations.slice(0, 2)) linkedin.push({ keywords: r.query, location: loc, remote: false });
    if (plan.wantsRemote) linkedin.push({ keywords: r.query, location: "Worldwide", remote: true });
  }

  const kariyer = plan.turkeyRelevant ? Array.from(new Set(selected.map((r) => asciiFold(r.queryTr || r.query).toLowerCase()))) : [];

  const jobicyTags = new Set<string>();
  const remotiveCategories = new Set<string>();
  const remotiveSearches = new Set<string>();
  for (const r of selected) {
    const fam = FAMILIES.find((f) => f.id === r.familyId);
    if (fam?.jobicyTag) jobicyTags.add(fam.jobicyTag);
    if (fam?.remotiveCategory) remotiveCategories.add(fam.remotiveCategory);
    if (!fam) remotiveSearches.add(r.query);
  }

  return {
    linkedin: linkedin.slice(0, 12),
    kariyer,
    jobicyTags: Array.from(jobicyTags),
    remotiveCategories: Array.from(remotiveCategories),
    remotiveSearches: Array.from(remotiveSearches)
  };
}

export function describePlanScope(plan: SearchPlan, selectedRoleIds?: string[]): string {
  const selected = selectedRoleIds && selectedRoleIds.length ? plan.roles.filter((r) => selectedRoleIds.includes(r.id)) : plan.roles;
  return selected.map((r) => r.query).join(", ");
}
