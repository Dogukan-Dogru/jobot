# 🤖 JoBot — AI Destekli İş Arama & Kariyer Asistanı

> **Kurulumsuz, web tabanlı ve tüm platformlarda (Windows, Mac, iOS, Android) doğrudan çalışan yapay zeka kariyer copilot'u.**

JoBot; LinkedIn, Kariyer.net ve küresel iş ilanlarını 10 adımlı filtreleme mantığıyla analiz eder, Türkiye'den başvuru ve vize uygunluğunu denetler, ilana özel CV maddeleri, ön yazı (cover letter) ve LinkedIn mesajları üretir.

---

## 🚀 Temel Özellikler

1. **Sıfır Kurulum & Tam Çapraz Platform:**
   - Herhangi bir `.exe`, `.dmg` indirmeden doğrudan tarayıcı üzerinden çalışır.
   - PWA desteği sayesinde masaüstüne veya cep telefonuna tek tıkla ikon olarak eklenebilir.
2. **Kişiye Özel Master Profil:**
   - Product Manager & Project Manager (Fintech, SoftPOS, B2B SaaS, E-ticaret) odaklı varsayılan profil.
   - Görsel form veya `MASTER_PROFILE.md` markdown formatında düzenlenebilir.
3. **10 Adımlı Akıllı İlan Analizi:**
   - **Kritik Uygunluk (Eligibility):** Türkiye'den uzaktan çalışma (Remote worldwide / EOR / Deel), Vize Sponsorluğu ve Relokasyon kontrolü.
   - **Rol Ayrıştırması:** PM unvanı altındaki teknik proje teslimatı sorumluluklarını Project Manager ilanlarında aktarılabilir deneyim (transferable) olarak eşleştirir.
   - **Dürüstlük İlkesi:** Sahte deneyim uydurmaz, eksikleri net olarak etiketler.
   - **Karar:** `APPLY` (Başvur), `CONSIDER` (İncele) veya `SKIP` (Pas geç) gerekçesi.
4. **Başvuru Paketi Üreticisi:**
   - İlana özel Product Manager ve Project Manager odaklı CV maddeleri.
   - İngilizce & Türkçe profesyonel Ön Yazı (Cover Letter).
   - 300 karakter altı canlı sayaçlı LinkedIn Recruiter mesajı.
   - Tarama mülakatı sorularına hazır dürüst yanıtlar.
5. **İş Takip Boru Hattı (Pipeline):**
   - Kanban panosu: `İncelenecek` ➔ `Başvurulacak` ➔ `Başvuruldu` ➔ `Mülakat` ➔ `Teklif/Red`.
   - Detaylı Tablo görünümü ve arama/filtreleme.
   - Google Sheets ve Excel için tek tıkla CSV çıktısı.
6. **Gizlilik & Çoklu AI Desteği:**
   - Dahili Akıllı Analiz Motoru ile hiçbir API key gerektirmeden çalışabilir.
   - Google Gemini (ücretsiz API) veya OpenAI (GPT-4o) bağlama imkanı.
   - Tüm veriler yerel tarayıcı hafızasında saklanır.

---

## 🛠️ Yerel Geliştirme (Local Setup)

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# veya Üretim derlemesi alıp çalıştırın
npm run build
npm run start
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açarak hemen kullanabilirsiniz.

---

## 🌐 Herkes İçin Canlıya Alma (Vercel / Netlify)

Bu projeyi başkalarının kurulumsuz linke tıklayarak kullanabilmesi için:
1. GitHub reponuza push edin.
2. [Vercel](https://vercel.com) hesabınıza girip `jobot` reposunu seçerek **Deploy** butonuna basın.
3. Size verilen canlı URL'yi dilediğiniz kişiyle paylaşabilirsiniz!
