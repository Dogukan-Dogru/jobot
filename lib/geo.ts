/**
 * Ülke / bölge / şehir yardımcıları. Saf fonksiyonlar; hem tarayıcıda hem sunucuda çalışır.
 * Hedef ülke seçimi, ikamet ülkesi ayrıştırma ve ilan konumundan ülke tespiti için kullanılır.
 */

interface CountryEntry {
  name: string; // Gösterim / kanonik ad (İngilizce, Türkiye hariç)
  aliases: string[];
  cities: string[];
  eu?: boolean;
  europe?: boolean;
}

const COUNTRY_DB: CountryEntry[] = [
  { name: "Türkiye", aliases: ["turkey", "türkiye", "turkiye", "tr"], cities: ["istanbul", "ankara", "izmir", "bursa", "antalya", "adana", "konya", "gaziantep", "kocaeli"], europe: true },
  { name: "United States", aliases: ["united states", "usa", "u.s.", "u.s.a.", "us", "america"], cities: ["new york", "san francisco", "los angeles", "seattle", "austin", "boston", "chicago", "san jose", "washington"] },
  { name: "United Kingdom", aliases: ["united kingdom", "uk", "u.k.", "england", "scotland", "wales", "great britain"], cities: ["london", "manchester", "edinburgh", "birmingham", "bristol", "cambridge"], europe: true },
  { name: "Germany", aliases: ["germany", "deutschland", "almanya"], cities: ["berlin", "munich", "münchen", "hamburg", "frankfurt", "cologne", "köln", "stuttgart", "düsseldorf"], eu: true, europe: true },
  { name: "France", aliases: ["france", "fransa"], cities: ["paris", "lyon", "marseille", "toulouse"], eu: true, europe: true },
  { name: "Netherlands", aliases: ["netherlands", "the netherlands", "holland", "hollanda"], cities: ["amsterdam", "rotterdam", "utrecht", "eindhoven", "the hague"], eu: true, europe: true },
  { name: "Spain", aliases: ["spain", "españa", "ispanya"], cities: ["madrid", "barcelona", "valencia", "seville"], eu: true, europe: true },
  { name: "Portugal", aliases: ["portugal", "portekiz"], cities: ["lisbon", "lisboa", "porto"], eu: true, europe: true },
  { name: "Ireland", aliases: ["ireland", "irlanda"], cities: ["dublin", "cork"], eu: true, europe: true },
  { name: "Belgium", aliases: ["belgium", "belçika"], cities: ["brussels", "antwerp"], eu: true, europe: true },
  { name: "Denmark", aliases: ["denmark", "danimarka"], cities: ["copenhagen"], eu: true, europe: true },
  { name: "Sweden", aliases: ["sweden", "isveç"], cities: ["stockholm", "gothenburg", "malmö"], eu: true, europe: true },
  { name: "Norway", aliases: ["norway", "norveç"], cities: ["oslo"], europe: true },
  { name: "Finland", aliases: ["finland", "finlandiya"], cities: ["helsinki"], eu: true, europe: true },
  { name: "Switzerland", aliases: ["switzerland", "isviçre"], cities: ["zurich", "geneva", "basel"], europe: true },
  { name: "Austria", aliases: ["austria", "avusturya"], cities: ["vienna", "wien"], eu: true, europe: true },
  { name: "Italy", aliases: ["italy", "italya", "italia"], cities: ["rome", "milan", "turin"], eu: true, europe: true },
  { name: "Poland", aliases: ["poland", "polonya"], cities: ["warsaw", "krakow", "wroclaw"], eu: true, europe: true },
  { name: "Romania", aliases: ["romania", "romanya"], cities: ["bucharest"], eu: true, europe: true },
  { name: "Greece", aliases: ["greece", "yunanistan"], cities: ["athens"], eu: true, europe: true },
  { name: "Czechia", aliases: ["czechia", "czech republic", "çekya"], cities: ["prague"], eu: true, europe: true },
  { name: "Cyprus", aliases: ["cyprus", "kıbrıs"], cities: ["nicosia", "limassol"], eu: true, europe: true },
  { name: "Canada", aliases: ["canada", "kanada"], cities: ["toronto", "vancouver", "montreal", "ottawa"] },
  { name: "Australia", aliases: ["australia", "avustralya"], cities: ["sydney", "melbourne", "brisbane", "perth"] },
  { name: "United Arab Emirates", aliases: ["united arab emirates", "uae", "birleşik arap emirlikleri"], cities: ["dubai", "abu dhabi"] },
  { name: "Singapore", aliases: ["singapore", "singapur"], cities: [] },
  { name: "India", aliases: ["india", "hindistan"], cities: ["bengaluru", "bangalore", "mumbai", "delhi", "hyderabad"] },
  { name: "Japan", aliases: ["japan", "japonya"], cities: ["tokyo", "osaka"] }
];

export const COUNTRY_OPTIONS: string[] = COUNTRY_DB.map((c) => c.name);

/** Bölge seçenekleri: hedef ülke listesine yazılabilir */
export const REGION_OPTIONS = ["Europe", "European Union (EU)", "Global Remote"];

export const TARGET_OPTIONS: string[] = [...COUNTRY_OPTIONS, ...REGION_OPTIONS];

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasWord(haystack: string, word: string): boolean {
  return new RegExp(`(^|[^\\p{L}0-9])${esc(word)}([^\\p{L}0-9]|$)`, "iu").test(haystack);
}

/** Verilen ad/takma ad/şehir için kanonik ülke adı (bulunamazsa null) */
export function canonicalCountry(input: string): string | null {
  const t = (input || "").trim().toLowerCase();
  if (!t) return null;
  for (const c of COUNTRY_DB) {
    if (c.name.toLowerCase() === t || c.aliases.some((a) => a === t)) return c.name;
  }
  return null;
}

/** Serbest metinden (ör. "Berlin, Germany (Hybrid)") ülke tespiti: önce ülke adı/takma adı, sonra şehir */
export function detectCountry(text: string): string | null {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return null;
  for (const c of COUNTRY_DB) {
    // Belirsiz kısa takma adlar ("us", "tr") serbest metinde aranmaz; yalnızca tam eşleşmede (canonicalCountry) kullanılır
    if (c.aliases.some((a) => a !== "us" && a !== "tr" && hasWord(t, a))) return c.name;
  }
  for (const c of COUNTRY_DB) {
    if (c.cities.some((city) => hasWord(t, city))) return c.name;
  }
  return null;
}

function isEurope(name: string): boolean {
  return Boolean(COUNTRY_DB.find((c) => c.name === name)?.europe);
}
function isEu(name: string): boolean {
  return Boolean(COUNTRY_DB.find((c) => c.name === name)?.eu);
}

/** Ülke, hedef listesindeki bir ülkeyle veya bölgeyle (Europe / EU) eşleşiyor mu? */
export function countryMatchesTargets(country: string, targets: string[]): boolean {
  const canon = canonicalCountry(country) || country;
  for (const raw of targets) {
    const t = raw.trim();
    if (!t) continue;
    if (/^global remote$|^worldwide$/i.test(t)) continue; // uzaktan tercih, ülke eşleşmesi değil
    if (/^europe$/i.test(t) && isEurope(canon)) return true;
    if (/^european union|^eu$/i.test(t) && isEu(canon)) return true;
    const tc = canonicalCountry(t) || t;
    if (tc.toLowerCase() === canon.toLowerCase()) return true;
  }
  return false;
}

/** "Türkiye (İstanbul)" -> { country: "Türkiye", city: "İstanbul" } */
export function parseLocation(value: string): { country: string; city: string } {
  const v = (value || "").trim();
  if (!v) return { country: "", city: "" };
  if (v.startsWith("(")) return { country: "", city: v.replace(/^\(|\)$/g, "").trim() };
  const m = v.match(/^([^()]+?)\s*\((.*)\)\s*$/);
  if (m) return { country: m[1].trim(), city: m[2].trim() };
  const comma = v.match(/^([^,]+),\s*(.+)$/);
  if (comma) {
    // "İstanbul, Türkiye" biçimi: sondaki parça ülke ise ona göre ayır
    const lastCountry = canonicalCountry(comma[2]);
    if (lastCountry) return { country: lastCountry, city: comma[1].trim() };
  }
  return { country: v, city: "" };
}

export function composeLocation(country: string, city: string): string {
  const c = country.trim();
  const y = city.trim();
  if (c && y) return `${c} (${y})`;
  if (c) return c;
  if (y) return `(${y})`;
  return "";
}

/** LinkedIn gibi sitelerin konum parametresi için ad */
export function toSearchLocation(target: string): string {
  const t = target.trim();
  if (/^europe$/i.test(t)) return "Europe";
  if (/^european union|^eu$/i.test(t)) return "European Union";
  const canon = canonicalCountry(t);
  if (canon === "Türkiye") return "Turkey";
  return canon || t;
}
