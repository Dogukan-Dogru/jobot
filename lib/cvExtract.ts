/**
 * CV dosyasından düz metin çıkarımı — tamamen tarayıcıda. Dosya hiçbir sunucuya gönderilmez.
 */

export const MAX_CV_BYTES = 8 * 1024 * 1024;

export async function extractCvText(file: File): Promise<string> {
  if (file.size > MAX_CV_BYTES) {
    throw new Error("Dosya çok büyük (en fazla 8 MB).");
  }
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
    return await file.text();
  }

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser");
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  }

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // Satır sonlarını y koordinatından yeniden kur
      // Not: Türkçe harfler (ş, ğ, İ vb.) çoğu PDF'te ayrı metin parçası olarak gelir.
      // Boşluğu parçalar arasındaki gerçek yatay mesafeye göre koyuyoruz, aksi halde "geli ş tirdi" olur.
      let lastY: number | null = null;
      let prevEnd: number | null = null;
      let line = "";
      const out: string[] = [];
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const t = item.transform as number[];
        const x = t[4];
        const y = Math.round(t[5]);
        const fontSize = Math.abs(t[0]) || item.height || 10;
        if (lastY !== null && Math.abs(y - lastY) > 2) {
          out.push(line);
          line = "";
          prevEnd = null;
        }
        const gap = prevEnd === null ? 0 : x - prevEnd;
        const needsSpace = line !== "" && gap > fontSize * 0.2 && !line.endsWith(" ") && !item.str.startsWith(" ");
        line += (needsSpace ? " " : "") + item.str;
        prevEnd = x + (item.width || 0);
        lastY = y;
      }
      if (line) out.push(line);
      pages.push(out.join("\n"));
    }
    return pages.join("\n\n").normalize("NFC");
  }

  if (name.endsWith(".doc")) {
    throw new Error("Eski .doc biçimi desteklenmiyor. Lütfen PDF veya DOCX olarak kaydedip yükleyin.");
  }
  throw new Error("Desteklenmeyen dosya türü. PDF, DOCX veya TXT yükleyin.");
}
