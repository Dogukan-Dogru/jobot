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
  ecommerceExperience: {
    company: string;
    role: string;
    period: string;
    details: string[];
  };
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
