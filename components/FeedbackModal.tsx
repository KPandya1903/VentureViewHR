import React, { useState, useCallback } from 'react';
import { Candidate } from '../types';
import { generateCandidateFeedbackEmail } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';

interface FeedbackModalProps {
  candidate: Candidate;
  onClose: () => void;
}

type Tone = 'Encouraging' | 'Formal' | 'Direct';
type Decision = 'Offer' | 'Reject' | 'Next Round';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ candidate, onClose }) => {
  const [tone, setTone] = useState<Tone>('Encouraging');
  const [decision, setDecision] = useState<Decision>('Reject');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scoreColor = candidate.interviewReport.overallScore >= 80 ? 'text-green-500' : candidate.interviewReport.overallScore >= 50 ? 'text-yellow-500' : 'text-red-500';

  const handleGenerateClick = useCallback(async () => {
    setIsLoading(true);
    setGeneratedEmail('');
    try {
      const email = await generateCandidateFeedbackEmail(candidate.interviewReport, candidate.name, candidate.role, tone, decision);
      setGeneratedEmail(email);
    } catch (error) {
      console.error(error);
      setGeneratedEmail('Sorry, an error occurred while generating the feedback email.');
    } finally {
      setIsLoading(false);
    }
  }, [candidate, tone, decision]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{candidate.name}'s Report</h2>
              <p className="text-slate-600">Interview for {candidate.role}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Interview Report */}
          <div>
            <div className="flex items-center gap-4 mb-4">
                <div className={`text-4xl font-bold ${scoreColor}`}>{candidate.interviewReport.overallScore}</div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Overall Score</h3>
                    <p className="text-sm text-slate-600">{candidate.interviewReport.summary}</p>
                </div>
            </div>
            <div className="space-y-4">
              {candidate.interviewReport.answers.map((answer, index) => (
                <div key={index} className="bg-slate-50 p-3 rounded-md border">
                    <p className="text-sm font-semibold text-slate-700 mb-1">Q: {answer.question}</p>
                    <p className="text-xs text-slate-600 italic">A: "{answer.transcript}"</p>
                    <p className="text-xs text-slate-500 mt-2">Feedback: {answer.evaluation?.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: AI Feedback Generator */}
          <div className="bg-slate-50 p-6 rounded-lg border">
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="w-6 h-6 text-indigo-500" />
              <h3 className="text-xl font-semibold text-slate-800">Generate Feedback Email</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="tone" className="block text-sm font-medium text-slate-700 mb-1">Tone</label>
                <select id="tone" value={tone} onChange={e => setTone(e.target.value as Tone)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition">
                  <option>Encouraging</option>
                  <option>Formal</option>
                  <option>Direct</option>
                </select>
              </div>
              <div>
                <label htmlFor="decision" className="block text-sm font-medium text-slate-700 mb-1">Decision</label>
                <select id="decision" value={decision} onChange={e => setDecision(e.target.value as Decision)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition">
                  <option>Reject</option>
                  <option>Offer</option>
                  <option>Next Round</option>
                </select>
              </div>
            </div>
            
            <div className="my-4">
              <button
                onClick={handleGenerateClick}
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : 'Generate Email'}
              </button>
            </div>

            <div>
              <label htmlFor="feedback-email" className="block text-sm font-medium text-slate-700 mb-1">
                Generated Email
              </label>
              <textarea
                id="feedback-email"
                rows={12}
                className="w-full p-2 border border-slate-300 rounded-md bg-slate-100 shadow-inner focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="The generated feedback email will appear here..."
                value={generatedEmail}
                readOnly
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};