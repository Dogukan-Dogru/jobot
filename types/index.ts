export type RoleType = 'PRODUCT' | 'PROJECT' | 'HYBRID' | 'OTHER';
export type WorkModel = 'remote' | 'hybrid' | 'onsite' | 'unknown';
export type JobStatus = 
  | 'new' 
  | 'reviewed' 
  | 'to_apply' 
  | 'applied' 
  | 'interview' 
  | 'offer' 
  | 'rejected' 
  | 'archived';

export type FinalVerdict = 'APPLY' | 'CONSIDER' | 'SKIP';

export interface EligibilityResult {
  canApplyFromTurkey: boolean | 'unclear';
  remoteFromTurkey: boolean | 'unclear';
  relocationOffered: boolean | 'unclear';
  visaSponsorship: 'offered' | 'not_offered' | 'unclear';
  summary: string;
}

export interface InterviewRisk {
  requirement: string;
  candidateExperience: string;
  gap: string;
  honestStrategy: string;
  /** Risk seviyesi: yüksek (kritik/zorunlu eksik), orta, düşük */
  severity?: 'high' | 'medium' | 'low';
  /** Mülakatçının muhtemel sorusu */
  likelyQuestion?: string;
  /** Profildeki gerçek bilgilerden üretilen örnek cevap taslağı */
  sampleAnswer?: string;
  /** Dürüst cevap için adım adım yaklaşım */
  strategySteps?: string[];
  /** Profilinizdeki destekleyici gerçek deneyim maddeleri */
  supportingEvidence?: string[];
}

export interface JobAnalysis {
  roleType: RoleType;
  eligibility: EligibilityResult;
  strongMatches: string[];
  transferableExperience: string[];
  gaps: string[];
  productFit: string[];
  projectFit: string[];
  experienceToEmphasize: string[];
  redFlags: string[];
  interviewRisks: InterviewRisk[];
  finalVerdict: FinalVerdict;
  oneSentenceReason: string;
  /** İlan gereksinimlerinin profille karşılanma yüzdesi (gereksinim bulunamadıysa tanımsız) */
  /** Worldwide remote doğrulaması: kanıtlar, kısıtlar ve durum */
  remoteVerification?: {
    status: 'confirmed' | 'likely' | 'unverified' | 'restricted' | 'not_remote';
    evidence: string[];
    restrictions: string[];
    cautions: string[];
    summary: string;
  };
  matchScore?: number;
  /** İlan metninde karşılaştırılabilir gereksinim bulundu mu? (kısa/boş ilanlarda false) */
  requirementsAssessed?: boolean;
  requirements?: {
    kind: 'skill' | 'years' | 'cert' | 'language';
    label: string;
    level: 'required' | 'preferred';
    met: boolean | 'unknown';
    critical: boolean;
    detail?: string;
  }[];
  analyzedAt: string;
}

export interface ApplicationPackage {
  tailoredCvSummary: string;
  tailoredBulletPoints: {
    roleFlavor: 'Product Manager' | 'Project Manager' | 'Technical Product Manager';
    bullets: string[];
  }[];
  coverLetterEn: string;
  coverLetterTr: string;
  recruiterMessage: string; // Under 300 chars for LinkedIn
  screeningAnswers: {
    question: string;
    answer: string;
  }[];
  generatedAt: string;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  workModel: WorkModel;
  salary?: string;
  sourceUrl?: string;
  platform: 'linkedin' | 'kariyer' | 'indeed' | 'wellfound' | 'remoteok' | 'company' | 'other';
  rawDescription: string;
  dateAdded: string;
  status: JobStatus;
  notes?: string;
  analysis?: JobAnalysis;
  applicationPackage?: ApplicationPackage;
}

export interface MasterProfile {
  id: string;
  name: string;
  targetTitle: string;
  yearsOfExperience: number;
  currentLocation: string; // e.g. "Türkiye (Istanbul)"
  targetCountries: string[];
  targetCities?: string[];
  targetRoles: {
    primary: string[];
    secondary: string[];
    hybrid: string[];
  };
  coreExperience: {
    company: string;
    title: string;
    period: string;
    highlights: string[];
    fintechDomains: string[];
    technologies: string[];
    tools: string[];
  }[];
  projectManagementHighlights: string[];
  productManagementHighlights: string[];
  summary?: string;
  skills?: string[];
  workPreference?: 'remote' | 'hybrid' | 'onsite' | 'any';
  needsVisaSponsorship?: boolean;
  languages: { language: string; level: string }[];
  rawMarkdown: string;
}

export interface AppSettings {
  aiProvider: 'demo' | 'gemini' | 'openai' | 'claude';
  apiKey?: string;
  modelName?: string;
  language: 'tr' | 'en';
  theme: 'light' | 'dark' | 'system';
}
