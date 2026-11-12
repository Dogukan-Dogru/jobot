import { canonicalCountry, countryMatchesTargets, detectCountry } from "@/lib/geo";

/**
 * "Worldwide remote" iddiasını doğrular. Yalnızca ilan sitesinin "Worldwide" etiketine güvenmez:
 * ilan metnindeki açık kanıtları (anywhere / EOR / Deel / küresel işe alım) ve kısıtları
 * (çalışma izni, ikamet, bölge/ülke, saat dilimi) ayrı ayrı toplar.
 *
 * Durumlar:
 *  - confirmed : metinde açık küresel çalışma kanıtı var, kısıt yok
 *  - likely    : yalnızca konum etiketi "Worldwide/Anywhere" diyor; metinde açık kanıt yok (doğrulanamadı)
 *  - unverified: uzaktan ama coğrafi kapsam belirtilmemiş
 *  - restricted: ülke/bölge/çalışma izni/ikamet kısıtı var (aday konumunu kapsamıyor)
 *  - not_remote: hibrit/ofis
 */

export type RemoteStatus = "confirmed" | "likely" | "unverified" | "restricted" | "not_remote";

export interface RemoteVerification {
  status: RemoteStatus;
  /** Küresel çalışmayı destekleyen kanıtlar */
  evidence: string[];
  /** Adayı dışlayan kesin kısıtlar */
  restrictions: string[];
  /** Dikkat edilmesi gereken yumuşak kısıtlar (ör. saat dilimi) */
  cautions: string[];
  summary: string;
}

export interface RemoteVerificationInput {
  title: string;
  location: string;
  country: string;
  description: string;
  workModel: string;
  /** Adayın ikamet ülkesi (ör. "Türkiye") */
  home: string;
  hybridOrOnsite: boolean;
  /** İlan vize/relokasyon sağlıyorsa çalışma izni şartı kısıt sayılmaz */
  sponsorshipOffered: boolean;
}

function snippet(text: string, index: number, len: number, max = 70): string {
  const start = Math.max(0, index - 10);
  return text.slice(start, Math.min(text.length, index + len + 20)).replace(/\s+/g, " ").trim().slice(0, max);
}

/** Kısıt ifadesindeki ülke/bölge, adayın ikamet ülkesini kapsıyor mu? null: anlaşılamadı */
function lockCoversHome(tokenRaw: string, home: string): boolean | null {
  const token = tokenRaw.toLowerCase().replace(/\s+/g, " ").trim().replace(/^the /, "");
  if (!token) return null;
  if (!home) return false;
  if (/^(eu|european union|eea)$/.test(token)) return countryMatchesTargets(home, ["European Union (EU)"]);
  if (/^(europe|emea|european)$/.test(token)) return countryMatchesTargets(home, ["Europe"]);
  if (/^(us|usa|u\.s\.a?\.?|united states|america|us only)$/.test(token)) return canonicalCountry(home) === "United States";
  if (/^(north america|americas)$/.test(token)) return ["United States", "Canada"].includes(canonicalCountry(home) || "");
  if (/^(latam|latin america|apac|asia|asia pacific|africa|oceania)$/.test(token)) return false;
  if (/(time ?zone|your|location|country|region|office|city)/.test(token)) return null;
  const canon = canonicalCountry(token) || detectCountry(token);
  if (canon) return canon === (canonicalCountry(home) || home);
  return null;
}

const WORLDWIDE_TOKENS = /\b(world|worldwide|globe|global|anywhere|countries|country you|any country|all countries)\b/i;

const STRONG_EVIDENCE: { re: RegExp; label: string }[] = [
  // "work from anywhere in your home country / in Europe / in the US" bir kısıttır, kanıt değildir
  { re: /work(?:ing)? from anywhere(?!\s+(?:in|within)\s+(?:your|the|a|an|europe|emea|us|usa|uk|eu|canada|north america|[a-z]+\s+(?:only|region|country|state)))/i, label: "\"work from anywhere\" ifadesi" },
  { re: /anywhere in the world/i, label: "\"anywhere in the world\" ifadesi" },
  { re: /(?:hire|hiring|recruit\w*|employ\w*)\s+(?:talent\s+|people\s+|team members\s+)?(?:globally|worldwide|around the world|across the globe|in (?:over |more than )?\d+\+? countries)/i, label: "küresel işe alım ifadesi" },
  { re: /(?:open to|accepting|welcome|considering)\s+(?:candidates|applicants|applications)\s+(?:from\s+)?(?:anywhere|worldwide|all countries|any country|around the world)/i, label: "adaylar dünyanın her yerinden kabul ediliyor" },
  { re: /(?:fully )?(?:distributed|remote)(?:-first)? (?:team )?(?:across|around|in|spanning) (?:the )?(?:world|globe|\d+\+? countries)/i, label: "dünya çapında dağıtık ekip ifadesi" },
  { re: /(?:work|located|live|based) (?:in|from) any (?:country|timezone|time zone)/i, label: "herhangi bir ülkeden çalışma ifadesi" },
  { re: /\b(?:deel|remote\.com|oyster hr|papaya global|velocity global|globalization partners)\b/i, label: "EOR sağlayıcısı (Deel vb.) belirtilmiş" },
  { re: /\b(?:employer of record|eor)\b/i, label: "Employer of Record (EOR) belirtilmiş" },
  { re: /(?:remote|location)[^.\n]{0,25}\b(?:worldwide|global|anywhere(?!\s+(?:in|within)\s+(?:your|the|a|an|europe|emea|us|usa|uk|eu|canada|north america)\b))\b/i, label: "metinde \"remote – worldwide/anywhere\" ifadesi" },
  { re: /\b(?:worldwide|global)\s+remote\b/i, label: "metinde \"worldwide remote\" ifadesi" }
];

/** Zayıf ama destekleyici: bağımsız yüklenici modeli */
const CONTRACTOR_RE = /(?:independent contractor|contractor basis|contract basis|b2b contract|as a contractor)/i;

export function verifyWorldwideRemote(input: RemoteVerificationInput): RemoteVerification {
  const desc = input.description || "";
  const lower = desc.toLowerCase();
  const geo = `${input.location} ${input.country}`.toLowerCase();
  const home = input.home || "";
  const evidence: string[] = [];
  const restrictions: string[] = [];
  const cautions: string[] = [];

  if (input.hybridOrOnsite) {
    return {
      status: "not_remote",
      evidence,
      restrictions,
      cautions,
      summary: "İlan hibrit/ofis çalışma gerektiriyor; worldwide remote değil."
    };
  }

  // ---- Kısıtlar -----------------------------------------------------------
  const addRestriction = (token: string, text: string, kind: string) => {
    const covers = lockCoversHome(token, home);
    if (covers === true) return;
    if (covers === false) restrictions.push(`${kind}: "${text}"`);
    else cautions.push(`${kind} (anlaşılamadı, kontrol edin): "${text}"`);
  };

  // 1) Çalışma izni şartı (vize sponsorluğu varsa kısıt sayılmaz)
  if (!input.sponsorshipOffered) {
    const authRe = /(?:authori[sz]ed|eligible|legally (?:entitled|able|permitted)|(?:legal )?right) to work (?:in|within) (?:the )?([a-z][a-z .]{1,30}?)(?=\s+(?:without|and|or|with|on)\b|[.,;:)\n]|$)/gi;
    let m: RegExpExecArray | null;
    while ((m = authRe.exec(desc))) addRestriction(m[1], snippet(desc, m.index, m[0].length), "Çalışma izni şartı");
    if (/(?:us|u\.s\.) citizen|security clearance|green card/i.test(desc) && lockCoversHome("us", home) !== true) {
      restrictions.push("ABD vatandaşlığı / güvenlik yetkisi (clearance) şartı");
    }
  }

  // 2) İkamet / bulunma şartı
  const residRe = /(?:must|should|need to|required to|have to)\s+(?:currently\s+|already\s+)?(?:be\s+)?(?:based|located|reside|resident|residing|living|live)\s+(?:in|within)\s+(?:the\s+)?([a-z][a-z .,-]{1,40}?)(?=\s+(?:to|and|with|for)\b|[.;:)\n]|$)/gi;
  let rm: RegExpExecArray | null;
  while ((rm = residRe.exec(desc))) {
    const token = rm[1].split(/,| or /)[0];
    if (WORLDWIDE_TOKENS.test(token)) continue;
    addRestriction(token, snippet(desc, rm.index, rm[0].length), "İkamet şartı");
  }
  const residentsRe = /(?:residents?|citizens?) of (?:the )?([a-z][a-z .]{1,30}?)(?=\s+only|[.,;:)\n]|$)/gi;
  while ((rm = residentsRe.exec(desc))) addRestriction(rm[1], snippet(desc, rm.index, rm[0].length), "İkamet/vatandaşlık şartı");

  // 3) "Remote within/from/in X" ve "X only / X-based"
  const remoteInRe = /remote\s*(?:\(|-|–|:|from|within|in|across)\s*(?:the\s+)?([a-z][a-z .&/]{1,28}?)(?=\s+only\b|[).,;\n]|$| - | – )/gi;
  while ((rm = remoteInRe.exec(desc))) {
    const token = rm[1].trim();
    if (WORLDWIDE_TOKENS.test(token) || /^(first|only|friendly|work|position|role|team|company)/i.test(token)) continue;
    addRestriction(token, snippet(desc, rm.index, rm[0].length), "Bölge/ülke kısıtı");
  }
  const onlyRe = /\b(us|usa|u\.s\.|uk|eu|emea|latam|apac|canada|north america|americas|europe)[- ](?:only|based(?: candidates| applicants)?|residents)\b/gi;
  while ((rm = onlyRe.exec(desc))) addRestriction(rm[1], snippet(desc, rm.index, rm[0].length), "Bölge/ülke kısıtı");

  // 4) Konum alanı (başlık/konum) "Remote - US", "Remote (EU)", "Germany" gibi kısıtlar
  const geoTokens = Array.from(geo.matchAll(/\b(us|usa|uk|eu|emea|europe|latam|apac|north america|americas)\b/g)).map((x) => x[1]);
  const geoCountry = detectCountry(`${input.location} ${input.country}`);
  if (geoCountry) geoTokens.push(geoCountry.toLowerCase());
  for (const t of geoTokens) addRestriction(t, `konum alanı: ${input.location || input.country}`, "Konum kısıtı");

  // 5) Saat dilimi (yumuşak kısıt)
  const tzRe = /(?:overlap(?:ping)? (?:with|of)|working hours|work(?:ing)? in|within|(?:in|during)\s+(?:the\s+)?)\s*(?:the\s+)?((?:pst|pt|est|et|cst|ct|mst|cet|eet|gmt|utc)[\w\s:+-]{0,14}|(?:us|north american|european|asia)[a-z ]{0,10}time ?zones?|(?:pacific|eastern|central|mountain)[a-z ]{0,10}time)/gi;
  const tzAbbrRe = /\b(?:pst|pdt|est|edt|cst|cdt|mst|pt|et|ct|cet|eet|utc[+-]?\d*|gmt[+-]?\d*)\b[\s-]*(?:time ?zone|overlap|hours|business hours|working hours)/gi;
  const utcRange = /\b(?:utc|gmt)\s*[-+]\s*\d{1,2}(?:\s*(?:to|-|–)\s*(?:utc|gmt)?\s*[-+]?\s*\d{1,2})?/i;
  let tzMatch: RegExpExecArray | null;
  const seenTz = new Set<string>();
  while ((tzMatch = tzRe.exec(desc))) {
    const s = snippet(desc, tzMatch.index, tzMatch[0].length);
    if (!seenTz.has(s)) {
      seenTz.add(s);
      cautions.push(`Saat dilimi beklentisi: "${s}"`);
    }
  }
  let abbr: RegExpExecArray | null;
  while ((abbr = tzAbbrRe.exec(desc))) {
    const sn = snippet(desc, abbr.index, abbr[0].length);
    if (!seenTz.has(sn)) {
      seenTz.add(sn);
      cautions.push(`Saat dilimi beklentisi: "${sn}"`);
    }
  }
  const utcM = desc.match(utcRange);
  if (utcM && !seenTz.has(utcM[0])) cautions.push(`Saat dilimi aralığı: "${utcM[0].trim()}"`);

  // ---- Kanıtlar ------------------------------------------------------------
  for (const ev of STRONG_EVIDENCE) {
    const m = ev.re.exec(desc);
    if (m) evidence.push(`${ev.label}: "${snippet(desc, m.index, m[0].length)}"`);
  }
  // Adayın ülkesinin açıkça kabul edildiği ifadeler
  const homeNames = /^(türkiye|turkey|turkiye)$/i.test(home) ? ["türkiye", "turkey"] : home ? [home.toLowerCase()] : [];
  for (const hn of homeNames) {
    const re = new RegExp(`${hn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^.\\n]{0,50}(?:eligible|welcome|supported|can apply|open to|hire|hiring)|(?:eligible|welcome|supported|hire|hiring|open to)[^.\\n]{0,40}${hn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
    const m = re.exec(desc);
    if (m) evidence.push(`${home} açıkça kabul ediliyor: "${snippet(desc, m.index, m[0].length)}"`);
  }
  if (CONTRACTOR_RE.test(desc)) cautions.push("Bağımsız yüklenici (contractor) modeli belirtilmiş: iş sözleşmesi/yan haklar farklı olabilir");

  const labelWorldwide = /\b(worldwide|anywhere|global)\b/.test(geo);

  // ---- Karar ---------------------------------------------------------------
  if (restrictions.length > 0) {
    return {
      status: "restricted",
      evidence,
      restrictions,
      cautions,
      summary: `İlan uzaktan görünse de kısıt içeriyor: ${restrictions[0]}. Worldwide remote değil.`
    };
  }
  if (evidence.length > 0) {
    return {
      status: "confirmed",
      evidence,
      restrictions,
      cautions,
      summary: `İlan metninde küresel çalışmayı destekleyen açık ifade var (${evidence.length} kanıt) ve adayı dışlayan kısıt bulunmadı.${cautions.length ? " Ancak dikkat edilecek noktalar var." : ""}`
    };
  }
  if (labelWorldwide) {
    return {
      status: "likely",
      evidence: [`Konum alanı "${input.location || input.country}" diyor (ilan sitesinin etiketi)`],
      restrictions,
      cautions,
      summary: "Konum etiketi worldwide/anywhere diyor, ancak ilan metninde bunu doğrulayan açık bir ifade (anywhere, EOR/Deel, küresel işe alım) yok. Doğrulanamadı: başvurmadan önce işverene sorun."
    };
  }
  if (input.workModel === "remote" || /\bremote|uzaktan\b/.test(lower)) {
    return {
      status: "unverified",
      evidence,
      restrictions,
      cautions,
      summary: "İlan uzaktan çalışmaya izin veriyor ancak coğrafi kapsam belirtilmemiş; konumunuzdan çalışılabildiği kanıtlanamadı."
    };
  }
  return { status: "not_remote", evidence, restrictions, cautions, summary: "İlanda uzaktan çalışma bilgisi bulunamadı." };
}
