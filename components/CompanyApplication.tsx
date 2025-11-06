import React, { useState, useEffect } from 'react';
import { InterviewRecorder } from './InterviewRecorder';
import { analyzeVideoEmotions, analyzeTranscriptBehavior } from '../services/humeService';

interface Company {
  id: number;
  name: string;
  logo_url: string;
  description: string;
}

interface JobPosition {
  id: number;
  title: string;
  description: string;
  requirements: string;
}

interface CompanyApplicationProps {
  user: any;
  onBack: () => void;
}

export const CompanyApplication: React.FC<CompanyApplicationProps> = ({ user, onBack }) => {
  const [stage, setStage] = useState<'select' | 'upload_resume' | 'interview' | 'complete'>('select');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<JobPosition | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [questionIds, setQuestionIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const res = await fetch('http://localhost:3001/api/companies');
    const data = await res.json();
    setCompanies(data);
  };

  const handleCompanySelect = async (company: Company) => {
    setSelectedCompany(company);
    const res = await fetch(`http://localhost:3001/api/companies/${company.id}/positions`);
    const data = await res.json();
    setPositions(data);
  };

  const handlePositionSelect = (position: JobPosition) => {
    setSelectedPosition(position);
    setStage('upload_resume');
  };

  const handleResumeSubmit = async () => {
    if (!resumeText.trim() || !selectedCompany || !selectedPosition) return;

    setIsLoading(true);

    try {
      // 1. Create application
      const appRes = await fetch('http://localhost:3001/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: user.id,
          job_position_id: selectedPosition.id,
          company_id: selectedCompany.id,
          resume_text: resumeText,
        }),
      });
      const { application_id } = await appRes.json();
      setApplicationId(application_id);

      // 2. Generate questions using Gemini
      const { generateInterviewQuestions } = await import('../services/geminiService');
      const technicalQuestions = await generateInterviewQuestions(resumeText);
      
      // Take 3 technical questions + 2 HR questions
      const selectedTechnical = technicalQuestions.slice(0, 3);
      const hrQuestions = [
        "Tell me about a time you faced a significant challenge at work. How did you handle it?",
        "Where do you see yourself in 5 years, and how does this role fit into your career goals?"
      ];
      
      const allQuestions = [...selectedTechnical, ...hrQuestions];
      setQuestions(allQuestions);

      // 3. Save questions to database
      const questionsData = allQuestions.map((q, idx) => ({
        question_text: q,
        question_type: idx < 3 ? 'technical' : 'hr',
        question_order: idx + 1,
      }));

      const qRes = await fetch(`http://localhost:3001/api/applications/${application_id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questionsData }),
      });

      // Get question IDs (for now, just use sequential IDs)
      setQuestionIds(allQuestions.map((_, idx) => idx + 1));

      setStage('interview');
    } catch (err) {
      console.error('Failed to create application:', err);
      alert('Failed to start interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingComplete = async (transcript: string, videoUrl: string) => {
    if (!applicationId) return;

    try {
      // Analyze the answer
      const { evaluateInterviewAnswers } = await import('../services/geminiService');
      const emotion = await analyzeVideoEmotions(videoUrl);
      const behavioral = analyzeTranscriptBehavior(transcript);

      const answer = {
        question: questions[currentQuestionIndex],
        transcript,
      };

      const evaluation = await evaluateInterviewAnswers([answer]);
      const answerEval = evaluation.answers[0].evaluation;

      // Save to database
      await fetch('http://localhost:3001/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          question_id: questionIds[currentQuestionIndex],
          video_url: videoUrl,
          transcript,
          evaluation: answerEval,
          emotion_analysis: emotion,
          behavioral_metrics: behavioral,
        }),
      });

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Calculate overall score
        const overallScore = evaluation.overallScore;
        await fetch(`http://localhost:3001/api/applications/${applicationId}/score`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ overall_score: overallScore }),
        });

        setStage('complete');
      }
    } catch (err) {
      console.error('Failed to save answer:', err);
    }
  };

  const renderContent = () => {
    switch (stage) {
      case 'select':
        return (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Select a Company</h2>
            
            {!selectedCompany ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {companies.map(company => (
                  <div
                    key={company.id}
                    onClick={() => handleCompanySelect(company)}
                    className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg cursor-pointer transition-all"
                  >
                    <img src={company.logo_url} alt={company.name} className="w-20 h-20 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-center mb-2">{company.name}</h3>
                    <p className="text-sm text-slate-600 text-center">{company.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button onClick={() => setSelectedCompany(null)} className="mb-4 text-indigo-600 hover:underline">
                  ← Back to companies
                </button>
                <h3 className="text-xl font-bold mb-4">Open Positions at {selectedCompany.name}</h3>
                <div className="space-y-4">
                  {positions.map(position => (
                    <div
                      key={position.id}
                      onClick={() => handlePositionSelect(position)}
                      className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg cursor-pointer transition-all"
                    >
                      <h4 className="text-lg font-bold text-slate-900">{position.title}</h4>
                      <p className="text-sm text-slate-600 mt-2">{position.description}</p>
                      <p className="text-xs text-slate-500 mt-2"><strong>Requirements:</strong> {position.requirements}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'upload_resume':
        return (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Apply for {selectedPosition?.title} at {selectedCompany?.name}
            </h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Your Resume</label>
              <textarea
                rows={12}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Paste your resume here..."
              />
            </div>
            <button
              onClick={handleResumeSubmit}
              disabled={isLoading || !resumeText.trim()}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {isLoading ? 'Generating Interview...' : 'Start Interview'}
            </button>
          </div>
        );

      case 'interview':
        return (
          <InterviewRecorder
            key={currentQuestionIndex}
            question={questions[currentQuestionIndex]}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onRecordingComplete={handleRecordingComplete}
          />
        );

      case 'complete':
        return (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Interview Complete!</h2>
            <p className="text-slate-600 mb-8">
              Thank you for completing your interview for <strong>{selectedPosition?.title}</strong> at <strong>{selectedCompany?.name}</strong>. 
              Our HR team will review your application and get back to you soon.
            </p>
            <button
              onClick={onBack}
              className="bg-indigo-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-indigo-700"
            >
              Return to Dashboard
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      {renderContent()}
    </div>
  );
};