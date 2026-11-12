# JoBot - TODO

## Temel Prensip (tüm maddeler için geçerli)

**Sunucuda kişisel veri tutulmaz; kullanıcı verisi tarayıcıda (çerez / LocalStorage) yaşar.**

- Profil, CV içeriği, kaydedilen ilanlar ve ayarlar kullanıcının tarayıcısında saklanır.
- Sunucu yalnızca anlık işlem yapar (CV ayrıştırma, analiz, tarama) ve sonucu döndürür; hiçbir şey kalıcı yazılmaz, loglanmaz.
- Şu an uygulama tek aday (kendi profilimiz) için kurulu. Prod'a çıkarken bu **mutlaka** değişecek: profil kullanıcıdan alınacak.

### Prod'a hazırlık: mimari temizlik (kod incelemesindeki engeller)
Bu iş, madde 1'in önkoşuludur; birlikte planlanmalı.

- [~] **Sunucu tarafı kalıcılığı kaldır / kısıtla:** *(profil tamam; ilanlar ve ayarlar hâlâ SQLite'a senkronize ediliyor)* `lib/db.ts` (`dbGetProfile`, `master_profile`, `jobs` tablosu), `app/api/db/route.ts` ve `lib/storage.ts`'teki SQLite senkronizasyonu prod'da kullanıcı verisi yazmayacak şekilde değiştirilir. Profil ve ilanlar yalnızca tarayıcıda (çerez/LocalStorage/IndexedDB) saklanır. Paylaşılan SQLite'ta kullanıcıya ait hiçbir şey kalmaz (çok kullanıcılı ortamda veri karışması riski de ortadan kalkar).
- [x] **Varsayılan profili kaldır:** `data/defaultProfile.ts` prod akışında kullanılmaz; `lib/db.ts`, `app/page.tsx`, `ProfileView.tsx`, `Navbar.tsx` vb. yerlerdeki `defaultMasterProfile` bağımlılıkları temizlenir. Profil yoksa kayıt ekranına yönlendirilir. (Geliştirme için ayrı bir "demo profil" seçeneği düşünülebilir.)
- [x] **Sezgisel motoru genelleştir:** *(tamamlandı: ev ülkesi, beceri eşleşmesi, eksik beceri tespiti profilden)* ~~ *(başvuru paketi üretici + prompt'lar profilden dinamik; `runHeuristicAnalysis` içindeki Türkiye varsayımı ve rol anahtar kelimeleri hâlâ sabit → madde 2/3 ile birlikte)*~~ `lib/aiService.ts` içindeki `runHeuristicAnalysis`, `runHeuristicGenerator` ve prompt şablonları adaya özel metinler içeriyor (SoftPOS, HCE, Mastercard, "4+ yıl", Fintech vb.). Hepsi `MasterProfile`'dan dinamik üretilecek; sabit aday metni kalmayacak. Katı vize kuralı gibi kurallar `currentLocation`'a göre çalışacak ("Türkiye" varsayımı sabit kalmayacak).
- [ ] **Sunucuya giden profil verisini sınırla:** `/api/analyze` ve `/api/generate` isteğin gövdesinde profili alıyor. Bu anlık işlem olarak kabul edilebilir ama sunucuda saklanmadığı ve loglanmadığı doğrulanacak; mümkünse yalnızca gerekli alanlar gönderilecek (ör. ad/iletişim bilgisi analiz için gönderilmez).
- [ ] **Gemini şimdilik devre dışı:** Prod akışında analiz/üretim yalnızca sezgisel (kural tabanlı) motorla çalışır; Gemini çağrıları ve anahtar ayarı arayüzden gizlenir/kapatılır. (Kod silinmez, ileride yeniden açılabilir.)
- [ ] **Doğrulama:** Prod build'de sunucu diski/DB'sinde kullanıcı verisi kalmadığını test et (ör. `data/jobot.db` ve `os.tmpdir()` içeriğini kontrol et). `CLAUDE.md`'deki çift depolama mimarisi bölümünü güncelle.

---

## 1. CV yükleme + kayıt (onboarding) ekranı

Amaç: Kullanıcı uygulamayı kullanmaya başlamadan önce bir kayıt ekranında bilgilerini girer. CV yüklemenin tek amacı **veri doldurmayı kısaltmak**.

### Akış
1. İlk açılışta (tarayıcıda profil yoksa) panoya değil **kayıt ekranına** gidilir; profil tamamlanmadan uygulama kullanılamaz.
2. İki yol sunulur:
   - **CV yükle (önerilen):** PDF/DOCX yüklenir, metin çıkarılır, alanlar otomatik doldurulur.
   - **Elle doldur:** Aynı form boş gelir.
3. CV'den çıkarılan veriler aynı forma yazılır; kullanıcı **her alanı kontrol edip düzeltir** ve onaylar (otomatik ayrıştırma hatalı olabilir).
4. Onaylanan profil yalnızca tarayıcıya kaydedilir. CV dosyası hiçbir yerde saklanmaz.

### Formda toplanacak bilgiler
- Ad soyad, mevcut konum (ülke/şehir)
- Hedef unvan(lar) ve rol kapsamı (birincil / ikincil)
- Deneyim süresi, sektörler, uzmanlık alanları, araçlar/teknolojiler
- Deneyim özeti ve başarı maddeleri (ön yazı / CV özeti üretimi için `rawMarkdown` karşılığı)
- Diller
- Çalışma tercihi (remote/hibrit/ofis), vize/relokasyon ihtiyacı (madde 2 ile bağlantılı)

### Ekranda gösterilecek kısa gizlilik açıklaması
Kayıt ekranında kısaca şu anlatılacak (sade Türkçe, 2–3 cümle):
> "CV'nizi yalnızca formu hızlıca doldurmak için kullanıyoruz. Dosyanız ve bilgileriniz sunucularımızda saklanmaz; sadece bu tarayıcıda (çerezlerde) tutulur. Çerezleri silerseniz bilgileriniz de silinir."

### Dinamik CV parser (API anahtarsız çalışmalı)
Parser **tamamen kural tabanlıdır; Gemini/AI şimdilik hiç karışmaz.** Kimsenin API anahtarı bulundurması gerekmez.

- **Katman 1 – Metin çıkarımı (tarayıcıda, sıfır sunucu):** PDF (`pdfjs-dist`) ve DOCX (`mammoth`) metni istemci tarafında çıkarılır; dosya sunucuya hiç gitmez. Taranmış/görsel PDF'te metin çıkmazsa kullanıcıya "elle doldur" önerilir.
- **Katman 2 – Kural tabanlı alan çıkarımı (varsayılan):**
  - Bölüm tespiti: Deneyim / Eğitim / Beceriler / Diller / Özet başlıkları (TR + EN eş anlamlıları).
  - E-posta, telefon, LinkedIn URL, konum regex'leri.
  - Tarih aralıklarından (`2020–2024`, `Jan 2020 – Present`) deneyim süresi hesabı.
  - Başlıklardan unvan çıkarımı; beceri/araç sözlüğü eşleştirme (sözlük genişletilebilir, sektöre bağımlı olmayan genel liste + kullanıcı eklemeleri).
  - Güven skoru: emin olunmayan alanlar formda işaretlenir.
- *(Gemini/AI ile iyileştirme şimdilik kapsam dışı; ileride ayrıca değerlendirilir.)*
- Parser `MasterProfile` taslağı üretir; kullanıcı formda düzeltip onaylar.
- Çıkarım başarısız/eksikse: kısmi sonuçla formu doldur, kalanı kullanıcıya bırak (hata ekranı yok).
- Parser'ı çeşitli CV örnekleriyle (TR/EN, tek/çift sütun, farklı şablonlar) test et.

### Teknik notlar
- CV sunucuya hiç gönderilmez; tüm ayrıştırma tarayıcıda yapılır.
- Profil dışa/içe aktarma (JSON): çerezler silinirse veri kaybı olacağından kullanıcıya yedek alma seçeneği.
- Profili silme ("tüm verilerimi sil") butonu.
- Mevcut `ProfileView.tsx` düzenleme ekranı aynı form bileşenini yeniden kullanmalı.

### Kabul kriterleri
- [x] Profil yokken uygulama kayıt ekranını açar, pano erişilemez.
- [x] CV yükleyince form alanları dolar; kullanıcı düzeltip kaydeder.
- [x] Sunucuda (SQLite dahil) profil/CV verisi kalmaz.
- [x] Gizlilik açıklaması kayıt ekranında görünür.
- [x] `defaultProfile.ts` prod akışında kullanılmaz.

---

## 2. Tercih edilen konum seçimi (ülke vb.) — TAMAMLANDI

- [x] Kayıt ve profil formunda ikamet **ülkesi** ve **şehri** ayrı alanlar (`currentLocation` "Ülke (Şehir)" olarak saklanır; `lib/geo.ts`).
- [x] Hedef ülkeler/bölgeler çoklu seçim: ülkeler + `Europe`, `European Union (EU)`, `Global Remote`. Tercih edilen şehirler (isteğe bağlı) ayrı alan.
- [x] Çalışma şekli tercihi (fark etmez / sadece remote / hibrit olabilir / ofiste olabilir) ve vize sponsorluğu ihtiyacı.
- [x] Arama bu tercihlere göre: şehirler önce, sonra ülkeler/bölgeler; "Global Remote" varsa uzaktan sorgular; Kariyer.net yalnızca Türkiye hedefliyse.
- [x] Analiz: hedef ülke/bölge dışındaki ilanlar ve çalışma şekli tercihiyle uyuşmayanlar (ör. sadece-remote isteyen biri için hibrit ilan) `SKIP`.
- [ ] Açık kalan: ülke tespiti sözlük tabanlı (~27 ülke); sözlükte olmayan ülkeler/şehirler tespit edilemez ve hedef kontrolüne takılmaz. Sözlük genişletilebilir.
- [ ] Açık kalan: Kanban/tablo rozetleri ve `canApplyFromTurkey` alan adı hâlâ "Turkey" (madde 6).

## 3. İlan–CV eksiklik tespiti — TAMAMLANDI

- [x] İlan metninden gereksinim çıkarımı (`lib/jobRequirements.ts`): beceri/araç, deneyim yılı, sertifika (PMP, Scrum, AWS…), dil (Almanca vb.). Bölümler (Requirements / Nice to have / Responsibilities / Benefits) ayrıştırılır; zorunlu ve tercih edilen ayrılır, yan haklar yok sayılır.
- [x] Profille karşılaştırma: eşleşen / eksik zorunlu / eksik tercih edilen / kritik eksik; ağırlıklı **eşleşme skoru (%)**.
- [x] Karar: kritik eksik (≥2 yıl deneyim farkı, zorunlu sertifika, zorunlu dil) → `SKIP`; skor <%40 → `SKIP`; <%60 iken `APPLY` → `CONSIDER`.
- [x] Detay penceresinde "İlan Gereksinimleri & Profil Karşılaştırması" paneli (✓/✗, zorunlu/tercih, KRİTİK etiketi), tarama listesinde "Eşleşme %".
- [x] Kısa ilanlar: LinkedIn/Kariyer.net kayıtları yalnızca başlık+şirket içerdiği için tarama sonrası elenmemiş ilanların tam metni bağlantıdan çekilir (`lib/jobDescription.ts`); "Yeniden Analiz" de metni çeker. Metin yoksa panel "gereksinim çıkarılamadı" der.
- [x] Mülakat riskleri artık eksik zorunlu gereksinimlerden üretilir (madde 4'te derinleştirilecek).
- [ ] Açık kalan: eğitim (lisans/yüksek lisans) gereksinimi karşılaştırılmıyor; profilde eğitim alanı yok.
- [ ] Açık kalan: beceri sözlüğü sınırlı (~120 terim); sözlük dışı beceriler gereksinim olarak yakalanmaz. Sözlük/alan genişletilebilir.
- [ ] Açık kalan: LinkedIn ilan metni çekimi sıklıkla hız sınırına takılabilir; çekilemeyen ilanlar "değerlendirilemedi" kalır.

## 4. "Mülakatta challenge edilebilecek alanlar & dürüst strateji" bölümü — TAMAMLANDI

- [x] Her risk için: ilan gereksinimi → profilde neden zayıf → **muhtemel soru** → **dürüst yaklaşım adımları** → profildeki **gerçek destekleyici deneyimler** → **örnek cevap taslağı** (`lib/interviewPrep.ts`).
- [x] Risk kaynağı madde 3'teki eksik gereksinimler: deneyim yılı farkı, sertifika, dil, beceri/araç (benzer araç deneyimi üzerinden köprü kurar, ör. Tableau eksikse SQL/Power BI).
- [x] Risk seviyesi (yüksek / orta / düşük); en fazla 6 risk, önem sırasıyla.
- [x] Profil düzeyi risk: başarı maddelerinde rakam yoksa "etkiyi ölçülebilir anlatın" uyarısı.
- [x] Soru ve cevap taslağı ilan dilinde (Türkçe ilan → Türkçe, aksi halde İngilizce); örnek cevaplar yalnızca profildeki bilgilerle kurulur, uydurma deneyim eklenmez. Arayüzde bunu belirten uyarı var.
- [ ] Açık kalan: davranışsal/genel mülakat soruları (zayıf yönler, ayrılma nedeni, maaş beklentisi) henüz yok; yalnızca ilana özel eksikler işleniyor.
- [ ] Açık kalan: örnek cevaplar şablon tabanlı; uzun ve çok eksikli ilanlarda tekrar eden ifadeler olabilir.

## 5. Worldwide remote tespiti — TAMAMLANDI

- [x] Doğrulama katmanı (`lib/remoteVerification.ts`): ilan sitesinin "Worldwide" etiketine tek başına güvenilmez. Durumlar: **doğrulandı** (metinde açık kanıt, kısıt yok), **doğrulanamadı / yalnızca etiket** (`likely`), **kapsam belirsiz** (düz "Remote"), **kısıtlı**, hibrit/ofis.
- [x] Kanıt: "work from anywhere", "anywhere in the world", küresel işe alım ("hire globally / 40 countries"), EOR/Deel/Remote.com vb., "adaylar her yerden kabul", aday ülkesinin açıkça kabulü ("Candidates from Turkey are welcome").
- [x] Kısıt: çalışma izni ("authorized to work in …"), ikamet ("must reside in …", "residents of …"), "Remote within EU / US only / UK-based", konum alanındaki ülke/bölge, ABD vatandaşlığı/clearance. Kısıtın adayın ülkesini kapsayıp kapsamadığı kontrol edilir (ör. Almanya'daki aday için "EU only" kısıt sayılmaz; vize sponsorluğu varsa çalışma izni şartı kısıt sayılmaz).
- [x] Yumuşak uyarılar: saat dilimi beklentisi (PST/EST/CET overlap, UTC aralığı), bağımsız yüklenici (contractor) modeli.
- [x] Karar: `doğrulandı` → uygun; `yalnızca etiket` → `canApply: unclear` ve en fazla `CONSIDER` ("işverene sorun" uyarısıyla); `kısıtlı` → ülke kilidi gibi `SKIP`; düz remote (kapsam belirsiz) → eskisi gibi `SKIP` (kanıt yok).
- [x] Detay penceresinde "Worldwide Remote Doğrulaması" kutusu: durum etiketi, kanıtlar (✓), kısıtlar (✗), uyarılar (⚠).
- [x] 18 senaryoluk test seti çalıştırıldı (kanıt/kısıt/etiket/sponsorluk/aday ülkesi varyasyonları). Gerçek taramada çıkan yanlış pozitif ("work from anywhere in your home country" kısıt, kanıt değil) düzeltilip teste eklendi.
- [ ] Açık kalan: şirketin kayıtlı ülkesi sinyali kullanılmıyor (ilan metninde/etikette yok).
- [ ] Açık kalan: kural tabanlı olduğu için serbest dilli kısıtlar (ör. "we can only hire in countries where we have an entity") yakalanmayabilir. Gerçek ilanlardan yanlış pozitif/negatif topladıkça kural seti genişletilmeli.
- [ ] Açık kalan: yalnızca İngilizce ifadeler; Türkçe/diğer dillerdeki ilanlar için kalıplar eklenmedi.

## 6. Meslek bazlı değerlendirme bölümü (Product Fit / Project Fit yerine)

- Sorun: İlan detayındaki "Ürün Yönetimi Uyumu (Product Fit)" ve "Proje & Teslimat Uyumu (Project Fit)" kutuları yalnızca PM/TPM mesleği için anlamlı. Diğer meslekler (ör. yazılım, tasarım, veri) için boş kalıyor. Şu an geçici çözüm olarak boş kutular gizleniyor.
- Hedef: Değerlendirme bölümü kullanıcının mesleğine göre dinamik olsun. Bölüm başlığı ve ölçütler meslek ailesinden gelsin (`lib/searchPlan.ts` içindeki meslek aileleri yeniden kullanılabilir):
  - Ürün: ürün keşfi, roadmap/backlog, PRD, paydaş yönetimi
  - Proje: teslimat takvimi, risk/bağımlılık yönetimi, koordinasyon
  - Yazılım: teknoloji yığını uyumu, mimari/ölçek deneyimi, ilgili alan bilgisi
  - Tasarım: araç/portfolyo uyumu, kullanıcı araştırması, tasarım sistemi deneyimi
  - Veri: araçlar (SQL, BI), analiz/modelleme deneyimi
  - Pazarlama / Satış / İK / Finans / Destek / QA / DevOps için de benzer ölçüt setleri
- Birden fazla aileyi hedefleyen profillerde (ör. PM + Proje) her aile için ayrı kutu gösterilsin; ilanın rolüyle ilgili olan öne çıksın.
- `JobAnalysis` tipindeki `productFit` / `projectFit` alanları genel bir yapıya (ör. `roleFit: { family, title, points[] }[]`) taşınsın; eski kayıtlarla uyumluluk için geçiş (fallback) düşünülsün.
- `roleType` (PRODUCT / PROJECT / HYBRID / OTHER) etiketi de meslek ailesine göre genelleştirilsin; şu an ürün/proje dışı her şey "Diğer" görünüyor.
- Kanban kartları ve tablo görünümündeki "canTR" rozetleri ile `canApplyFromTurkey` / `remoteFromTurkey` alan adları ev ülkesine göre yeniden adlandırılsın (ör. `canApplyFromHome`).

## v2

- [ ] **Şirket kariyer sayfaları için scraper** — İlanlarını yalnızca kendi sitelerinde yayınlayan şirketler için scraper. (Mükerrerlik için normalize URL kontrolü korunacak.)
