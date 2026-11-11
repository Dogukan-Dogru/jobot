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

## 3. İlan–CV eksiklik tespiti

- Sorun: İlan ile CV arasındaki eksikler belirlenemiyor, bu yüzden eşleşmeyen ilanlar öneriliyor.
- İlandan zorunlu/tercih edilen gereksinimleri (beceri, araç, deneyim yılı, sektör, sertifika) çıkar; profille karşılaştır.
- Çıktı: eşleşenler, **eksik gereksinimler**, aktarılabilir deneyimler; eksik sayısı/ağırlığı skoru düşürür.
- Kritik gereksinim (ör. zorunlu deneyim yılı, zorunlu sertifika) eksikse `SKIP`/düşük skor.
- Profil dinamik olacağı için (madde 1) karşılaştırma sabit aday metnine değil kullanıcının profiline dayanmalı.

## 4. "Mülakatta challenge edilebilecek alanlar & dürüst strateji" bölümü

- Şu an yeterince detaylı değil.
- Her risk için: ilanın hangi gereksinimi → profilde neden zayıf kalıyor → mülakatçının muhtemel sorusu → dürüst ve stratejik örnek cevap → destekleyen somut deneyim/rakam.
- Risk kaynağı madde 3'teki eksik/zayıf eşleşmeler olacak (maddeler birbirine bağlı).
- Her risk için öncelik/seviye (yüksek/orta/düşük).

## 5. Worldwide remote tespiti

- Şu an iyi çalışmıyor; geri bildirim geldi ama kanıtlanamadı.
- Ekstra kontrol katmanı düşün: metinde ülke/zaman dilimi/ikamet kısıtı, "EOR/Deel/contractor" ibaresi, şirketin kayıtlı ülkesi, "authorized to work in..." ifadeleri.
- Kesin kanıt yoksa "Worldwide Remote" etiketi yerine **"doğrulanamadı"** durumu göster; kullanıcıya belirsizlik açıkça söylenir.
- Gerçek ilanlardan test seti (doğru/yanlış pozitifler) toplayıp kuralları bununla doğrula.

---

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
