# JoBot - Akıllı İş Başvuru ve Kariyer İstihbarat Platformu

Bu doküman, **JoBot** projesinin mimarisini, bugüne kadar uygulanan geliştirmeleri, çözülen kritik problemleri, uygulanan katı kuralları ve kod tabanı çalışma prensiplerini detaylı bir şekilde özetler.

---

## 1. Proje Genel Bakışı & Aday Profili

**JoBot**, Türkiye'de ikamet eden ve hem yerel hem de uluslararası (ABD, Birleşik Krallık, Avrupa, Global Remote) teknoloji şirketlerine başvuran bir **Senior Product Manager (Kıdemli Ürün Yöneticisi)** ve **Technical Project Manager (Teknik Proje Yöneticisi)** adayı için özel olarak geliştirilmiş yapay zeka destekli bir kariyer asistanıdır.

### Adayın Çekirdek Deneyimi:
- **Deneyim Süresi:** 4+ yıl (Fintech, Ödeme Sistemleri, SoftPOS, B2B SaaS).
- **Uzmanlık Alanları:** SoftPOS Android SDK, HCE, EMVCo ve Mastercard/Visa sertifikasyon süreçleri, Sanal POS, API entegrasyonları, B2B Merchant yönetim panelleri, D2C e-ticaret (Graycat Studio kurucu ortaklığı).
- **Çift Şapka Yetkinliği:** Ürün Yönetimi (PRD, backlog, roadmap, sprint planlama) ile Teknik Proje/Teslimat Yönetimi (SDK sürüm teslimatı, bağımlılık yönetimi, sertifikasyon takvimleri, Jira/Scrum koordinasyonu).

---

## 2. Teknoloji Mimarisi

- **Frontend & Çerçeve:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS, Lucide React.
- **Yapay Zeka (AI) & Heuristic Motoru:**
  - Google Gemini 2.0 API (`@google/genai`) entegrasyonu.
  - **Dahili Akıllı Sezgisel Motor (Offline Heuristic Engine):** API anahtarı olmadan veya kota aşımlarında sıfır maliyetle çalışan kural tabanlı analiz ve başvuru paketi üretim motoru (`lib/aiService.ts`).
- **Veri Kalıcılığı (Dual Storage Architecture):**
  - **SQLite (`better-sqlite3`):** Sunucu tarafı kalıcı veri tabanı. Yerel ortamda `data/jobot.db`, Vercel ve Serverless ortamlarda `os.tmpdir()/jobot.db` üzerinde çalışır.
  - **LocalStorage:** Tarayıcı tarafında anlık UI tepkisi (`jobot_saved_jobs_v1`).
  - **Otomatik Çift Yönlü Senkronizasyon (`lib/storage.ts` & `app/api/db`):** Tarayıcıdaki tüm ekleme, silme ve durum güncellemeleri arka planda SQLite'a yazılır; sayfa yenilendiğinde veya çerezler silindiğinde veritabanından geri yüklenir.
  - **Serverless Crash Önleme:** Vercel üzerinde `.db-shm` paylaşımlı bellek kilitlenmelerini engellemek için `journal_mode = DELETE` kipi uygulanmıştır.

---

## 3. Yapılan Temel Geliştirmeler & Modüller

### A. Canlı İlan Tarayıcısı (`app/api/scan-jobs/route.ts`)
- **Çok Kaynaklı Eşzamanlı Tarama:**
  - **LinkedIn:** Guest API üzerinden anahtar kelimeler ve coğrafi parametrelerle canlı tarama.
  - **Kariyer.net:** Türkiye içi yerel ilanlar için canlı HTML ayrıştırma.
  - **RemoteOK:** Açık JSON API üzerinden global remote pozisyonlar.
  - **Remotive & Jobicy:** Avrupa ve küresel teknoloji ilanları.
- **Rol Kapsamı (Role Scope) Filtresi:**
  - Arayüzden kullanıcı isterse sadece **Product Manager**, sadece **Project Manager** veya **Her İkisini Birden** seçerek tarama yapabilir.
- **Katı Kara Liste (Negative Keyword Blacklist):**
  - Yazılım mühendisliği, frontend/backend/fullstack, QA/test mühendisliği, DevOps/SRE, UI/UX tasarımı, satış, pazarlama, medikal ve alakasız roller anında taranıp elenir.

### B. Akıllı Uygunluk ve Eleme Kuralları (`lib/aiService.ts`)
Adayın Türkiye'de ikamet etmesi sebebiyle geliştirilen katı filtreleme kuralları:
1. **Katı Vize Kuralı (Strict Visa Rule):**
   - Türkiye dışındaki yurtdışı ilanlarda açıkça **Vize Sponsorluğu (Visa Sponsorship)** veya **Relokasyon Paketi (Relocation)** belirtilmemişse ve ilan teyitli %100 Worldwide Remote (Deel/EOR) değilse, ilan **KESİNLİKLE `SKIP` (Pas Geç)** olarak işaretlenir. Uygunluk durumu `canApplyFromTurkey: false` yapılır.
2. **Ülke Kısıtlamalı Remote Kuralı (Country-Locked Remote):**
   - İlan uzaktan (remote) görünse dahi metninde veya lokasyonunda "US Only", "Remote from: USA", "Remote within Germany", "UK Only", "Must reside in Spain" gibi yerel ikamet şartı koşan ilanlar tespit edilir ve **`SKIP`** verilir.
3. **Katı Hibrit / Ofis Kuralı (Strict Hybrid / Onsite Rule):**
   - Başlığında veya içeriğinde `(hybrid)`, `[hybrid]`, `(hibrit)`, `(onsite)` geçen yurtdışı ilanlar için ofise fiziki katılım şartı algılanır. Vize ve relokasyon desteği yoksa bu ilanlar asla "Worldwide Remote" sayılamaz ve doğrudan **`SKIP`** olarak elenir.
4. **Çift Yönlü Rol Analizi (Product & Project Fit):**
   - Adayın SoftPOS SDK teslimatı, Mastercard/EMVCo test takvimleri ve Jira sprint koordinasyonu deneyimi kullanılarak hem PM hem de TPM pozisyonlarına uygunluk puanlanır.

### C. Başvuru Paketi Üreticisi (`/api/generate` & `lib/aiService.ts`)
Her ilan için tek tıkla özel içerik üretilir:
1. **Özel CV Özeti (Tailored Summary):** İlandaki anahtar kelimelerle zenginleştirilmiş 2-3 cümlelik gerçekçi özet.
2. **Çift Lezzetli CV Maddeleri (Dual-Flavor Bullets):** Aynı projenin hem "Product Manager" hem "Project Manager" vurgulu başarı maddeleri.
3. **İki Dilli Ön Yazı (Cover Letter):** Profesyonel İngilizce ve Türkçe ön yazılar.
4. **LinkedIn Recruiter Notu:** 300 karakter sınırına sadık, sıcak ve doğrudan bağlantı mesajı.
5. **Mülakat Tarama Soruları:** İlandaki muhtemel risklere yönelik dürüst ve stratejik aday yanıtları.

### D. Arayüz ve Kullanıcı Deneyimi Geliştirmeleri
- **Sürükle ve Bırak Kanban Panosu (`components/KanbanBoard.tsx`):**
  - 6 Durum Sütunu: *Yeni / İnceleniyor*, *Başvurulacak*, *Başvuruldu*, *Mülakat*, *Teklif*, *Pas Geçildi*.
  - HTML5 native drag & drop desteği.
- **Karanlık Mod (Dark Mode):**
  - Açık (Light), Koyu (Dark) ve Sistem Teması desteği (`SettingsModal.tsx` & `page.tsx`).
- **Tablo Görünümü (`components/TableView.tsx`):** Detaylı sıralama, arama ve durum değiştirme tablosu.
- **İlan Ekleme Modalı (`components/AddJobModal.tsx`):**
  - URL'den otomatik veri çekme (`/api/fetch-job`).
  - Başlık yazılırken `(hybrid)` veya `(remote)` yazılması durumunda çalışma modelini otomatik seçme.
  - Örnek senaryo presetleri.
- **10 Adımlı Detay Modalı (`components/JobDetailModal.tsx`):**
  - Kritik uygunluk değerlendirmesi (Eligibility), güçlü eşleşmeler, aktarılabilir deneyimler, açıklar ve mülakat riskleri.
  - Başvuru paketini tek tıkla panoya kopyalama.
  - Mükerrer lokasyon yazım hatalarının düzeltilmesi (`Worldwide Remote (Worldwide Remote)` vb.).

### E. Dummy / Örnek İlanların Temizlenmesi
- İlk kurulumda yer alan fintech mock ilanları (`sample-job-1` ... `sample-job-5`):
  - `data/sampleJobs.ts` içinden silindi (boş liste `[]`).
  - `lib/db.ts` SQLite açılışında `DELETE FROM jobs WHERE id LIKE 'sample-job-%'` sorgusu ile veritabanından temizlendi.
  - `lib/storage.ts` ve `app/page.tsx` içinde tarayıcı önbelleğindeki eski dummy verileri süzecek mekanizma eklendi.
  - Pano artık kullanıcı tarama yapana veya ilan ekleyene kadar tamamen temiz açılmaktadır.

---

## 4. Dizin Yapısı

```
jobot/
├── app/
│   ├── api/
│   │   ├── analyze/        # Tekil ilan AI analiz endpoint'i
│   │   ├── db/             # SQLite CRUD ve senkronizasyon endpoint'i
│   │   ├── fetch-job/      # URL'den ilan başlığı ve açıklaması çekme
│   │   ├── generate/       # Başvuru paketi (CV, Cover Letter, Recruiter) üretimi
│   │   └── scan-jobs/      # LinkedIn, Kariyer, RemoteOK, Remotive, Jobicy canlı tarayıcı
│   ├── globals.css         # Tailwind ve koyu mod stilleri
│   ├── layout.tsx          # Kök yerleşim
│   └── page.tsx            # Ana uygulama kontrolörü ve veri eşitleme
├── components/
│   ├── AddJobModal.tsx     # İlan ekleme ve URL tarama modalı
│   ├── JobDetailModal.tsx  # 10 adımlı analiz ve başvuru paketi modalı
│   ├── KanbanBoard.tsx     # Sürükle-bırak Kanban panosu
│   ├── LiveScannerModal.tsx# Canlı tarama ve toplu ilan içe aktarma modalı
│   ├── Navbar.tsx          # Üst menü ve hızlı aksiyonlar
│   ├── ProfileView.tsx     # Aday profil düzenleme sekmesi
│   ├── SettingsModal.tsx   # AI sağlayıcı, API anahtarı ve tema ayarları
│   └── TableView.tsx       # Liste/tablo görünümü
├── data/
│   ├── defaultProfile.ts   # Adayın ana profil metni ve yetkinlikleri
│   └── sampleJobs.ts       # Boşaltılmış örnek ilan koleksiyonu
├── lib/
│   ├── aiService.ts        # Gemini API entegrasyonu, coğrafi ayrıştırma ve sezgisel motor
│   ├── db.ts               # SQLite (better-sqlite3) bağlantı ve tablo yönetimi
│   └── storage.ts          # LocalStorage ve SQLite arka plan eşitleme katmanı
├── types/
│   └── index.ts            # JobPosting, MasterProfile, JobAnalysis, AppSettings tipleri
└── CLAUDE.md               # Bu proje kılavuzu
```

---

## 5. Geliştirici ve Çalıştırma Komutları

```bash
# Bağımlılıkları yükleme
npm install

# Geliştirme sunucusunu başlatma (Turbopack)
npm run dev

# Üretim derlemesi oluşturma
npm run build

# Üretim sunucusunu çalıştırma
npm run start

# Kod kontrolü (Lint)
npm run lint
```

---

## 6. Gelecek Geliştiriciler İçin Önemli Prensipler

1. **Vize ve Remote Şartını Esnetmeyin:** Türkiye'deki aday için yurtdışında vize desteği olmayan veya tek bir ülkeye kilitli ilanlar `CONSIDER` verilemez; doğrudan `SKIP` olmalıdır.
2. **Çift Unvan Odağını Koruyun:** Adayın profilinde hem Product Manager hem Technical Project Manager kasları bulunmaktadır. İlan değerlendirmelerinde sadece PM başlığına sıkışmayın.
3. **Serverless Veritabanı Kısıtı:** SQLite için asla yerel disk yazma varsayımı yapmayın; `resolveDbPath()` mantığı korunmalı ve Vercel ortamında `os.tmpdir()` kullanılmalıdır.
4. **Mükerrerlik Kontrolü:** İlan tarayıcıda URL bazlı `seenUrls` kontrolü yapılmaktadır; yeni kaynaklar eklerken normalize edilmiş URL kontrolünü sürdürün.
