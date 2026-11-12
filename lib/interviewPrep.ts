import { InterviewRisk, MasterProfile } from "@/types";
import { Requirement, RequirementReport } from "@/lib/jobRequirements";

/**
 * Gereksinim eksiklerinden mülakat riskleri üretir: olası soru, dürüst strateji adımları,
 * profildeki gerçek deneyimlerden destekleyici kanıt ve örnek cevap taslağı.
 * Tamamen kural tabanlıdır; yalnızca profildeki bilgileri kullanır, uydurma deneyim eklemez.
 */

function lc(text: string): string {
  return text.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase().replace(/̇/g, "").replace(/ı/g, "i");
}

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

function hasTerm(haystack: string, term: string): boolean {
  return new RegExp(`(^|[^\\p{L}0-9])${esc(lc(term))}([^\\p{L}0-9]|$)`, "iu").test(haystack);
}

/** Bir becerinin yerine geçebilecek benzer araç/beceriler (kanıt köprüsü için) */
const RELATED: Record<string, string[]> = {
  jira: ["trello", "asana", "linear", "confluence"], trello: ["jira", "asana"], asana: ["jira", "trello"],
  mixpanel: ["amplitude", "google analytics", "tableau"], amplitude: ["mixpanel", "google analytics"], "google analytics": ["mixpanel", "amplitude"],
  tableau: ["power bi", "looker", "excel", "sql"], "power bi": ["tableau", "looker", "excel"], looker: ["tableau", "power bi", "sql"],
  python: ["javascript", "typescript", "sql", "java"], java: ["kotlin", "c#", "python"], "c#": ["java", ".net"], ".net": ["c#", "java"],
  javascript: ["typescript", "react", "node.js"], typescript: ["javascript", "react"], react: ["vue", "angular", "javascript"],
  vue: ["react", "angular"], angular: ["react", "vue"], kubernetes: ["docker", "aws", "azure"], docker: ["kubernetes"],
  aws: ["azure", "gcp"], azure: ["aws", "gcp"], gcp: ["aws", "azure"], scrum: ["agile", "kanban"], agile: ["scrum", "kanban"], kanban: ["agile", "scrum"],
  figma: ["sketch"], sketch: ["figma"], sql: ["postgresql", "mysql", "excel"], postgresql: ["mysql", "sql"], mysql: ["postgresql", "sql"],
  salesforce: ["hubspot"], hubspot: ["salesforce"], "user stories": ["prd", "backlog"], okr: ["kpi"], kpi: ["okr"]
};

const LANG_EN: Record<string, string> = {
  ingilizce: "English", türkçe: "Turkish", almanca: "German", fransizca: "French", ispanyolca: "Spanish", italyanca: "Italian",
  hollandaca: "Dutch", portekizce: "Portuguese", arapça: "Arabic", rusça: "Russian", japonca: "Japanese", çince: "Chinese"
};
const enLang = (name: string) => LANG_EN[lc(name)] || name;

function isTurkishText(text: string): boolean {
  const sample = (text || "").slice(0, 1500);
  const trChars = (sample.match(/[çğıöşüÇĞİÖŞÜ]/g) || []).length;
  const trWords = (sample.toLowerCase().match(/\b(ve|ile|için|deneyim|aranan|nitelikler|yıl|olan|bir)\b/g) || []).length;
  return trChars > 8 || trWords > 6;
}

interface Evidence {
  text: string;
  company: string;
  highlight: string;
}

function collectHighlights(profile: MasterProfile): Evidence[] {
  const out: Evidence[] = [];
  for (const e of profile.coreExperience) {
    for (const h of e.highlights) {
      const clean = h.trim();
      if (clean) out.push({ text: e.company ? `${e.company}: ${clean}` : clean, company: e.company, highlight: clean });
    }
  }
  return out;
}

function endWithPeriod(text: string): string {
  const t = text.trim();
  return /[.!?]$/.test(t) ? t : t + ".";
}

function pickEvidence(highlights: Evidence[], keywords: string[], limit = 2, used: Set<string> = new Set()): Evidence[] {
  if (highlights.length === 0) return [];
  const words = new Set(
    keywords
      .flatMap((k) => lc(k).split(/[^a-zçğıöşü0-9+#.]+/i))
      .filter((w) => w.length > 2)
  );
  const scored = highlights.map((h, idx) => {
    const hw = lc(h.highlight).split(/[^a-zçğıöşü0-9+#.]+/i);
    const overlap = hw.filter((w) => words.has(w)).length;
    const hasNumber = /\d/.test(h.highlight) ? 1 : 0;
    const reuse = used.has(h.highlight) ? 1.5 : 0;
    return { h, overlap, score: overlap * 3 + hasNumber * 2 - reuse - idx * 0.01 };
  });
  scored.sort((a, b) => b.score - a.score);
  const picked = scored.slice(0, limit).map((x) => x.h);
  picked.forEach((x) => used.add(x.highlight));
  return picked;
}

function profileCorpus(profile: MasterProfile): string {
  return lc(
    [
      profile.targetTitle,
      profile.summary || "",
      ...(profile.skills || []),
      ...profile.coreExperience.flatMap((e) => [e.title, ...e.highlights, ...e.tools, ...e.technologies, ...e.fintechDomains]),
      profile.rawMarkdown || ""
    ].join("\n")
  );
}

function severityOf(r: Requirement): InterviewRisk["severity"] {
  if (r.critical) return "high";
  if (r.kind === "years") return "medium";
  if ((r.kind === "cert" || r.kind === "language") && r.level === "required") return "high";
  return r.level === "required" ? "medium" : "low";
}

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

export function buildInterviewRisks(
  report: RequirementReport,
  profile: MasterProfile,
  job: { title: string; company: string; rawDescription: string }
): InterviewRisk[] {
  const tr = isTurkishText(job.rawDescription);
  const highlights = collectHighlights(profile);
  const corpus = profileCorpus(profile);
  const risks: InterviewRisk[] = [];
  const usedEvidence = new Set<string>();
  const displayName = (term: string) => (profile.skills || []).find((sk) => lc(sk) === lc(term)) || term;

  const missing = report.requirements.filter((r) => r.met === false);

  for (const r of missing) {
    const severity = severityOf(r);
    const evidence = pickEvidence(highlights, [r.label, job.title], r.kind === "skill" ? 1 : 2, usedEvidence);
    const evidenceText = evidence.map((e) => endWithPeriod(e.highlight)).join(" ");
    const label = r.label;

    let candidateExperience = "Profilinizde bu gereksinim için doğrudan karşılık görünmüyor";
    const gap = r.detail || `İlan ${label} istiyor; profilinizde belirtilmemiş`;
    let likelyQuestion = "";
    let sampleAnswer = "";
    let steps: string[] = [];
    let honestStrategy = "";

    if (r.kind === "years") {
      const have = profile.yearsOfExperience || 0;
      const need = parseInt(label, 10) || 0;
      candidateExperience = `Profilinizde toplam ${have} yıl deneyim görünüyor`;
      likelyQuestion = tr
        ? `Bu rol ${need}+ yıl deneyim istiyor, sizde ${have} yıl var. Bu seviyeye neden hazır olduğunuzu düşünüyorsunuz?`
        : `This role asks for ${need}+ years of experience and you have ${have}. Why do you think you're ready for this level?`;
      sampleAnswer = tr
        ? `Toplam ${have} yıllık deneyimim var; ancak süreden çok kapsama ve etkiye bakılmasını isterim.${evidenceText ? " Örneğin: " + evidenceText : ""} Bu seviyedeki sorumluluğu almaya hazırım.`
        : `I have ${have} years of experience, but I'd point to scope and impact rather than the number.${evidenceText ? " For example: " + evidenceText : ""} I'm ready to take on responsibility at this level.`;
      steps = [
        "Yıl farkını inkâr etmeyin; rakamı kendiniz söyleyin",
        "Yıl yerine sahip olduğunuz kapsamı, ekibi ve etkiyi öne çıkarın",
        "Mümkünse ölçülebilir bir sonuç/rakamla destekleyin",
        "Kısa sürede sorumluluk alma ve öğrenme hızınıza örnek verin"
      ];
      honestStrategy = "Deneyim yılı farkını açıkça kabul edip kapsam ve etkiye odaklanın; somut bir sonuçla destekleyin.";
    } else if (r.kind === "cert") {
      candidateExperience = "Profilinizde bu sertifika görünmüyor";
      likelyQuestion = tr ? `${label} sertifikanız var mı?` : `Do you hold ${label}?`;
      sampleAnswer = tr
        ? `Şu an ${label} sertifikam yok.${evidenceText ? " Gösterebileceğim ilgili deneyim: " + evidenceText : ""} Rol için önemliyse sertifikayı almaya açığım.`
        : `I don't hold ${label} yet.${evidenceText ? " Relevant experience I can point to: " + evidenceText : ""} If it matters for this role, I'm open to pursuing it.`;
      steps = [
        "Sertifikanın olmadığını net söyleyin",
        "Sertifikanın kapsadığı işi pratikte yaptığınız bir örnekle gösterin",
        "Gerekliyse edinme niyetinizi (sahte tarih vermeden) belirtin"
      ];
      honestStrategy = "Sertifikanız yoksa açıkça söyleyin; kapsadığı konudaki pratik deneyiminizi örnekleyin.";
    } else if (r.kind === "language") {
      const known = (profile.languages || []).map((l) => l.language).filter(Boolean);
      candidateExperience = known.length ? `Profilinizdeki diller: ${known.join(", ")}` : "Profilinizde bu dil görünmüyor";
      likelyQuestion = tr ? `Bu rol ${label.replace(" dili", "")} gerektiriyor. Seviyeniz nedir?` : `This role requires ${label.replace(" dili", "")}. What is your level?`;
      sampleAnswer = tr
        ? `${label.replace(" dili", "")} dilinde profesyonel çalışma seviyem yok.${known.length ? " İş hayatında " + known.join(", ") + " kullanıyorum." : ""} Bu konuda dürüst olmak isterim; geliştirmek için zamana ihtiyacım olur.`
        : `I don't currently work professionally in ${label.replace(" dili", "")}.${known.length ? " I work daily in " + known.map(enLang).join(", ") + "." : ""} I'd rather be upfront about that; it would take time to build.`;
      steps = [
        "Seviyenizi abartmadan, net söyleyin",
        "Çalışabildiğiniz dilleri ve bu dillerde yürüttüğünüz işleri belirtin",
        "Dilin gerçekten zorunlu olup olmadığını sorarak netleştirin"
      ];
      honestStrategy = "Dil seviyenizi abartmayın; çalışabildiğiniz dillerle yürüttüğünüz işleri belirtip dilin ne kadar kritik olduğunu sorun.";
    } else {
      // beceri / araç
      const relatedTerms = (RELATED[lc(label)] || []).filter((t) => hasTerm(corpus, t));
      const related = relatedTerms.slice(0, 2).map(displayName).join(", ");
      candidateExperience = related ? `Doğrudan ${label} deneyimi görünmüyor; en yakın: ${related}` : `Profilinizde ${label} deneyimi görünmüyor`;
      likelyQuestion = tr
        ? `Profilinizde ${label} görünmüyor. ${label} veya benzeri araçlarla nasıl çalıştınız?`
        : `Your background doesn't mention ${label}. How have you worked with ${label}, or tools like it?`;
      const bridge = related ? (tr ? `En yakın deneyimim ${related}.` : `The closest I've used is ${related}.`) : "";
      sampleAnswer = tr
        ? `${label} aracını doğrudan kullanmadım. ${bridge}${evidenceText ? " Gösterebileceğim ilgili deneyim: " + evidenceText : ""} Kavramlar aktarılabilir olduğundan ilk haftalarda hızla uyum sağlayabilirim.`
        : `I haven't used ${label} directly. ${bridge}${evidenceText ? " Relevant experience I can point to: " + evidenceText : ""} Since the concepts transfer, I expect to ramp up on it quickly in the first weeks.`;
      steps = [
        "Doğrudan deneyiminiz olmadığını açıkça söyleyin",
        related ? `Benzer araç deneyiminiz (${related}) üzerinden köprü kurun` : "En yakın ilgili deneyiminizi anlatın",
        "Somut bir sonuç/örnek verin",
        "İlk haftalarda nasıl hızlanacağınızı kısaca anlatın"
      ];
      honestStrategy = `Doğrudan ${label} deneyiminiz yoksa söyleyin; ${related ? related + " gibi benzer araç" : "ilgili"} deneyiminizi somut bir sonuçla örnekleyin ve hızlı uyum planınızı belirtin.`;
    }

    risks.push({
      requirement: `${label}${r.level === "required" ? " (zorunlu)" : " (tercih edilen)"}`,
      candidateExperience,
      gap,
      honestStrategy,
      severity,
      likelyQuestion,
      sampleAnswer: sampleAnswer.replace(/\s{2,}/g, " ").trim(),
      strategySteps: steps,
      supportingEvidence: r.kind === "language" ? [] : evidence.map((e) => e.text)
    });
  }

  // Profil düzeyi risk: başarı maddelerinde ölçülebilir sonuç yoksa "etkiyi rakamla anlatın" sorusu gelir
  if (highlights.length > 0 && !highlights.some((h) => /\d/.test(h.highlight))) {
    risks.push({
      requirement: "Ölçülebilir etki / sonuç",
      candidateExperience: "Profilinizdeki deneyim maddelerinde rakam veya yüzde görünmüyor",
      gap: "Mülakatçı başarılarınızı somut sonuçlarla (rakam, süre, yüzde) görmek ister",
      honestStrategy: "Gerçek sonuçlarınızı (kullanıcı sayısı, süre kazancı, bütçe, ekip büyüklüğü) profilinize ekleyin; bilmediğiniz rakamı uydurmayın, yaklaşık olarak ve 'yaklaşık' diyerek söyleyin.",
      severity: "low",
      likelyQuestion: tr ? "Yaptığınız işin etkisini rakamlarla anlatabilir misiniz?" : "Can you quantify the impact of your work?",
      sampleAnswer: "",
      strategySteps: [
        "Her önemli başarı için bir sonuç belirleyin (süre, maliyet, kullanıcı, kalite)",
        "Kesin rakamı bilmiyorsanız 'yaklaşık' diyerek aralık verin; uydurmayın",
        "Profilinize bu rakamları ekleyin ki CV ve cevaplar tutarlı olsun"
      ],
      supportingEvidence: []
    });
  }

  return risks
    .sort((a, b) => SEVERITY_ORDER[a.severity || "low"] - SEVERITY_ORDER[b.severity || "low"])
    .slice(0, 6);
}
