"use client";

import Image from "next/image";
import React, { useRef, useState } from "react";
import { MasterProfile } from "@/types";
import { ProfileForm } from "@/components/ProfileForm";
import { emptyProfile, parseCvText, buildRawMarkdown } from "@/lib/cvParser";
import { extractCvText } from "@/lib/cvExtract";
import { ShieldCheck, Upload, FileText, Loader2, ArrowRight, PencilLine } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: (profile: MasterProfile) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<"choose" | "form">("choose");
  const [profile, setProfile] = useState<MasterProfile>(emptyProfile());
  const [uncertain, setUncertain] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const text = await extractCvText(file);
      if (!text || text.trim().length < 30) {
        setError("Bu dosyadan metin okunamadı (taranmış/görsel bir PDF olabilir). Formu elle doldurabilirsiniz.");
        setProfile(emptyProfile());
        setStage("form");
        return;
      }
      const parsed = parseCvText(text);
      setProfile(parsed.profile);
      setUncertain(parsed.uncertain);
      setNotice(
        parsed.uncertain.length === 0
          ? "CV'nizden bilgiler çıkarıldı. Lütfen her alanı kontrol edip gerekirse düzeltin."
          : "CV'nizden çıkarabildiğimiz bilgileri doldurduk. Sarı ile işaretli alanları kontrol edin veya tamamlayın."
      );
      setStage("form");
    } catch (e) {
      setError(e instanceof Error ? e.message : "CV okunurken bir hata oluştu.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const missing: string[] = [];
  if (!profile.name.trim()) missing.push("Ad Soyad");
  if (!profile.targetTitle.trim()) missing.push("Hedef Ünvan");
  if (!profile.currentLocation.trim()) missing.push("Yaşadığınız Yer");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (missing.length > 0) return;
    const cleaned: MasterProfile = {
      ...profile,
      id: "user-profile",
      name: profile.name.trim(),
      coreExperience: profile.coreExperience
        .map((x) => ({ ...x, highlights: x.highlights.map((h) => h.trim()).filter(Boolean) }))
        .filter((x) => x.title.trim() || x.company.trim()),
      languages: profile.languages.filter((l) => l.language.trim()),
      targetCountries: profile.targetCountries.length
        ? profile.targetCountries
        : [profile.currentLocation.split("(")[0].trim()].filter(Boolean)
    };
    cleaned.rawMarkdown = buildRawMarkdown(cleaned);
    onComplete(cleaned);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
            <Image src="/logo.png" alt="JoBot logosu" width={362} height={512} priority className="h-16 w-auto" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">JoBot&apos;a Hoş Geldiniz</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Size uygun ilanları bulabilmemiz için önce kısa bir profil oluşturalım.
          </p>
        </div>

        {/* Gizlilik açıklaması */}
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
            <strong>Verileriniz sizde kalır.</strong> CV&apos;nizi yalnızca formu hızlıca doldurmak için kullanıyoruz; dosya
            tarayıcınızda okunur ve hiçbir yere gönderilmez. Bilgileriniz sunucularımızda saklanmaz, sadece bu tarayıcıda
            tutulur. Tarayıcı verilerini silerseniz bilgileriniz de silinir.
          </p>
        </div>

        {stage === "choose" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
              className={`p-6 rounded-2xl border-2 border-dashed text-center space-y-3 bg-white dark:bg-slate-900 transition-colors ${dragOver ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" : "border-slate-300 dark:border-slate-700"}`}
            >
              <div className="mx-auto w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </div>
              <h2 className="text-sm font-bold">CV&apos;nizi yükleyin (önerilen)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">PDF, DOCX veya TXT • en fazla 8 MB. Bilgileri sizin yerinize doldururuz.</p>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl cursor-pointer inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> {busy ? "Okunuyor…" : "Dosya seç"}
              </button>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
              <div className="mx-auto w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <PencilLine className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold">Formu elle doldurun</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">CV yüklemek istemezseniz bilgilerinizi kendiniz girebilirsiniz.</p>
              <button type="button" onClick={() => { setProfile(emptyProfile()); setUncertain([]); setStage("form"); }} className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer inline-flex items-center gap-1.5">
                Elle doldur <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {error && <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}

        {stage === "form" && (
          <form onSubmit={submit} className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
            {notice && <p className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl p-3">{notice}</p>}
            <ProfileForm value={profile} onChange={setProfile} uncertain={uncertain} idPrefix="onb" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => { setStage("choose"); setError(""); }} className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
                ← Geri dön
              </button>
              <div className="flex items-center gap-3">
                {missing.length > 0 && <span className="text-xs text-amber-600 dark:text-amber-400">Zorunlu: {missing.join(", ")}</span>}
                <button type="submit" disabled={missing.length > 0} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer">
                  Kaydet ve başla <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
