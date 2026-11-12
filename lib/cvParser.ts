import { MasterProfile } from "@/types";

/**
 * Kural tabanlı CV ayrıştırıcı. Tamamen tarayıcıda çalışır, hiçbir AI/API gerektirmez.
 * Girdi: CV'den çıkarılmış düz metin. Çıktı: formu dolduracak profil taslağı + güven bilgisi.
 */

export interface ParsedCv {
  profile: MasterProfile;
  /** Emin olunamayan (kullanıcının kontrol etmesi gereken) alanlar */
  uncertain: string[];
  /** Ayrıştırılan e-posta/telefon vb. KAYDEDİLMEZ; yalnızca ekranda bilgi olarak gösterilir */
  detected: { email?: string; phone?: string; linkedin?: string };
}

type SectionKey = "summary" | "experience" | "education" | "skills" | "languages" | "other";

const SECTION_HEADINGS: Record<SectionKey, string[]> = {
  summary: ["summary", "profile", "about", "about me", "professional summary", "özet", "profil", "hakkımda", "kariyer hedefi", "ön yazı"],
  experience: ["experience", "work experience", "professional experience", "employment", "work history", "career history", "deneyim", "iş deneyimi", "iş deneyimleri", "çalışma geçmişi", "tecrübe", "tecrübeler"],
  education: ["education", "academic background", "eğitim", "eğitim bilgileri", "öğrenim"],
  skills: ["skills", "technical skills", "core skills", "key skills", "competencies", "tools", "technologies", "beceriler", "yetenekler", "yetkinlikler", "teknik beceriler", "araçlar"],
  languages: ["languages", "language skills", "diller", "yabancı dil", "yabancı diller", "dil bilgisi"],
  other: ["certifications", "certificates", "projects", "awards", "publications", "references", "interests", "hobbies", "volunteer", "sertifikalar", "projeler", "ödüller", "referanslar", "ilgi alanları", "hobiler", "kurslar"]
};

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, ocak: 1, feb: 2, february: 2, şubat: 2, subat: 2, mar: 3, march: 3, mart: 3,
  apr: 4, april: 4, nisan: 4, may: 5, mayıs: 5, mayis: 5, jun: 6, june: 6, haziran: 6,
  jul: 7, july: 7, temmuz: 7, aug: 8, august: 8, ağustos: 8, agustos: 8, sep: 9, sept: 9, september: 9, eylül: 9, eylul: 9,
  oct: 10, october: 10, ekim: 10, nov: 11, november: 11, kasım: 11, kasim: 11, dec: 12, december: 12, aralık: 12, aralik: 12
};

const TITLE_KEYWORDS = [
  "manager", "engineer", "developer", "designer", "analyst", "specialist", "consultant", "director", "lead", "owner",
  "architect", "coordinator", "administrator", "officer", "executive", "scientist", "intern", "associate", "head of",
  "founder", "co-founder", "president", "vp", "yönetici", "mühendis", "geliştirici", "tasarımcı", "analist", "uzman",
  "danışman", "direktör", "müdür", "lider", "sorumlusu", "koordinatör", "stajyer", "kurucu", "asistan", "şef"
];

const PRODUCT_TITLES = ["product manager", "product owner", "senior product manager", "associate product manager", "technical product manager", "head of product", "ürün yöneticisi", "ürün sahibi"];
const PROJECT_TITLES = ["project manager", "technical project manager", "program manager", "delivery manager", "scrum master", "proje yöneticisi", "proje müdürü", "implementation manager"];

/** Genel (sektörden bağımsız) beceri/araç sözlüğü. Metinde geçenler eşleştirilir. */
export const SKILL_DICTIONARY = [
  // PM & süreç
  "Agile", "Scrum", "Kanban", "Jira", "Confluence", "Trello", "Asana", "Notion", "Linear", "Roadmapping", "Roadmap", "Backlog", "PRD", "OKR", "KPI",
  "Stakeholder Management", "Risk Management", "Sprint Planning", "Product Discovery", "User Stories", "A/B Testing", "UAT", "Release Management",
  "Waterfall", "SAFe", "PMP", "Prince2", "Lean", "Six Sigma",
  // analitik & tasarım
  "SQL", "Excel", "Google Analytics", "Mixpanel", "Amplitude", "Tableau", "Power BI", "Looker", "Figma", "Miro", "Postman", "Swagger",
  // teknik
  "REST", "REST API", "GraphQL", "API", "SDK", "Webhooks", "Microservices", "Python", "JavaScript", "TypeScript", "Java", "Kotlin", "Swift", "React", "Node.js",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "CI/CD", "Android", "iOS", "Shopify", "WordPress", "SEO", "SaaS", "B2B", "B2C", "D2C",
  // domain
  "Fintech", "Payments", "SoftPOS", "HCE", "EMV", "EMVCo", "Mastercard", "Visa", "E-commerce", "Marketplace", "Healthcare", "Telecom", "Logistics", "Banking", "Insurance",
  // ek teknoloji / araçlar
  "C#", ".NET", "Spring Boot", "Golang", "Rust", "PHP", "Ruby", "Rails", "Django", "Flask", "Vue", "Angular", "Next.js", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Kafka",
  "Terraform", "Salesforce", "HubSpot", "SAP", "PowerPoint", "Photoshop", "Sketch", "Zendesk", "Intercom", "Stripe", "Machine Learning", "Data Analysis"
];

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

/** Türkçe büyük/küçük harf farklarını (İ → i̇) güvenle normalize eden küçük harfe çevirme. */
function lc(text: string): string {
  return text.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase().replace(/̇/g, "").replace(/ı/g, "i");
}

function normalizeText(text: string): string {
  return text
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[\u2022\u25CF\u25AA\u25E6\u2023\u2043\uf0b7\u00b7]/g, "•")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function headingOf(line: string): SectionKey | null {
  const cleaned = lc(line).replace(/[:：\-–—_*#|]/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.length > 40) return null;
  for (const key of Object.keys(SECTION_HEADINGS) as SectionKey[]) {
    if (SECTION_HEADINGS[key].map(lc).includes(cleaned)) return key;
  }
  return null;
}

function splitSections(lines: string[]): { head: string[]; sections: Record<SectionKey, string[]> } {
  const sections: Record<SectionKey, string[]> = { summary: [], experience: [], education: [], skills: [], languages: [], other: [] };
  const head: string[] = [];
  let current: SectionKey | null = null;
  for (const line of lines) {
    const h = headingOf(line);
    if (h) {
      current = h;
      continue;
    }
    if (current) sections[current].push(line);
    else head.push(line);
  }
  return { head, sections };
}

function monthYearToIndex(month: number, year: number): number {
  return year * 12 + (month - 1);
}

interface DateRange {
  raw: string;
  start: number;
  end: number;
  present: boolean;
  startYear: number;
}

const PRESENT_WORDS = "present|current|now|ongoing|günümüz|devam ediyor|halen|şu an|şuan|devam";
const RANGE_RE = new RegExp(
  `((?:[a-zçğıöşü]{3,9}\\.?\\s+)?(?:19|20)\\d{2}|\\d{1,2}[./]((?:19|20)\\d{2}))\\s*(?:-|–|—|to|/|ile|–)\\s*((?:[a-zçğıöşü]{3,9}\\.?\\s+)?(?:19|20)\\d{2}|\\d{1,2}[./](?:19|20)\\d{2}|${PRESENT_WORDS})`,
  "i"
);

function parseDateToken(token: string, fallbackMonth: number): { idx: number; year: number } | null {
  const t = lc(token.trim());
  const yearMatch = t.match(/(19|20)\d{2}/);
  if (!yearMatch) return null;
  const year = parseInt(yearMatch[0], 10);
  let month = fallbackMonth;
  const numeric = t.match(/^(\d{1,2})[./]/);
  if (numeric) {
    const m = parseInt(numeric[1], 10);
    if (m >= 1 && m <= 12) month = m;
  } else {
    const word = t.replace(/[^a-zçğıöşü]/g, " ").trim().split(/\s+/)[0];
    if (word && MONTHS[word]) month = MONTHS[word];
  }
  return { idx: monthYearToIndex(month, year), year };
}

function findDateRange(line: string): DateRange | null {
  const m = line.match(RANGE_RE);
  if (!m) return null;
  const startTok = parseDateToken(m[1], 1);
  if (!startTok) return null;
  const endRaw = lc(m[3]).trim();
  const now = new Date();
  const nowIdx = monthYearToIndex(now.getMonth() + 1, now.getFullYear());
  let end: number;
  let present = false;
  if (new RegExp(`^(${PRESENT_WORDS})$`, "i").test(endRaw)) {
    end = nowIdx;
    present = true;
  } else {
    const endTok = parseDateToken(endRaw, 12);
    if (!endTok) return null;
    end = Math.min(endTok.idx, nowIdx);
  }
  if (end < startTok.idx) return null;
  return { raw: m[0], start: startTok.idx, end, present, startYear: startTok.year };
}

/** Çakışan aralıkları birleştirip toplam deneyim yılını hesaplar. */
function totalYears(ranges: DateRange[]): number {
  if (ranges.length === 0) return 0;
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  let total = 0;
  let curStart = sorted[0].start;
  let curEnd = sorted[0].end;
  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i];
    if (r.start <= curEnd) {
      curEnd = Math.max(curEnd, r.end);
    } else {
      total += curEnd - curStart;
      curStart = r.start;
      curEnd = r.end;
    }
  }
  total += curEnd - curStart;
  return Math.round((total / 12) * 10) / 10;
}

function looksLikeTitle(text: string): boolean {
  const t = lc(text);
  return TITLE_KEYWORDS.map(lc).some((k) => new RegExp(`(^|[^a-zçğıöşü])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(t));
}

function isBullet(line: string): boolean {
  return /^\s*[•\-–*▪►➢✓>]\s+/.test(line);
}

function stripBullet(line: string): string {
  return line.replace(/^\s*[•\-–*▪►➢✓>]\s+/, "").trim();
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const key = it.toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(it.trim());
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Alan çıkarıcılar
// ---------------------------------------------------------------------------

function extractContact(text: string) {
  const email = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0];
  const phone = text.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/)?.[0];
  const linkedin = text.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]+/i)?.[0];
  return { email, phone, linkedin };
}

function extractName(head: string[], allLines: string[]): string | undefined {
  const candidates = (head.length ? head : allLines).slice(0, 8);
  for (const raw of candidates) {
    const line = raw.trim();
    if (!line || line.length > 50) continue;
    if (/[@\d:/]|http|www\./i.test(line)) continue;
    if (looksLikeTitle(line)) continue;
    if (headingOf(line)) continue;
    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 4) continue;
    if (words.every((w) => /^[A-ZÇĞİÖŞÜ][\p{L}'.-]+$/u.test(w) || /^[A-ZÇĞİÖŞÜ]{2,}$/.test(w))) {
      return words.map((w) => (w === w.toUpperCase() ? w.charAt(0) + w.slice(1).toLowerCase() : w)).join(" ");
    }
  }
  return undefined;
}

const COUNTRY_ALIASES: Record<string, string> = {
  turkey: "Türkiye", türkiye: "Türkiye", turkiye: "Türkiye", "united states": "United States", usa: "United States", us: "United States",
  "united kingdom": "United Kingdom", uk: "United Kingdom", england: "United Kingdom", germany: "Germany", deutschland: "Germany", almanya: "Germany",
  france: "France", fransa: "France", spain: "Spain", ispanya: "Spain", portugal: "Portugal", netherlands: "Netherlands", hollanda: "Netherlands",
  ireland: "Ireland", belgium: "Belgium", denmark: "Denmark", sweden: "Sweden", norway: "Norway", finland: "Finland", switzerland: "Switzerland",
  austria: "Austria", italy: "Italy", canada: "Canada", australia: "Australia", poland: "Poland", romania: "Romania", ukraine: "Ukraine",
  "united arab emirates": "United Arab Emirates", uae: "United Arab Emirates", dubai: "United Arab Emirates", singapore: "Singapore",
  india: "India", pakistan: "Pakistan", brazil: "Brazil", mexico: "Mexico", japan: "Japan", greece: "Greece", cyprus: "Cyprus", azerbaijan: "Azerbaijan"
};

const TR_CITIES = ["istanbul", "ankara", "izmir", "bursa", "antalya", "adana", "konya", "gaziantep", "kocaeli", "mersin", "eskişehir", "eskisehir", "kayseri", "trabzon", "samsun"];

function extractLocation(head: string[], text: string): string | undefined {
  const area = head.slice(0, 10).join(" | ") || text.slice(0, 600);
  const labelled = area.match(/(?:location|konum|adres|address|city|şehir)\s*[:\-]\s*([^|\n]+)/i);
  if (labelled) return labelled[1].trim().slice(0, 60);

  const lower = lc(area);
  for (const city of TR_CITIES) {
    if (new RegExp(`(^|[^\\p{L}])${city}([^\\p{L}]|$)`, "iu").test(lower)) {
      const display = city.charAt(0).toUpperCase() + city.slice(1);
      return `Türkiye (${display.replace("Istanbul", "İstanbul")})`;
    }
  }
  const countries = Object.keys(COUNTRY_ALIASES).sort((a, b) => b.length - a.length);
  for (const c of countries) {
    if (new RegExp(`(^|[^\\p{L}])${c}([^\\p{L}]|$)`, "iu").test(lower)) return COUNTRY_ALIASES[c];
  }
  return undefined;
}

function extractSkills(sectionLines: string[], fullText: string): string[] {
  const found: string[] = [];
  // 1) Beceri bölümündeki virgül/madde/çizgi ile ayrılmış öğeler
  for (const line of sectionLines) {
    const cleaned = stripBullet(line).replace(/^[\p{L} &/]{2,30}:\s*/u, "");
    for (const part of cleaned.split(/[,;|•·]|\s{2,}/)) {
      const p = part.trim().replace(/\.$/, "");
      const isLanguageEntry = Object.prototype.hasOwnProperty.call(LANGUAGE_LC, lc(p.split("(")[0]).trim());
      if (!isLanguageEntry && p.length >= 2 && p.length <= 32 && !/\d{4}/.test(p) && p.split(" ").length <= 4) found.push(p);
    }
  }
  // 2) Sözlük eşleşmeleri (tüm metin)
  for (const skill of SKILL_DICTIONARY) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    if (new RegExp(`(^|[^\\p{L}0-9])${escaped}([^\\p{L}0-9]|$)`, "iu").test(fullText)) found.push(skill);
  }
  return dedupe(found).slice(0, 40);
}

const LANGUAGE_NAMES: Record<string, string> = {
  türkçe: "Türkçe", turkish: "Türkçe", ingilizce: "İngilizce", english: "İngilizce", almanca: "Almanca", german: "Almanca",
  fransızca: "Fransızca", french: "Fransızca", ispanyolca: "İspanyolca", spanish: "İspanyolca", rusça: "Rusça", russian: "Rusça",
  arapça: "Arapça", arabic: "Arapça", italyanca: "İtalyanca", italian: "İtalyanca", portekizce: "Portekizce", portuguese: "Portekizce",
  japonca: "Japonca", japanese: "Japonca", çince: "Çince", chinese: "Çince", hollandaca: "Hollandaca", dutch: "Hollandaca"
};

const LANGUAGE_LC: Record<string, string> = Object.fromEntries(Object.entries(LANGUAGE_NAMES).map(([k, v]) => [lc(k), v]));

function extractLanguages(sectionLines: string[], fullText: string): { language: string; level: string }[] {
  const out: { language: string; level: string }[] = [];
  const names = Object.keys(LANGUAGE_LC).join("|");

  // Dil bölümü başlığı yoksa: "Dil: ..." gibi etiketli satırlar veya "Almanca (Başlangıç)" kalıbı içeren satırlar
  let source: string;
  if (sectionLines.length) {
    source = sectionLines.join("\n");
  } else {
    const labelRe = /^\s*(?:dil|diller|yabanci dil|yabancı dil|languages?|language skills)\s*[:\-–]/i;
    const parenRe = new RegExp(`(?:${names})\\s*\\(`);
    source = fullText
      .split("\n")
      .filter((l) => labelRe.test(lc(l)) || parenRe.test(lc(l)))
      .join("\n");
  }

  // lc() uzunluğu korur; eşleşmeyi küçük harfli metinde yapıp seviyeyi orijinal metinden alırız (İ/ı korunur)
  const scan = lc(source);
  const re = new RegExp(`(${names})\\s*(?:[:(\\-–,]\\s*)?([^\\n,;•|]{0,50})`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(scan))) {
    const language = LANGUAGE_LC[m[1]];
    const rawLevel = m[2] ? source.slice(m.index + m[0].length - m[2].length, m.index + m[0].length) : "";
    const level = rawLevel.replace(/[()]/g, "").replace(/[\s.]+$/, "").trim();
    if (language && !out.some((o) => o.language === language)) {
      out.push({ language, level: level ? level.charAt(0).toLocaleUpperCase("tr") + level.slice(1) : "Belirtilmedi" });
    }
  }
  return out;
}

interface ExperienceEntry {
  company: string;
  title: string;
  period: string;
  highlights: string[];
  range: DateRange;
}

function extractExperience(lines: string[]): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  const dateIdxs: number[] = [];
  lines.forEach((l, i) => {
    if (!isBullet(l) && findDateRange(l)) dateIdxs.push(i);
  });
  if (dateIdxs.length === 0) return entries;

  for (let n = 0; n < dateIdxs.length; n++) {
    const idx = dateIdxs[n];
    const nextIdx = n + 1 < dateIdxs.length ? dateIdxs[n + 1] : lines.length;
    const range = findDateRange(lines[idx])!;

    // Başlık/şirket: tarih satırının kendisi (tarih çıkarılmış) ve önceki 2 satır
    const sameLine = lines[idx].replace(range.raw, "").replace(/[()|,–—-]+\s*$/g, "").replace(/^\s*[()|,–—-]+/g, "").trim();
    const prevLines: string[] = [];
    for (let k = idx - 1; k >= Math.max(0, idx - 2, n > 0 ? dateIdxs[n - 1] + 1 : 0); k--) {
      if (!isBullet(lines[k]) && lines[k].trim().length < 90) prevLines.unshift(lines[k].trim());
      else break;
    }
    const headerParts = [...prevLines, sameLine].filter(Boolean).join(" | ");
    const pieces = headerParts.split(/\s+(?:\||@|at|–|—|-)\s+|\s*\|\s*|,\s+(?=[A-ZÇĞİÖŞÜ])/).map((p) => p.trim()).filter(Boolean);

    let title = pieces.find((p) => looksLikeTitle(p)) || "";
    let company = pieces.find((p) => p !== title) || "";
    if (!title && pieces.length > 1) {
      title = pieces[0];
      company = pieces[1];
    }
    if (!title && pieces.length === 1) title = pieces[0];

    const highlights: string[] = [];
    for (let k = idx + 1; k < nextIdx; k++) {
      const line = lines[k].trim();
      if (!line) continue;
      if (isBullet(line)) highlights.push(stripBullet(line));
      else if (line.length > 60 && highlights.length >= 0) highlights.push(line);
    }
    entries.push({ company, title, period: range.raw, highlights: highlights.slice(0, 8), range });
  }
  return entries;
}

function inferRoles(titles: string[], text: string) {
  const lower = lc(titles.join(" | ") + " " + text.slice(0, 1500));
  const primary: string[] = [];
  const secondary: string[] = [];
  const hybrid: string[] = [];
  const hasProduct = PRODUCT_TITLES.some((t) => lower.includes(t));
  const hasProject = PROJECT_TITLES.some((t) => lower.includes(t));
  const latest = titles[0];

  if (latest) primary.push(latest);
  if (hasProduct) {
    primary.push("Product Manager");
    if (/senior|kidemli|lead/.test(lower)) primary.push("Senior Product Manager");
    primary.push("Product Owner");
  }
  if (hasProject) secondary.push("Project Manager", "Technical Project Manager", "Delivery Manager");
  if (hasProduct && hasProject) hybrid.push("Technical Product Manager", "Product Operations");
  return { primary: dedupe(primary), secondary: dedupe(secondary), hybrid: dedupe(hybrid) };
}

export function buildRawMarkdown(p: MasterProfile): string {
  const lines: string[] = ["# MASTER CANDIDATE PROFILE", ""];
  lines.push("## Aday", `${p.name || "-"} — ${p.targetTitle || "-"} (${p.yearsOfExperience || 0}+ yıl deneyim)`, `Konum: ${p.currentLocation || "-"}`, "");
  if (p.summary) lines.push("## Özet", p.summary, "");
  if (p.coreExperience?.length) {
    lines.push("## Deneyim");
    for (const e of p.coreExperience) {
      lines.push(`### ${e.title || "-"} — ${e.company || "-"} (${e.period || "-"})`);
      for (const h of e.highlights || []) lines.push(`- ${h}`);
      lines.push("");
    }
  }
  if (p.skills?.length) lines.push("## Beceriler", p.skills.join(", "), "");
  if (p.languages?.length) lines.push("## Diller", p.languages.map((l) => `${l.language} (${l.level})`).join(", "), "");
  if (p.targetCountries?.length) lines.push("## Hedef Ülkeler", p.targetCountries.join(", "), "");
  return lines.join("\n").trim();
}

export function emptyProfile(): MasterProfile {
  return {
    id: "user-profile",
    name: "",
    targetTitle: "",
    yearsOfExperience: 0,
    currentLocation: "",
    targetCountries: [],
    targetRoles: { primary: [], secondary: [], hybrid: [] },
    coreExperience: [],
    projectManagementHighlights: [],
    productManagementHighlights: [],
    summary: "",
    skills: [],
    workPreference: "any",
    needsVisaSponsorship: true,
    languages: [],
    rawMarkdown: ""
  };
}

// ---------------------------------------------------------------------------
// Ana fonksiyon
// ---------------------------------------------------------------------------

export function parseCvText(rawText: string): ParsedCv {
  const text = normalizeText(rawText);
  const lines = text.split("\n").map((l) => l.trim());
  const nonEmpty = lines.filter(Boolean);
  const { head, sections } = splitSections(nonEmpty);
  const uncertain: string[] = [];
  const profile = emptyProfile();

  const contact = extractContact(text);

  // İsim
  const name = extractName(head, nonEmpty);
  if (name) profile.name = name;
  else uncertain.push("name");

  // Konum
  const location = extractLocation(head, text);
  if (location) profile.currentLocation = location;
  else uncertain.push("currentLocation");

  // Deneyim
  const expLines = sections.experience.length ? sections.experience : nonEmpty;
  const entries = extractExperience(expLines);
  profile.coreExperience = entries.map((e) => ({
    company: e.company,
    title: e.title,
    period: e.period,
    highlights: e.highlights,
    fintechDomains: [],
    technologies: [],
    tools: []
  }));
  if (entries.length === 0) uncertain.push("coreExperience");
  else if (entries.some((e) => !e.company || !e.title)) uncertain.push("coreExperience");

  // Deneyim süresi
  const years = totalYears(entries.map((e) => e.range));
  if (years > 0) profile.yearsOfExperience = Math.max(1, Math.round(years));
  else uncertain.push("yearsOfExperience");

  // Unvan
  const latestTitle = entries.find((e) => e.title)?.title;
  const headTitle = head.find((l) => looksLikeTitle(l) && l.length < 60 && !/[@\d]/.test(l));
  profile.targetTitle = (headTitle || latestTitle || "").trim();
  if (!profile.targetTitle) uncertain.push("targetTitle");

  // Roller
  profile.targetRoles = inferRoles(entries.map((e) => e.title).filter(Boolean), text);
  if (profile.targetRoles.primary.length === 0 && profile.targetTitle) profile.targetRoles.primary = [profile.targetTitle];
  if (profile.targetRoles.primary.length === 0) uncertain.push("targetRoles");

  // Özet
  const summaryText = sections.summary.join(" ").trim();
  if (summaryText) profile.summary = summaryText.slice(0, 700);

  // Beceriler
  profile.skills = extractSkills(sections.skills, text);
  if (profile.skills.length === 0) uncertain.push("skills");

  // Diller
  profile.languages = extractLanguages(sections.languages, text);
  if (profile.languages.length === 0) uncertain.push("languages");

  // Hedef ülke: varsayılan olarak mevcut ülke
  const homeCountry = profile.currentLocation.split("(")[0].trim();
  if (homeCountry) profile.targetCountries = [homeCountry];

  profile.rawMarkdown = buildRawMarkdown(profile);

  return {
    profile,
    uncertain,
    detected: contact
  };
}
