import { MasterProfile } from "@/types";
import { SKILL_DICTIONARY } from "@/lib/cvParser";

/**
 * İlan metninden gereksinimleri (beceri, deneyim yılı, sertifika, dil) çıkarıp profille karşılaştırır.
 * Kural tabanlı; tamamen saf fonksiyonlar (tarayıcıda ve sunucuda çalışır).
 */

export type RequirementKind = "skill" | "years" | "cert" | "language";
export type RequirementLevel = "required" | "preferred";

export interface Requirement {
  kind: RequirementKind;
  label: string;
  level: RequirementLevel;
  /** true: profilde karşılığı var, false: yok, "unknown": karşılaştırılamadı */
  met: boolean | "unknown";
  /** Karşılanmıyorsa tek başına elemeye yetecek kadar kritik mi? */
  critical: boolean;
  detail?: string;
}

export interface RequirementReport {
  /** İlan metninde karşılaştırılabilir en az bir gereksinim bulundu mu? */
  assessed: boolean;
  /** 0-100; assessed=false ise null */
  score: number | null;
  requirements: Requirement[];
  matched: Requirement[];
  missingRequired: Requirement[];
  missingPreferred: Requirement[];
  criticalMissing: Requirement[];
}

// ---------------------------------------------------------------------------
// Metin yardımcıları
// ---------------------------------------------------------------------------

function lc(text: string): string {
  return text.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase().replace(/̇/g, "").replace(/ı/g, "i");
}

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

function hasTerm(haystack: string, term: string): boolean {
  return new RegExp(`(^|[^\\p{L}0-9])${esc(lc(term))}([^\\p{L}0-9]|$)`, "iu").test(haystack);
}

const REQUIRED_HEADINGS = /(requirements?|qualifications?|must[- ]haves?|what you(?:'ll| will)? (?:bring|need)|who you are|about you|you have|minimum|aranan|nitelikler|gereksinimler|aday(?:da)? aranan)/i;
const PREFERRED_HEADINGS = /(nice[- ]to[- ]haves?|preferred|bonus|good to have|a plus|advantage|desired|tercih|artı)/i;
const BENEFITS_HEADINGS = /(benefits|what we offer|we offer|perks|compensation|salary|yan haklar|sunduğumuz)/i;
const CONTEXT_HEADINGS = /(responsibilities|what you(?:'ll| will)? do|the role|about (?:us|the company|the role|the team)|sorumluluklar|iş tanımı|biz kimiz)/i;
const HEADING_WORDS =
  "requirements?|qualifications?|preferred qualifications|preferred skills|must[- ]haves?|nice[- ]to[- ]haves?|bonus points?|what you(?:'ll| will)? (?:bring|need|do)|who you are|about you|responsibilities|key responsibilities|the role|benefits|what we offer|perks|compensation|aranan nitelikler|nitelikler|gereksinimler|sorumluluklar|iş tanımı|yan haklar";

interface Segment {
  kind: "required" | "preferred" | "context" | "benefits" | "none";
  text: string;
}

function segmentDescription(description: string): { segments: Segment[]; hasHeadings: boolean } {
  // Tek satıra sıkışmış metinlerde başlıkları ayrı satıra çek
  const normalized = description
    .replace(/\r\n?/g, "\n")
    .replace(new RegExp(`\\s*\\b(${HEADING_WORDS})\\s*:`, "gi"), "\n$1:\n");

  const segments: Segment[] = [];
  let current: Segment = { kind: "none", text: "" };
  let hasHeadings = false;

  for (const rawLine of normalized.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const isHeadingLine = line.length <= 70 && /[:：]?$/.test(line) && !/[.!?]$/.test(line);
    const stripped = line.replace(/[:：]\s*$/, "");
    let kind: Segment["kind"] | null = null;
    if (isHeadingLine) {
      if (PREFERRED_HEADINGS.test(stripped)) kind = "preferred";
      else if (REQUIRED_HEADINGS.test(stripped)) kind = "required";
      else if (BENEFITS_HEADINGS.test(stripped)) kind = "benefits";
      else if (CONTEXT_HEADINGS.test(stripped)) kind = "context";
    }
    if (kind) {
      if (current.text) segments.push(current);
      current = { kind, text: "" };
      hasHeadings = true;
    } else {
      current.text += line + "\n";
    }
  }
  if (current.text) segments.push(current);
  return { segments, hasHeadings };
}

const PREFERRED_CUES = /(nice to have|preferred|a plus|bonus|ideally|is an advantage|good to have|tercih|artı olarak|avantaj)/i;

/** Terimin ilandaki seviyesi: zorunlu bölümde geçiyorsa required; yalnızca tercih bölümü/ifadesinde ise preferred */
function levelOf(term: string, segments: Segment[], hasHeadings: boolean): RequirementLevel | null {
  let inRequired = false;
  let inPreferred = false;
  let inContext = false;
  let inFlat = false;
  for (const seg of segments) {
    if (seg.kind === "benefits") continue; // yan haklar/maaş bölümündeki sözcükler gereksinim sayılmaz
    if (!hasTerm(lc(seg.text), term)) continue;
    if (seg.kind === "required") inRequired = true;
    else if (seg.kind === "preferred") inPreferred = true;
    else if (seg.kind === "context") inContext = true;
    else inFlat = true;
  }
  if (!inRequired && !inPreferred && !inContext && !inFlat) return null;

  // Cümle düzeyinde "tercih" ifadesi
  const sentenceCueOnly = (() => {
    for (const seg of segments) {
      if (seg.kind === "benefits") continue;
      for (const sentence of seg.text.split(/(?<=[.!?])\s+|\n|•/)) {
        if (hasTerm(lc(sentence), term) && !PREFERRED_CUES.test(sentence)) return false;
      }
    }
    return true;
  })();

  if (inRequired) return "required";
  if (inPreferred) return "preferred";
  if (!hasHeadings) return sentenceCueOnly ? "preferred" : "required";
  // Başlıklı metinde yalnızca sorumluluk/tanıtım bölümünde geçen beceri: tercih edilen (hafif ağırlık)
  return inContext || inFlat ? "preferred" : null;
}

/** Sektör/alan sözcükleri: ilanda geçmesi "zorunlu" anlamına gelmez, en fazla tercih edilen sayılır */
const DOMAIN_TERMS = new Set(
  ["fintech", "payments", "banking", "insurance", "healthcare", "telecom", "logistics", "e-commerce", "marketplace", "saas", "b2b", "b2c", "d2c", "api", "sdk", "android", "ios"].map((t) => lc(t))
);

// ---------------------------------------------------------------------------
// Profil metni
// ---------------------------------------------------------------------------

function profileCorpus(profile: MasterProfile): string {
  const parts: string[] = [
    profile.targetTitle,
    profile.summary || "",
    ...(profile.skills || []),
    ...profile.coreExperience.flatMap((e) => [e.title, e.company, ...e.highlights, ...e.tools, ...e.technologies, ...e.fintechDomains]),
    profile.rawMarkdown || ""
  ];
  return lc(parts.filter(Boolean).join("\n"));
}

/** Terimin geçtiği satır (yoksa boş) — bağlam kontrolü yalnızca o satırla sınırlı kalır */
function lineContaining(text: string, term: string): string {
  const t = lc(term);
  for (const line of text.split(/\n/)) {
    if (lc(line).includes(t)) return line;
  }
  return "";
}

// ---------------------------------------------------------------------------
// Dil ve sertifika sözlükleri
// ---------------------------------------------------------------------------

const LANGUAGES: { id: string; names: string[]; profileNames: string[] }[] = [
  { id: "English", names: ["english"], profileNames: ["ingilizce", "english"] },
  { id: "German", names: ["german", "deutsch"], profileNames: ["almanca", "german", "deutsch"] },
  { id: "French", names: ["french", "français"], profileNames: ["fransizca", "french"] },
  { id: "Spanish", names: ["spanish", "español"], profileNames: ["ispanyolca", "spanish"] },
  { id: "Dutch", names: ["dutch", "nederlands"], profileNames: ["hollandaca", "dutch"] },
  { id: "Italian", names: ["italian", "italiano"], profileNames: ["italyanca", "italian"] },
  { id: "Portuguese", names: ["portuguese"], profileNames: ["portekizce", "portuguese"] },
  { id: "Arabic", names: ["arabic"], profileNames: ["arapca", "arabic"] },
  { id: "Russian", names: ["russian"], profileNames: ["rusca", "russian"] },
  { id: "Turkish", names: ["turkish", "türkçe", "turkce"], profileNames: ["turkce", "turkish"] }
];

const LANGUAGE_LEVEL_CUE = "fluent|fluency|native|proficien(?:t|cy)|advanced|business[- ]level|professional|c1|c2|b2|working knowledge|excellent|strong|akıcı|ileri|anadil";

const CERTIFICATIONS: { label: string; patterns: string[] }[] = [
  { label: "PMP", patterns: ["pmp", "project management professional"] },
  { label: "PRINCE2", patterns: ["prince2"] },
  { label: "Scrum sertifikası (CSM/PSM/CSPO)", patterns: ["csm", "cspo", "psm", "pspo", "certified scrum", "professional scrum"] },
  { label: "SAFe sertifikası", patterns: ["safe agilist", "safe certified", "safe 6"] },
  { label: "ITIL", patterns: ["itil"] },
  { label: "Six Sigma", patterns: ["six sigma"] },
  { label: "AWS sertifikası", patterns: ["aws certified", "aws certification"] },
  { label: "Azure sertifikası", patterns: ["azure certified", "azure certification", "az-900", "az-104"] },
  { label: "Google Cloud sertifikası", patterns: ["google cloud certified", "gcp certification"] },
  { label: "CISSP", patterns: ["cissp"] },
  { label: "CPA / CFA / ACCA", patterns: ["cpa", "cfa", "acca"] }
];

// ---------------------------------------------------------------------------
// Ana fonksiyon
// ---------------------------------------------------------------------------

export function assessRequirements(description: string, profile: MasterProfile): RequirementReport {
  const empty: RequirementReport = { assessed: false, score: null, requirements: [], matched: [], missingRequired: [], missingPreferred: [], criticalMissing: [] };
  const desc = (description || "").trim();
  if (desc.length < 80) return empty;

  const { segments, hasHeadings } = segmentDescription(desc);
  const descLc = lc(desc);
  const corpus = profileCorpus(profile);
  const reqs: Requirement[] = [];

  // 1) Beceri / araç
  const certPatterns = CERTIFICATIONS.flatMap((c) => c.patterns);
  for (const skill of SKILL_DICTIONARY) {
    if (!hasTerm(descLc, skill)) continue;
    if (certPatterns.includes(lc(skill))) continue; // sertifika olarak ayrıca değerlendirilir
    const found = levelOf(skill, segments, hasHeadings);
    if (!found) continue;
    const level: RequirementLevel = DOMAIN_TERMS.has(lc(skill)) ? "preferred" : found;
    const met = hasTerm(corpus, skill);
    reqs.push({ kind: "skill", label: skill, level, met, critical: false });
  }

  // 2) Deneyim yılı
  const yearsRe = /(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:years?|yrs?|yıl)(?:['’]?s)?\s+(?:of\s+|in\s+|with\s+)?(?:[\p{L}/&-]+\s+){0,5}?(?:experience|deneyim|tecrübe)/giu;
  const yearsFound: number[] = [];
  let ym: RegExpExecArray | null;
  while ((ym = yearsRe.exec(desc))) {
    const n = parseInt(ym[1], 10);
    if (n >= 1 && n <= 25) yearsFound.push(n);
  }
  const trYears = desc.match(/en az\s*(\d{1,2})\s*yıl/i);
  if (trYears) yearsFound.push(parseInt(trYears[1], 10));
  if (yearsFound.length > 0) {
    const need = Math.max(...yearsFound);
    const have = profile.yearsOfExperience || 0;
    const shortfall = need - have;
    reqs.push({
      kind: "years",
      label: `${need}+ yıl deneyim`,
      level: "required",
      met: shortfall <= 0,
      // En az 2 yıllık fark kritik; 1 yıl fark zorunlu ama kritik değil
      critical: shortfall >= 2,
      detail: shortfall > 0 ? `İlan ${need}+ yıl istiyor; profilinizde ${have} yıl var` : undefined
    });
  }

  // 3) Sertifikalar
  for (const cert of CERTIFICATIONS) {
    const hit = cert.patterns.find((p) => hasTerm(descLc, p));
    if (!hit) continue;
    const level = levelOf(hit, segments, hasHeadings) || "preferred";
    const met = cert.patterns.some((p) => hasTerm(corpus, p));
    const certLine = lineContaining(desc, hit);
    const mandatory = /(required|must|mandatory|zorunlu|şart)/i.test(certLine);
    reqs.push({ kind: "cert", label: cert.label, level, met, critical: level === "required" && mandatory });
  }

  // 4) Diller
  const profileLangs = (profile.languages || []).map((l) => lc(l.language));
  for (const lang of LANGUAGES) {
    const nameRe = lang.names.map((n) => esc(lc(n))).join("|");
    const cue = new RegExp(`(?:(?:${LANGUAGE_LEVEL_CUE})\\s+(?:in\\s+|level\\s+)?(?:${nameRe})|(?:${nameRe})\\s*(?:\\(|:|-|–|,)?\\s*(?:${LANGUAGE_LEVEL_CUE})|(?:${nameRe})\\s+(?:is\\s+)?(?:required|a must|mandatory|zorunlu))`, "iu");
    if (!cue.test(descLc)) continue;
    if (lang.id === "Turkish" && /^(türkiye|turkey|türkiye)/i.test(profile.currentLocation || "")) continue;
    // Yalnızca profilde dil bilgisi varsa karşılaştırılır
    const known = profileLangs.length > 0;
    const met: boolean | "unknown" = known ? lang.profileNames.some((p) => profileLangs.some((pl) => pl.includes(p))) : "unknown";
    const context = lineContaining(desc, lang.names[0]) || lineContaining(desc, lang.names[lang.names.length - 1]);
    const preferred = PREFERRED_CUES.test(context) || /(?:\ba plus\b|\badvantage\b)/i.test(context);
    reqs.push({
      kind: "language",
      label: `${lang.id} dili`,
      level: preferred ? "preferred" : "required",
      met,
      critical: !preferred && met === false
    });
  }

  if (reqs.length === 0) return empty;

  const weight = (r: Requirement) => {
    if (r.kind === "years") return 4;
    if (r.kind === "cert") return r.level === "required" ? 4 : 1;
    if (r.kind === "language") return r.level === "required" ? 4 : 1;
    return r.level === "required" ? 3 : 1;
  };
  const assessable = reqs.filter((r) => r.met !== "unknown");
  const total = assessable.reduce((a, r) => a + weight(r), 0);
  const metW = assessable.filter((r) => r.met === true).reduce((a, r) => a + weight(r), 0);
  const score = total > 0 ? Math.round((metW / total) * 100) : null;

  return {
    assessed: total > 0,
    score,
    requirements: reqs,
    matched: reqs.filter((r) => r.met === true),
    missingRequired: reqs.filter((r) => r.met === false && r.level === "required"),
    missingPreferred: reqs.filter((r) => r.met === false && r.level === "preferred"),
    criticalMissing: reqs.filter((r) => r.met === false && r.critical)
  };
}
