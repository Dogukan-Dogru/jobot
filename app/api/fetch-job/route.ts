import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Geçerli bir URL giriniz" }, { status: 400 });
    }

    let platform: "linkedin" | "kariyer" | "indeed" | "wellfound" | "remoteok" | "other" = "other";
    if (url.includes("linkedin.com")) platform = "linkedin";
    else if (url.includes("kariyer.net")) platform = "kariyer";
    else if (url.includes("indeed.com")) platform = "indeed";
    else if (url.includes("wellfound.com") || url.includes("angel.co")) platform = "wellfound";
    else if (url.includes("remoteok.com")) platform = "remoteok";

    // Attempt to fetch open public job pages
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
        },
        signal: AbortSignal.timeout(6000)
      });

      if (response.ok) {
        const html = await response.text();
        
        // Extract <title>
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        let extractedTitle = titleMatch ? titleMatch[1].trim() : "";
        
        // Clean title
        extractedTitle = extractedTitle
          .replace(/\|.*$/g, "")
          .replace(/- LinkedIn.*$/i, "")
          .replace(/- Kariyer.net.*$/i, "")
          .trim();

        // Extract meta description
        const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                          html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
        const metaDesc = metaMatch ? metaMatch[1].trim() : "";

        return NextResponse.json({
          success: true,
          platform,
          suggestedTitle: extractedTitle,
          suggestedDescription: metaDesc,
          message: "İlan bilgileri bağlantıdan kısmen ayrıştırıldı. Detaylı analiz için ilan metnini kontrol ediniz."
        });
      }
    } catch {
      // Network or timeout error
    }

    return NextResponse.json({
      success: true,
      platform,
      suggestedTitle: "",
      suggestedDescription: "",
      message: `${platform.toUpperCase()} ilanlarında bot koruması olabileceği için ilan metnini kopyalayıp doğrudan yapıştırmanız en doğru sonucu verir.`
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: "URL okunamadı", details: String(err) }, { status: 500 });
  }
}
