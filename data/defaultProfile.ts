import { MasterProfile } from "@/types";

export const defaultMasterProfile: MasterProfile = {
  id: "default-mine-pm-pjm",
  name: "Mine",
  targetTitle: "Product Manager & Project Manager",
  yearsOfExperience: 4,
  currentLocation: "Türkiye",
  targetCountries: [
    "Türkiye",
    "United States",
    "United Kingdom",
    "France",
    "Portugal",
    "Netherlands",
    "Germany",
    "Spain",
    "Ireland",
    "Belgium",
    "Denmark",
    "Sweden",
    "Norway",
    "Finland",
    "Switzerland",
    "Austria"
  ],
  targetRoles: {
    primary: [
      "Product Manager",
      "Senior Product Manager",
      "Product Owner"
    ],
    secondary: [
      "Project Manager",
      "Technical Project Manager",
      "IT Project Manager",
      "Digital Project Manager",
      "Product Project Manager",
      "Delivery Manager",
      "Program Manager"
    ],
    hybrid: [
      "Technical Product Manager",
      "Product Operations",
      "Product Delivery",
      "Implementation Manager"
    ]
  },
  coreExperience: [
    {
      company: "Provision / ProvisionPay",
      title: "Product Manager & Associate Product Manager",
      period: "2022 – Günümüz (4+ Yıl)",
      highlights: [
        "SoftPOS, HCE ve Mastercard SDK tabanlı yeni nesil ödeme teknolojileri ürünlerinin uçtan uca yönetimi.",
        "B2B yönetici paneli (back-office) ve merchant yönetim platformlarının ürün sahipliği (dashboard, terminal, webhook, enrollment).",
        "EMVCo sertifikasyon süreçleri, HSM entegrasyonları ve ödeme yönlendirme (routing/taksit) altyapısının koordinasyonu.",
        "Mühendislik, QA ve harici kurumsal müşteriler arasında çapraz fonksiyonel teknik proje ve teslimat koordinasyonu.",
        "Jira ve Confluence üzerinde ürün yol haritası (roadmap), sprint planlama ve backlog yönetimi."
      ],
      fintechDomains: [
        "SoftPOS", "HCE", "Mastercard SDK", "EMVCo Sertifikasyonu",
        "HSM", "Ödeme Geçitleri", "Taksit & Routing", "Terminal & Merchant Management", "Webhooks & APIs"
      ],
      technologies: ["REST APIs", "Mobile SDKs", "Backend Entegrasyonları", "Veritabanı Gereksinimleri", "Ödeme Protokolleri"],
      tools: ["Jira", "Confluence", "Trello", "Microsoft 365", "Excel", "Postman"]
    }
  ],
  projectManagementHighlights: [
    "Teknik bağımlılıkların ve kritik yol (critical path) haritalarının çıkarılması ve yönetimi.",
    "B2B kurumsal müşteriler ve geliştirici ekipler arası teknik teslimat takvimlerinin koordine edilmesi.",
    "SDK ve ana sürüm sürümleri (release management) ile versiyon uyumluluk kontrolleri.",
    "Engellerin (blockers) tespit edilip sprint risklerinin minimize edilmesi."
  ],
  productManagementHighlights: [
    "Ürün keşfi (product discovery) ve iş/kullanıcı gereksinim analizi.",
    "Özellik önceliklendirme ve ürün yol haritası (roadmap) katkısı.",
    "B2B dashboard ve raporlama arayüzlerinin kullanıcı deneyimi tasarımı ve kabul testleri (UAT).",
    "Geliştirici ekipler için detaylı PRD ve teknik kabul kriterlerinin yazılması."
  ],
  ecommerceExperience: {
    company: "Graycat Studio",
    role: "Kurucu Ortak (Co-Founder)",
    period: "2022 – 2023",
    details: [
      "E-ticaret operasyonları, Shopify ve WordPress altyapısı yönetimi.",
      "SEO, dijital içerik stratejisi ve doğrudan tüketiciye (D2C) ürün satışı yönetimi.",
      "Müşteri kazanımı ve mağaza analitik takibi."
    ]
  },
  languages: [
    { language: "Türkçe", level: "Anadil" },
    { language: "İngilizce", level: "İleri Düzey Çalışma Yetkinliği (Professional Working Proficiency)" }
  ],
  rawMarkdown: `# MASTER CANDIDATE PROFILE

## Aday
Product Manager / Project Manager (Fintech & Yazılım Ürünleri alanında 4+ yıl deneyim).

## Temel Güçlü Yönler
- Ödeme Sistemleri, SoftPOS, HCE, Mastercard SDK, EMVCo sertifikasyonları.
- B2B Dashboard ve Kurumsal Back-office ürünleri.
- Çapraz Fonksiyonel Proje Yönetimi ve Teknik Teslimat Koordinasyonu.
- Graycat Studio ile E-Ticaret ve D2C Deneyimi.

## Coğrafi Tercihler
Aday Türkiye'de yaşamaktadır. Türkiye'den remote çalışma, relokasyon veya vize sponsorluğu sunan global (ABD, İngiltere, AB) ve yerel pozisyonları hedeflemektedir.`
};
