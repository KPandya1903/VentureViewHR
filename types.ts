export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description: string;
  tags: string[];
  companyLogoUrl: string;
  isMatching?: boolean;
  matchResult?: MatchResult | null;
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface Suggestion {
  area: string;
  originalText: string;
  suggestion: string;
}

export interface ResumeAnalysis {
  overallScore: number;
  summary: string;
  scoreBreakdown: ScoreBreakdown[];
  suggestionsForImprovement: Suggestion[];
  optimizedResume: string;
}

export interface MatchResult {
  matchScore: number;
  summary: string;
  missingSkills: string[];
}

export interface InterviewEvaluation {
  clarity: number;
  confidence: number;
  relevance: number;
  feedback: string;
}

export interface InterviewAnswer {
  question: string;
  transcript: string;
  videoUrl?: string;
  evaluation?: InterviewEvaluation;
}

export interface InterviewAnalysisReport {
  overallScore: number;
  summary: string;
  answers: InterviewAnswer[];
}

export interface Candidate {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
  interviewReport: InterviewAnalysisReport;
}