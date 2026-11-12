/**
 * İlan sayfasından ilan metnini (görev tanımı, nitelikler) çeker. Yalnızca sunucu tarafında kullanılır.
 * Bölüm/madde yapısını korumak için HTML satır sonlarına çevrilir (gereksinim çıkarımı bunu kullanır).
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

/** HTML -> düz metin (satır sonları ve madde işaretleri korunur) */
export function htmlToStructuredText(html: string): string {
  if (!html) return "";
  // Bazı API'ler HTML'i kaçışlı (&lt;br&gt;) döndürür: etiketleri ayrıştırmadan önce çöz
  if (/&lt;\/?[a-z][^&]*&gt;/i.test(html)) html = decodeEntities(html);
  const text = decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|ul|ol|section|tr)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n• ")
      .replace(/<\/li>/gi, "")
      .replace(/<[^>]*>/g, " ")
  );
  return text
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, 8000);
}

function linkedinJobId(url: string): string | null {
  const m = url.match(/linkedin\.com\/jobs\/view\/(?:[^/?#]*-)?(\d{6,})/i) || url.match(/[?&]currentJobId=(\d{6,})/i);
  return m ? m[1] : null;
}

async function getHtml(url: string, timeoutMs: number): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9,tr;q=0.8" },
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function fromJsonLd(html: string): string {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    try {
      const data = JSON.parse(b[1]);
      const list = Array.isArray(data) ? data : data["@graph"] ? data["@graph"] : [data];
      for (const item of list) {
        if (item && /JobPosting/i.test(String(item["@type"])) && typeof item.description === "string") {
          return htmlToStructuredText(item.description);
        }
      }
    } catch {
      // geçersiz JSON-LD: sonrakine bak
    }
  }
  return "";
}

/** İlan bağlantısından tam ilan metni; bulunamazsa boş string */
export async function fetchJobDescription(url: string, timeoutMs = 5000): Promise<string> {
  if (!url) return "";

  if (/linkedin\.com/i.test(url)) {
    const id = linkedinJobId(url);
    if (id) {
      const html = await getHtml(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`, timeoutMs);
      if (html) {
        const m = html.match(/<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (m) {
          const text = htmlToStructuredText(m[1]);
          if (text.length > 100) return text;
        }
      }
    }
  }

  const html = await getHtml(url, timeoutMs);
  if (!html) return "";
  const ld = fromJsonLd(html);
  if (ld.length > 100) return ld;
  const meta = html.match(/<meta\s+(?:name|property)=["'](?:og:)?description["']\s+content=["']([^"']+)["']/i);
  return meta ? decodeEntities(meta[1]).trim() : "";
}
