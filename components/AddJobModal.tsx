"use client";

import React, { useState } from "react";
import { JobPosting, WorkModel } from "@/types";
import { 
  X, 
  Sparkles, 
  Link as LinkIcon, 
  FileText, 
  Building2, 
  MapPin, 
  DollarSign, 
  Globe, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJob: (jobData: Omit<JobPosting, "id" | "dateAdded" | "status">, runAiImmediately: boolean) => Promise<void>;
}

export const AddJobModal: React.FC<AddJobModalProps> = ({
  isOpen,
  onClose,
  onAddJob
}) => {
  const [activeTab, setActiveTab] = useState<"paste" | "link" | "presets">("paste");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlFetchMessage, setUrlFetchMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("Türkiye");
  const [workModel, setWorkModel] = useState<WorkModel>("remote");
  const [salary, setSalary] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [platform, setPlatform] = useState<JobPosting["platform"]>("linkedin");
  const [rawDescription, setRawDescription] = useState("");
  const [runAi, setRunAi] = useState(true);

  if (!isOpen) return null;

  const handleFetchUrl = async () => {
    if (!sourceUrl.trim()) return;
    setIsFetchingUrl(true);
    setUrlFetchMessage(null);

    try {
      const res = await fetch("/api/fetch-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl })
      });
      const data = await res.json();
      if (data.platform) setPlatform(data.platform);
      if (data.suggestedTitle && !title) setTitle(data.suggestedTitle);
      if (data.suggestedDescription && !rawDescription) setRawDescription(data.suggestedDescription);
      if (data.suggestedWorkModel) setWorkModel(data.suggestedWorkModel);
      setUrlFetchMessage(data.message || "Bağlantı algılandı.");
    } catch {
      setUrlFetchMessage("Bağlantı otomatik taranamadı. Lütfen ilan metnini elle yapıştırınız.");
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleApplyPreset = (type: "softpos" | "london" | "istanbul") => {
    if (type === "softpos") {
      setTitle("Product Manager - Mobile SoftPOS & Acquiring");
      setCompany("FinPay Global");
      setLocation("Berlin / Remote (EMEA)");
      setCountry("Germany");
      setWorkModel("remote");
      setSalary("€70,000 - €85,000");
      setPlatform("linkedin");
      setSourceUrl("https://linkedin.com/jobs/sample-softpos");
      setRawDescription(`We are seeking an experienced Product Manager to drive our SoftPOS and mobile acquiring technologies.
Key Responsibilities:
- Lead the roadmap for SoftPOS Android SDK and payment terminal merchant integrations.
- Manage compliance with EMVCo, Mastercard and Visa certification standards.
- Build merchant dashboards and self-service enrollment workflows.
- Coordinate delivery timelines with backend, mobile and QA engineering teams.
Requirements:
- 3+ years in payment technology or fintech product/project management.
- Deep familiarity with SoftPOS, HCE or payment SDK architectures.
- Experience with B2B dashboards and merchant operations.
Work arrangement: Remote EMEA (Türkiye eligible via Deel/EOR) or full relocation + visa sponsorship to Berlin.`);
    } else if (type === "london") {
      setTitle("Technical Project Manager - Payments API");
      setCompany("London BankTech");
      setLocation("London, UK (Hybrid 3 days/week)");
      setCountry("United Kingdom");
      setWorkModel("hybrid");
      setSalary("£65,000");
      setPlatform("linkedin");
      setSourceUrl("https://linkedin.com/jobs/sample-london");
      setRawDescription(`Seeking a Technical Project Manager in London for core banking integrations.
Strict Requirement: Candidates must have pre-existing right to work in the UK. No visa sponsorship provided.
Responsibilities:
- Manage Jira boards, dependency tracking and client technical delivery.
- Must attend the central London office 3 days per week.`);
    } else if (type === "istanbul") {
      setTitle("Kıdemli Ürün Yöneticisi - POS & Ödeme Geçitleri");
      setCompany("PayTR / B2B Finans");
      setLocation("İstanbul (Hibrit)");
      setCountry("Türkiye");
      setWorkModel("hybrid");
      setSalary("130.000 TL - 170.000 TL");
      setPlatform("kariyer");
      setSourceUrl("https://kariyer.net/ilan/sample-pos");
      setRawDescription(`Fintech şirketimiz için Sanal POS, SoftPOS ve Ödeme Yönlendirme (routing/taksit) altyapımızda görev alacak Ürün Yöneticisi arıyoruz.
Aranan Nitelikler:
- Ödeme sistemleri, SoftPOS ve üye işyeri panellerinde en az 3 yıl ürün yönetimi deneyimi.
- REST API entegrasyonları, teknik kabul kriterleri yazımı ve Jira kullanımı.
- Türkiye'de ikamet eden, hibrit çalışma modeline uyum sağlayabilecek adaylar.`);
    }
    setActiveTab("paste");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !rawDescription.trim()) {
      alert("Lütfen en az İlan Başlığı, Şirket Adı ve İlan Metnini doldurunuz.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddJob({
        title,
        company,
        location: location || "Belirtilmemiş",
        country: country || "Türkiye",
        workModel,
        salary: salary || undefined,
        sourceUrl: sourceUrl || undefined,
        platform,
        rawDescription
      }, runAi);
      onClose();
    } catch (err) {
      console.error(err);
      alert("İlan kaydedilirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Yeni İş İlanı Ekle</h2>
              <p className="text-xs text-slate-500">İlanı yapıştırın, JoBot 10 adımlı AI analiziyle eşleştirsin.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-100 px-6 bg-white gap-4">
          <button
            onClick={() => setActiveTab("paste")}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "paste"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Metin / Manuel Ekle</span>
          </button>
          <button
            onClick={() => setActiveTab("link")}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "link"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Link ile Getir</span>
          </button>
          <button
            onClick={() => setActiveTab("presets")}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "presets"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Hızlı Test Örnekleri</span>
          </button>
        </div>

        {/* Presets Tab View */}
        {activeTab === "presets" && (
          <div className="p-6 space-y-3 bg-slate-50/50">
            <p className="text-xs text-slate-600 mb-2">
              Sistemi hemen denemek için ChatGPT sohbetindeki kriterlere uygun gerçekçi test senaryolarından birine tıklayın:
            </p>
            <div 
              onClick={() => handleApplyPreset("softpos")}
              className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">🟢 Örnek 1: SoftPOS & Acquiring PM (Almanya / Remote)</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Hedef: APPLY</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Fintech, SoftPOS ve Deel/EOR ile Türkiye'den remote çalışma imkanı içeren ideal ilan.
              </p>
            </div>

            <div 
              onClick={() => handleApplyPreset("london")}
              className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900">🔴 Örnek 2: Londra TPM (Sponsorluk YOK / Yerel İzin Şart)</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800">Hedef: SKIP</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                İngiltere çalışma izni zorunlu tutan ve vize sponsorluğu vermeyen eleme testi örneği.
              </p>
            </div>

            <div 
              onClick={() => handleApplyPreset("istanbul")}
              className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">🔵 Örnek 3: Kariyer.net / İstanbul POS Ürün Yöneticisi</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Hedef: APPLY</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Türkiye içi hibrit, SoftPOS ve üye işyeri gereksinimi olan yerel ilan.
              </p>
            </div>
          </div>
        )}

        {/* Link Tab View */}
        {activeTab === "link" && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                İlan Bağlantısı (LinkedIn, Kariyer.net, Indeed, RemoteOK vb.)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/jobs/view/..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFetchUrl}
                  disabled={isFetchingUrl || !sourceUrl.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  {isFetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : "Çözümle"}
                </button>
              </div>
            </div>

            {urlFetchMessage && (
              <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>{urlFetchMessage}</span>
              </div>
            )}

            <p className="text-[11px] text-slate-500">
              💡 <strong>İpucu:</strong> LinkedIn ve Kariyer.net bot korumaları nedeniyle doğrudan bağlantıdan metin alamayabilir. En kesin ve hızlı yol, ilan sayfasındaki metni kopyalayıp <strong>Metin / Manuel Ekle</strong> sekmesine yapıştırmaktır.
            </p>
          </div>
        )}

        {/* Main Form (Always accessible or active on 'paste' tab) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                İlan / Pozisyon Başlığı *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  const val = e.target.value;
                  setTitle(val);
                  const low = val.toLowerCase();
                  if (low.includes("(hybrid)") || low.includes("[hybrid]") || low.includes("(hibrit)") || low.includes("[hibrit]")) {
                    setWorkModel("hybrid");
                  } else if (low.includes("(onsite)") || low.includes("[onsite]") || low.includes("(on-site)")) {
                    setWorkModel("onsite");
                  } else if (low.includes("(remote)") || low.includes("[remote]") || low.includes("(uzaktan)")) {
                    setWorkModel("remote");
                  }
                }}
                placeholder="Örn: Senior Product Manager - Payments"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Şirket Adı *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Örn: Stripe / PayFlow"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Şehir / Bölge
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Örn: Amsterdam / Remote"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ülke
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Örn: Netherlands, Türkiye, UK"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Çalışma Modeli
              </label>
              <select
                value={workModel}
                onChange={(e) => setWorkModel(e.target.value as WorkModel)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="remote">Remote (Uzaktan)</option>
                <option value="hybrid">Hibrit</option>
                <option value="onsite">Ofis (Yerinde)</option>
                <option value="unknown">Belirtilmemiş</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Platform / Kaynak
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as JobPosting["platform"])}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="linkedin">LinkedIn</option>
                <option value="kariyer">Kariyer.net</option>
                <option value="indeed">Indeed</option>
                <option value="wellfound">Wellfound / AngelList</option>
                <option value="remoteok">RemoteOK</option>
                <option value="company">Şirket Kariyer Sayfası</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maaş (Varsa)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="Örn: €70,000 / 120.000 TL"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                İlan Linki
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                İlan Açıklaması / Metni *
              </label>
              <span className="text-[11px] text-slate-400">
                {rawDescription.length} karakter
              </span>
            </div>
            <textarea
              required
              rows={6}
              value={rawDescription}
              onChange={(e) => setRawDescription(e.target.value)}
              placeholder="İlan metnini, aranan nitelikleri, sorumlulukları ve vize/lokasyon şartlarını buraya yapıştırın..."
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
            />
          </div>

          {/* AI Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-indigo-950">Kaydederken AI Analizini Otomatik Başlat</p>
                <p className="text-[11px] text-indigo-700/80">Türkiye uygunluğu, vize durumu ve eşleşme skorunu hemen üretir.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={runAi}
              onChange={(e) => setRunAi(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/25 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analiz Ediliyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>İlanı Kaydet & Analiz Et</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
