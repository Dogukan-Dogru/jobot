"use client";

import React, { useState } from "react";
import { MasterProfile } from "@/types";
import { Plus, X } from "lucide-react";
import { COUNTRY_OPTIONS, TARGET_OPTIONS, composeLocation, parseLocation } from "@/lib/geo";

const inputCls =
  "w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none";
const labelCls = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1";

interface TagInputProps {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  listId?: string;
}

const TagInput: React.FC<TagInputProps> = ({ value, onChange, placeholder, suggestions, listId }) => {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const next = [...value];
    for (const p of parts) if (!next.some((n) => n.toLowerCase() === p.toLowerCase())) next.push(p);
    onChange(next);
    setDraft("");
  };
  return (
    <div className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 text-xs font-semibold pl-2.5 pr-1.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
            {t}
            <button type="button" aria-label={`${t} sil`} onClick={() => onChange(value.filter((v) => v !== t))} className="text-slate-400 hover:text-rose-600 cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={draft}
        list={listId}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        className={inputCls}
      />
      {suggestions && listId && (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </div>
  );
};

interface ProfileFormProps {
  value: MasterProfile;
  onChange: (p: MasterProfile) => void;
  /** CV'den emin olunamayan alanlar; kullanıcı dikkatini çekmek için işaretlenir */
  uncertain?: string[];
  idPrefix?: string;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ value, onChange, uncertain = [], idPrefix = "pf" }) => {
  const set = (patch: Partial<MasterProfile>) => onChange({ ...value, ...patch });
  const home = parseLocation(value.currentLocation);
  const warn = (key: string) => (uncertain.includes(key) ? " ring-2 ring-amber-400 border-amber-400" : "");
  const hint = (key: string) =>
    uncertain.includes(key) ? <span className="ml-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">CV&apos;den çıkarılamadı, kontrol edin</span> : null;

  const updateExp = (idx: number, patch: Partial<MasterProfile["coreExperience"][number]>) => {
    const next = value.coreExperience.map((e, i) => (i === idx ? { ...e, ...patch } : e));
    set({ coreExperience: next });
  };

  return (
    <div className="space-y-6">
      {/* Temel bilgiler */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor={`${idPrefix}-name`}>Ad Soyad *{hint("name")}</label>
          <input id={`${idPrefix}-name`} type="text" value={value.name} onChange={(e) => set({ name: e.target.value })} className={inputCls + warn("name")} />
        </div>
        <div>
          <label className={labelCls} htmlFor={`${idPrefix}-title`}>Hedef Ünvan *{hint("targetTitle")}</label>
          <input id={`${idPrefix}-title`} type="text" value={value.targetTitle} onChange={(e) => set({ targetTitle: e.target.value })} placeholder="ör. Senior Product Manager" className={inputCls + warn("targetTitle")} />
        </div>
        <div>
          <label className={labelCls} htmlFor={`${idPrefix}-country`}>Yaşadığınız Ülke *{hint("currentLocation")}</label>
          <input id={`${idPrefix}-country`} type="text" list={`${idPrefix}-countries`} value={home.country} onChange={(e) => set({ currentLocation: composeLocation(e.target.value, home.city) })} placeholder="ör. Türkiye" className={inputCls + warn("currentLocation")} />
          <datalist id={`${idPrefix}-countries`}>
            {COUNTRY_OPTIONS.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className={labelCls} htmlFor={`${idPrefix}-city`}>Yaşadığınız Şehir</label>
          <input id={`${idPrefix}-city`} type="text" value={home.city} onChange={(e) => set({ currentLocation: composeLocation(home.country, e.target.value) })} placeholder="ör. İstanbul" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor={`${idPrefix}-years`}>Toplam Deneyim (yıl){hint("yearsOfExperience")}</label>
          <input id={`${idPrefix}-years`} type="number" min={0} max={60} value={value.yearsOfExperience} onChange={(e) => set({ yearsOfExperience: Math.max(0, Number(e.target.value) || 0) })} className={inputCls + warn("yearsOfExperience")} />
        </div>
      </div>

      {/* Roller */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Birincil Hedef Roller{hint("targetRoles")}</label>
          <TagInput value={value.targetRoles.primary} onChange={(v) => set({ targetRoles: { ...value.targetRoles, primary: v } })} placeholder="Rol yazıp Enter'a basın" />
        </div>
        <div>
          <label className={labelCls}>İkincil / Yan Roller</label>
          <TagInput value={value.targetRoles.secondary} onChange={(v) => set({ targetRoles: { ...value.targetRoles, secondary: v } })} placeholder="Rol yazıp Enter'a basın" />
        </div>
      </div>

      {/* Konum tercihleri */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
        <div>
          <label className={labelCls}>Çalışmak İstediğiniz Ülkeler / Bölgeler</label>
          <TagInput value={value.targetCountries} onChange={(v) => set({ targetCountries: v })} placeholder="Ülke veya bölge seçin (Europe, European Union (EU), Global Remote), Enter'a basın" suggestions={TARGET_OPTIONS} listId={`${idPrefix}-target-countries`} />
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Bu listenin dışındaki ülkelerdeki ilanlar elenir. &quot;Global Remote&quot; ekleyerek dünya genelinde uzaktan ilanları da arayabilirsiniz.</p>
        </div>
        <div>
          <label className={labelCls}>Tercih Ettiğiniz Şehirler (isteğe bağlı)</label>
          <TagInput value={value.targetCities || []} onChange={(v) => set({ targetCities: v })} placeholder="Şehir yazıp Enter'a basın (ör. Berlin, Amsterdam)" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor={`${idPrefix}-wp`}>Çalışma Şekli Tercihi</label>
            <select id={`${idPrefix}-wp`} value={value.workPreference || "any"} onChange={(e) => set({ workPreference: e.target.value as MasterProfile["workPreference"] })} className={inputCls}>
              <option value="any">Fark etmez</option>
              <option value="remote">Sadece remote</option>
              <option value="hybrid">Hibrit olabilir</option>
              <option value="onsite">Ofiste olabilir</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mt-5 cursor-pointer">
            <input type="checkbox" checked={Boolean(value.needsVisaSponsorship)} onChange={(e) => set({ needsVisaSponsorship: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
            Yurtdışı ilanlar için vize sponsorluğuna / relokasyona ihtiyacım var
          </label>
        </div>
      </div>

      {/* Özet */}
      <div>
        <label className={labelCls} htmlFor={`${idPrefix}-sum`}>Kısa Özet</label>
        <textarea id={`${idPrefix}-sum`} rows={3} value={value.summary || ""} onChange={(e) => set({ summary: e.target.value })} className={inputCls} />
      </div>

      {/* Beceriler */}
      <div>
        <label className={labelCls}>Beceriler & Araçlar{hint("skills")}</label>
        <TagInput value={value.skills || []} onChange={(v) => set({ skills: v })} placeholder="Beceri yazıp Enter'a basın" />
      </div>

      {/* Deneyim */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className={labelCls + " mb-0"}>İş Deneyimi{hint("coreExperience")}</label>
          <button
            type="button"
            onClick={() => set({ coreExperience: [...value.coreExperience, { company: "", title: "", period: "", highlights: [], fintechDomains: [], technologies: [], tools: [] }] })}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Deneyim ekle
          </button>
        </div>
        {value.coreExperience.length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400">Henüz deneyim eklenmedi.</p>}
        {value.coreExperience.map((exp, idx) => (
          <div key={idx} className={"p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 space-y-2" + (uncertain.includes("coreExperience") && (!exp.company || !exp.title) ? " ring-2 ring-amber-400" : "")}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input type="text" aria-label="Ünvan" placeholder="Ünvan" value={exp.title} onChange={(e) => updateExp(idx, { title: e.target.value })} className={inputCls} />
              <input type="text" aria-label="Şirket" placeholder="Şirket" value={exp.company} onChange={(e) => updateExp(idx, { company: e.target.value })} className={inputCls} />
              <input type="text" aria-label="Dönem" placeholder="Dönem (ör. 2022 – Günümüz)" value={exp.period} onChange={(e) => updateExp(idx, { period: e.target.value })} className={inputCls} />
            </div>
            <textarea
              aria-label="Başarılar / sorumluluklar"
              rows={3}
              placeholder="Her satıra bir madde yazın"
              value={exp.highlights.join("\n")}
              onChange={(e) => updateExp(idx, { highlights: e.target.value.split("\n") })}
              className={inputCls}
            />
            <div className="flex justify-end">
              <button type="button" onClick={() => set({ coreExperience: value.coreExperience.filter((_, i) => i !== idx) })} className="text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer">
                Bu deneyimi sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Diller */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={labelCls + " mb-0"}>Diller{hint("languages")}</label>
          <button type="button" onClick={() => set({ languages: [...value.languages, { language: "", level: "" }] })} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Dil ekle
          </button>
        </div>
        {value.languages.map((l, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input type="text" aria-label="Dil" placeholder="Dil" value={l.language} onChange={(e) => set({ languages: value.languages.map((x, i) => (i === idx ? { ...x, language: e.target.value } : x)) })} className={inputCls} />
            <input type="text" aria-label="Seviye" placeholder="Seviye (ör. C1)" value={l.level} onChange={(e) => set({ languages: value.languages.map((x, i) => (i === idx ? { ...x, level: e.target.value } : x)) })} className={inputCls} />
            <button type="button" aria-label="Dili sil" onClick={() => set({ languages: value.languages.filter((_, i) => i !== idx) })} className="px-2 text-slate-400 hover:text-rose-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
