import { JobPosting } from "@/types";

export const sampleJobPostings: JobPosting[] = [
  {
    id: "sample-job-1",
    title: "Senior Product Manager - Merchant Payments & SoftPOS",
    company: "PayFlow International",
    location: "Amsterdam, Netherlands / Remote (EMEA)",
    country: "Netherlands",
    workModel: "remote",
    salary: "€75,000 - €95,000 / year",
    sourceUrl: "https://linkedin.com/jobs/view/sample-payflow",
    platform: "linkedin",
    rawDescription: `PayFlow is looking for an experienced Senior Product Manager to lead our Next-Gen Merchant Acquiring and SoftPOS solutions.

About the Role:
You will lead our mobile point-of-sale product suite, collaborating with engineering teams on SDK integrations, payment terminal software, and B2B back-office portals.

Key Responsibilities:
- Own the product vision and roadmap for our SoftPOS Android SDK and merchant onboarding flows.
- Coordinate with Mastercard and Visa certification bodies, QA engineers, and client integration teams.
- Manage backlog, write user stories, and coordinate release delivery in Jira.
- Partner with enterprise merchants to gather requirements for dashboards, transaction reporting, and routing.

Requirements:
- 3+ years experience in technical Product Management or Project Management within fintech/payments.
- Direct familiarity with SoftPOS, EMVCo standards, mobile SDKs, or payment gateway APIs.
- Experience managing B2B merchant dashboards and transaction workflows.
- Strong cross-functional coordination skills.
- Fluent English.

Location & Work Arrangement:
- Remote work allowed from any EMEA country (including Türkiye via EOR / Deel).
- Visa sponsorship and relocation package to Amsterdam available for candidates interested in relocating.`,
    dateAdded: "2026-09-28",
    status: "to_apply",
    notes: "Mükemmel uyum! Hem SoftPOS hem Mastercard SDK hem de Türkiye'den EOR ile çalışma imkanı tanıyor.",
    analysis: {
      roleType: "PRODUCT",
      eligibility: {
        canApplyFromTurkey: true,
        remoteFromTurkey: true,
        relocationOffered: true,
        visaSponsorship: "offered",
        summary: "Türkiye'den Deel/EOR ile uzaktan çalışmaya açık ve Amsterdam'a relokasyon / vize sponsorluğu sunuluyor."
      },
      strongMatches: [
        "SoftPOS ve mobil SDK ödeme çözümleri ürün sahipliği",
        "Mastercard / EMVCo sertifikasyon süreçleri deneyimi",
        "B2B merchant paneli ve işlem yönetim arayüzleri tecrübesi",
        "Jira üzerinde backlog ve sprint yönetimi",
        "Fintech ve ödeme altyapılarında 4+ yıl deneyim"
      ],
      transferableExperience: [
        "Graycat Studio'dan gelen e-ticaret satıcı ve merchant bakış açısı",
        "Teknik ekiplerle API/SDK entegrasyon koordinasyonu"
      ],
      gaps: [
        "Doğrudan Visa sertifikasyonu özelinde belirtilen ek kurallar (Mastercard SDK tecrübesi rahatça aktarılabilir)"
      ],
      productFit: [
        "Ürün vizyonu, roadmap ve merchant onboarding akışları tam adayın mevcut ProvisionPay tecrübesiyle birebir eşleşiyor."
      ],
      projectFit: [
        "Çapraz fonksiyonel teslimat koordinasyonu ve harici entegrasyon yönetimi adayın proje yönetimi gücünü destekliyor."
      ],
      experienceToEmphasize: [
        "ProvisionPay'deki SoftPOS ve Mastercard SDK lansmanları",
        "Merchant yönetim paneli (dashboard) geliştirme süreçleri"
      ],
      redFlags: [],
      interviewRisks: [
        {
          requirement: "EMVCo ve Visa sertifikasyon detayları",
          candidateExperience: "Mastercard SDK ve SoftPOS sertifikasyonlarında doğrudan rol aldı",
          gap: "Visa özel süreçleri",
          honestStrategy: "Mastercard ve EMVCo süreçlerindeki derin tecrübenin Visa protokollerine kolaylıkla uyarlanabileceğini vurgulamak."
        }
      ],
      finalVerdict: "APPLY",
      oneSentenceReason: "İlan SoftPOS, Mastercard SDK ve B2B dashboard deneyiminizle birebir örtüşüyor; ayrıca Türkiye'den uzaktan çalışma ve vize sponsorluğu seçeneklerinin her ikisi de mevcut.",
      analyzedAt: "2026-09-28T14:15:00Z"
    },
    applicationPackage: {
      tailoredCvSummary: "Fintech ve yeni nesil ödeme teknolojilerinde (SoftPOS, HCE, Mastercard SDK) 4 yılı aşkın deneyime sahip Product Manager. B2B merchant yönetim panelleri, EMVCo sertifikasyonları ve teknik teslimat koordinasyonunda kanıtlanmış başarı.",
      tailoredBulletPoints: [
        {
          roleFlavor: "Product Manager",
          bullets: [
            "SoftPOS ve Mastercard SDK tabanlı mobil ödeme ürünlerinin ürün yaşam döngüsünü ve roadmap planlamasını başarıyla yönetti.",
            "Merchant kayıt (enrollment), terminal yönetimi ve işlem raporlama özelliklerini kapsayan B2B back-office platformunun ürün sahipliğini üstlendi.",
            "Geliştirici ve QA ekipleriyle yakın çalışarak EMVCo standartlarına uygun teknik gereksinimleri ve kabul kriterlerini belirledi."
          ]
        },
        {
          roleFlavor: "Project Manager",
          bullets: [
            "SoftPOS çözümünün harici kurumsal müşterilere entegrasyon takvimini ve teknik bağımlılıklarını uçtan uca koordine etti.",
            "SDK sürüm yayınlama süreçlerinde mühendislik ve sertifikasyon ekipleri arasındaki kritik yol teslimatlarını yönetti."
          ]
        }
      ],
      coverLetterEn: `Dear PayFlow Hiring Team,

I am writing to express my strong enthusiasm for the Senior Product Manager position for Merchant Payments & SoftPOS. With over 4 years of hands-on experience at ProvisionPay managing SoftPOS, HCE, and Mastercard SDK payment products, this role aligns directly with my core background.

Throughout my tenure, I have owned B2B merchant back-office portals, managed complex EMVCo certification pipelines, and closely collaborated with engineering squads on SDK and API integrations. My background also encompasses significant delivery coordination, bridging the gap between technical architecture and business needs.

Whether working remotely from Türkiye or relocating to Amsterdam, I would welcome the opportunity to bring my payment product expertise to PayFlow.

Sincerely,
Mine`,
      coverLetterTr: `Sayın PayFlow İşe Alım Ekibi,

PayFlow bünyesindeki Senior Product Manager - Merchant Payments & SoftPOS pozisyonuna başvurmaktan büyük heyecan duyuyorum. ProvisionPay'de 4 yılı aşkın süredir SoftPOS, HCE ve Mastercard SDK tabanlı ödeme çözümlerinin ürün yönetimi ve teknik teslimat koordinasyonunu yürütmekteyim.

B2B merchant yönetim panelleri, EMVCo sertifikasyon süreçleri ve SDK entegrasyonlarındaki deneyimimin PayFlow'un büyüme hedeflerine doğrudan katkı sağlayacağına inanıyorum. Pozisyonun sunduğu remote veya Amsterdam relokasyon fırsatı benim için mükemmel bir uyum sunmaktadır.

Saygılarımla,
Mine`,
      recruiterMessage: "Hi Sarah! I noticed the SoftPOS & Merchant PM role at PayFlow. Having managed SoftPOS, Mastercard SDK & B2B merchant portals at ProvisionPay for 4+ yrs, I would love to connect and share how my background aligns!",
      screeningAnswers: [
        {
          question: "Why do you want to join PayFlow?",
          answer: "PayFlow's focus on modernizing merchant acquiring and SoftPOS aligns directly with my domain expertise in payment SDKs, EMVCo certifications, and B2B back-office platforms."
        },
        {
          question: "What is your experience with payment certifications?",
          answer: "At ProvisionPay, I actively managed EMVCo certification processes and Mastercard SDK compliance, coordinating closely with developers, security specialists, and testing teams."
        }
      ],
      generatedAt: "2026-09-28T14:20:00Z"
    }
  },
  {
    id: "sample-job-2",
    title: "Technical Project Manager - Core Banking Integration",
    company: "Metro Financial Tech",
    location: "London, UK (Hybrid)",
    country: "United Kingdom",
    workModel: "hybrid",
    salary: "£60,000 - £70,000",
    sourceUrl: "https://linkedin.com/jobs/view/sample-metro",
    platform: "linkedin",
    rawDescription: `Metro Financial Tech is seeking a Technical Project Manager in London to oversee core banking API migrations.

Requirements:
- 4+ years of Technical Project Management experience in banking or financial services.
- Proven experience leading Jira sprints, managing dependency matrices, and client integration timelines.
- Must have existing, unrestricted right to work in the UK (No visa sponsorship provided).
- Candidates must be based in Greater London for 2 days/week onsite collaboration.`,
    dateAdded: "2026-09-28",
    status: "reviewed",
    notes: "Deneyim teknik olarak uyuyor ancak vize sponsorluğu kesinlikle verilmiyor ve İngiltere oturum izni şart koşulmuş.",
    analysis: {
      roleType: "PROJECT",
      eligibility: {
        canApplyFromTurkey: false,
        remoteFromTurkey: false,
        relocationOffered: false,
        visaSponsorship: "not_offered",
        summary: "İlan açıkça vize sponsorluğu vermeyeceğini ve adayların hazırda Birleşik Krallık'ta çalışma iznine sahip olmasını zorunlu kılıyor."
      },
      strongMatches: [
        "Teknik proje teslimat koordinasyonu ve bağımlılık yönetimi",
        "Fintech ve finansal API entegrasyonları tecrübesi",
        "Jira ve sprint takvim takibi"
      ],
      transferableExperience: [
        "Product Manager unvanı altında yürütülen teslimat ve müşteri koordinasyonu sorumlulukları"
      ],
      gaps: [
        "İngiltere'de yasal çalışma hakkı (Right to Work in the UK)",
        "Londra'da haftada 2 gün ofise katılım zorunluluğu"
      ],
      productFit: [],
      projectFit: ["Adayın teknik bağımlılık ve takvim yönetimi deneyimi bu role teknik olarak çok uygundur."],
      experienceToEmphasize: [],
      redFlags: [
        "Vize sponsorluğu YOK (No sponsorship)",
        "Türkiye'den uzaktan çalışma kabul EDİLMİYOR",
        "Ofis zorunluluğu mevcut"
      ],
      interviewRisks: [],
      finalVerdict: "SKIP",
      oneSentenceReason: "Teknik gereksinimler uygun olsa da ilan kesin olarak vize sponsorluğu sağlamıyor ve İngiltere'de çalışma izni zorunlu tutuluyor.",
      analyzedAt: "2026-09-28T14:18:00Z"
    }
  },
  {
    id: "sample-job-3",
    title: "Ürün Yöneticisi (Product Manager) - Ödeme Sistemleri & Açık Bankacılık",
    company: "FinTechTR Çözümleri",
    location: "İstanbul (Hibrit / Ayda 2 Gün Ofis)",
    country: "Türkiye",
    workModel: "hybrid",
    salary: "120.000 TL - 160.000 TL / ay",
    sourceUrl: "https://kariyer.net/ilan/sample-fintechtr",
    platform: "kariyer",
    rawDescription: `FinTechTR bünyesinde Ödeme Sistemleri, Sanal POS ve Açık Bankacılık ürünlerimizin yönetimini üstlenecek Product Manager arıyoruz.

Genel Nitelikler:
- Üniversitelerin ilgili bölümlerinden mezun,
- Fintech, ödeme sistemleri veya bankacılık teknolojilerinde en az 3 yıl ürün yönetimi deneyimi,
- POS, SoftPOS, ödeme yönlendirme (routing), taksit ve üye işyeri yönetimi süreçlerine hakim,
- API entegrasyonları ve teknik gereksinim analizinde tecrübeli,
- Çevik (Agile) metodolojilere hakim, Jira kullanabilen.`,
    dateAdded: "2026-09-28",
    status: "to_apply",
    notes: "Kariyer.net ilanı - Türkiye içi hibrit pozisyon. ProvisionPay tecrübesi tam eşleşiyor.",
    analysis: {
      roleType: "PRODUCT",
      eligibility: {
        canApplyFromTurkey: true,
        remoteFromTurkey: true,
        relocationOffered: false,
        visaSponsorship: "unclear",
        summary: "Türkiye içi pozisyon, Türkiye'den başvuru için hiçbir yasal kısıt bulunmuyor."
      },
      strongMatches: [
        "SoftPOS, ödeme yönlendirme, taksit ve üye işyeri yönetimi tecrübesi",
        "Fintech alanında 4+ yıl ürün deneyimi",
        "API entegrasyonu ve teknik kabul kriterleri hazırlama",
        "Jira ve Agile çalışma prensipleri"
      ],
      transferableExperience: [
        "Back-office panel yönetimi ve merchant enrollment akışları"
      ],
      gaps: [],
      productFit: [
        "Pozisyonun tüm teknik ve fonksiyonel kapsamı ProvisionPay'deki günlük çalışma alanıyla birebir örtüşmektedir."
      ],
      projectFit: [
        "Mühendislik ekipleriyle yürütülen sprint süreçleri."
      ],
      experienceToEmphasize: [
        "Ödeme yönlendirme, taksit altyapısı ve SoftPOS projeleri",
        "Üye işyeri yönetim paneli (Merchant Management)"
      ],
      redFlags: [],
      interviewRisks: [],
      finalVerdict: "APPLY",
      oneSentenceReason: "Pozisyonun beklediği SoftPOS, üye işyeri ve yönlendirme deneyimleri adayın mevcut uzmanlık alanıyla eksiksiz örtüşüyor.",
      analyzedAt: "2026-09-28T14:25:00Z"
    }
  },
  {
    id: "sample-job-4",
    title: "Senior Technical Project Manager - Payment Gateway & SDK Integrations",
    company: "OmniPay Global Systems",
    location: "Worldwide Remote (EMEA / Türkiye)",
    country: "Remote",
    workModel: "remote",
    salary: "$85,000 - $110,000 / year",
    sourceUrl: "https://linkedin.com/jobs/view/sample-omnipay-project-manager",
    platform: "linkedin",
    rawDescription: `OmniPay Global is hiring a Senior Technical Project Manager to lead payment gateway integrations, mobile POS SDK release cycles, and client onboarding milestones.

About the Role:
As a Technical Project Manager, you will work between client engineering teams, product managers, and internal developers to orchestrate SDK rollouts, EMVCo compliance audits, and API migrations.

Responsibilities:
- Coordinate delivery timelines, release sprints, and dependency mapping across distributed engineering squads.
- Serve as the technical delivery liaison for merchant partners integrating our payment SDK and B2B portal.
- Facilitate Agile ceremonies (sprint planning, daily standups, retrospectives) in Jira.
- Track risk registries, milestone deliverables, and test certification sign-offs.

Requirements:
- 4+ years experience in Technical Project Management, Delivery Management, or Technical PM within fintech/payments.
- Proven experience with Jira, Confluence, and Agile delivery frameworks.
- Deep familiarity with payment architectures, SDKs, or banking API integrations.
- Excellent English communication and stakeholder management.

Arrangement:
- 100% Remote, open to candidates across EMEA (including Türkiye via Deel/EOR).`,
    dateAdded: "2026-09-29",
    status: "to_apply",
    notes: "Proje yönetimi ve teknik teslimat için mükemmel uyum! SoftPOS/SDK ve Jira deneyimleri doğrudan eşleşiyor.",
    analysis: {
      roleType: "PROJECT",
      eligibility: {
        canApplyFromTurkey: true,
        remoteFromTurkey: true,
        relocationOffered: false,
        visaSponsorship: "unclear",
        summary: "EMEA ve Türkiye'den Deel/EOR ile uzaktan çalışmaya açık global remote pozisyon."
      },
      strongMatches: [
        "Fintech ve ödeme SDK'larında 4+ yıl teknik koordinasyon ve teslimat yönetimi",
        "Jira ve Agile sprint takvimleri, bağımlılık haritalama ve risk yönetimi",
        "Mastercard SDK ve EMVCo uyum süreçlerinde teknik ekiplerle ortak çalışma",
        "Kurumsal müşteri entegrasyonu ve teknik paydaş yönetimi"
      ],
      transferableExperience: [
        "Product Manager unvanıyla yürütülen harici entegrasyon takvimi ve teslimat liderliği"
      ],
      gaps: [],
      productFit: [],
      projectFit: [
        "Adayın ProvisionPay'deki harici entegrasyon takvimleri, sprint planlaması ve mühendislik bağımlılık yönetimi bu rolün gereksinimleriyle birebir örtüşüyor."
      ],
      experienceToEmphasize: [
        "ProvisionPay'de SoftPOS ve SDK sürüm takvimlerinin yönetimi",
        "Harici kurumsal müşterilerle yürütülen API entegrasyon teslimatları"
      ],
      redFlags: [],
      interviewRisks: [],
      finalVerdict: "APPLY",
      oneSentenceReason: "Teknik proje yönetimi, ödeme SDK teslimatları ve Jira koordinasyonu adayın deneyimiyle güçlü şekilde örtüşüyor; Türkiye'den remote çalışmaya uygun.",
      analyzedAt: "2026-09-29T15:00:00Z"
    },
    applicationPackage: {
      tailoredCvSummary: "Fintech ve ödeme altyapılarında 4+ yıllık teknik teslimat koordinasyonu, SDK entegrasyonları ve sprint yönetimi deneyimine sahip Technical Project Manager.",
      tailoredBulletPoints: [
        {
          roleFlavor: "Project Manager",
          bullets: [
            "SoftPOS ve mobil ödeme SDK'larının harici kurumsal müşterilere entegrasyon takvimlerini ve kritik yol bağımlılıklarını uçtan uca koordine etti.",
            "Jira üzerinde sprint planlama, backlog önceliklendirme ve sürüm teslimat süreçlerini 10+ kişilik mühendislik ekibiyle yönetti.",
            "Mastercard ve EMVCo sertifikasyon takvimlerini güvenlik ve test ekipleriyle senkronize ederek zamanında canlıya alınmasını sağladı."
          ]
        }
      ],
      coverLetterEn: "Dear OmniPay Hiring Team, I am writing to express my strong interest in the Senior Technical Project Manager role...",
      coverLetterTr: "Sayın OmniPay İşe Alım Ekibi, Senior Technical Project Manager pozisyonuna başvurmaktan memnuniyet duyuyorum...",
      recruiterMessage: "Hi! I noticed the Technical Project Manager role at OmniPay. Having led SDK integrations and sprint delivery in payment tech for 4+ yrs at ProvisionPay, I'd love to connect!",
      screeningAnswers: [],
      generatedAt: "2026-09-29T15:05:00Z"
    }
  },
  {
    id: "sample-job-5",
    title: "Kıdemli Proje Yöneticisi (Technical Delivery Manager) - Dijital Bankacılık & POS",
    company: "AktifTech Bilişim & Finans",
    location: "İstanbul (Hibrit)",
    country: "Türkiye",
    workModel: "hybrid",
    salary: "140.000 TL - 180.000 TL / ay",
    sourceUrl: "https://kariyer.net/is-ilani/sample-aktiftech-proje-yoneticisi",
    platform: "kariyer",
    rawDescription: `AktifTech bünyesinde Dijital Bankacılık, Sanal POS ve Ödeme Altyapısı projelerimizin teslimatını ve koordinasyonunu üstlenecek Kıdemli Proje Yöneticisi arıyoruz.

Genel Nitelikler:
- Bankacılık veya FinTech sektöründe en az 3-4 yıl teknik proje yönetimi tecrübesi,
- POS, SoftPOS, API entegrasyonu ve ödeme sistemleri projelerinde yer almış,
- Agile / Scrum süreçlerini uygulayan, Jira ve Confluence araçlarına hakim,
- Yazılım geliştirme, QA ve iş birimleri arasında güçlü iletişim ve teslimat koordinasyonu yeteneği.`,
    dateAdded: "2026-09-29",
    status: "to_apply",
    notes: "Türkiye içi hibrit pozisyon. Bankacılık ve ödeme sistemleri proje yönetimi deneyimi tam uyuyor.",
    analysis: {
      roleType: "PROJECT",
      eligibility: {
        canApplyFromTurkey: true,
        remoteFromTurkey: true,
        relocationOffered: false,
        visaSponsorship: "unclear",
        summary: "Türkiye içi pozisyon; yerel başvuru için hiçbir yasal engel yoktur."
      },
      strongMatches: [
        "POS, SoftPOS ve ödeme altyapılarında teknik teslimat ve proje yönetimi",
        "Jira ve Agile sprint takibi",
        "Yazılım ve QA ekipleri arasında teknik köprü kurma tecrübesi"
      ],
      transferableExperience: [
        "Ürün yönetimi şapkası altında yürütülen teslimat ve müşteri entegrasyon süreçleri"
      ],
      gaps: [],
      productFit: [],
      projectFit: [
        "Ödeme altyapısı ve dijital bankacılık projelerinin teslimat takvimini yönetme tecrübesi adayın profiline tam oturuyor."
      ],
      experienceToEmphasize: [
        "SoftPOS ve ödeme sistemleri teslimat takvimleri"
      ],
      redFlags: [],
      interviewRisks: [],
      finalVerdict: "APPLY",
      oneSentenceReason: "Pozisyonun beklediği POS, ödeme sistemleri ve teknik proje yönetimi yetkinlikleri adayın mevcut profiliyle eksiksiz örtüşüyor.",
      analyzedAt: "2026-09-29T15:10:00Z"
    }
  }
];
