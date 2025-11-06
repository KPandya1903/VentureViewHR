import React, { useState, useCallback } from 'react';
import { Job } from '../types';
import { generateCoverLetter } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { XCircleIcon } from './icons/XCircleIcon';


interface JobDetailModalProps {
  job: Job;
  onClose: () => void;
  resumeText: string;
  setResumeText: (text: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose, resumeText, setResumeText }) => {
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateClick = useCallback(async () => {
    if (!resumeText.trim()) {
      alert('Please paste your resume text first.');
      return;
    }
    setIsLoading(true);
    setGeneratedLetter('');
    try {
      const letter = await generateCoverLetter(job.description, resumeText);
      setGeneratedLetter(letter);
    } catch (error) {
      console.error(error);
      setGeneratedLetter('Sorry, an error occurred while generating your cover letter.');
    } finally {
      setIsLoading(false);
    }
  }, [resumeText, job.description]);

  const handleApplyClick = () => {
    alert(`Thank you for applying to ${job.title} at ${job.company}! (This is a mock application.)`);
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
              <p className="text-slate-600">{job.company} - {job.location}</p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
               <button 
                  onClick={handleApplyClick}
                  className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors hidden sm:block"
                >
                  One-Click Apply
                </button>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Job Description & Match Analysis */}
          <div>
            {job.matchResult && (
              <div className="mb-8 bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {job.matchResult.matchScore}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">Match Analysis</h3>
                </div>
                 <p className="text-slate-700 mb-4 text-sm">{job.matchResult.summary}</p>
                 <h4 className="font-semibold text-slate-800 text-sm mb-2">Missing Keywords</h4>
                 <ul className="space-y-1.5">
                    {job.matchResult.missingSkills.map(skill => (
                      <li key={skill} className="flex items-start gap-2 text-sm text-slate-600">
                        <XCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <span>{skill}</span>
                      </li>
                    ))}
                 </ul>
              </div>
            )}
            <h3 className="text-xl font-semibold mb-4 text-slate-800">Job Description</h3>
            <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          {/* Right Column: AI Cover Letter Generator */}
          <div className="bg-slate-50 p-6 rounded-lg border">
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="w-6 h-6 text-indigo-500" />
              <h3 className="text-xl font-semibold text-slate-800">AI Cover Letter Generator</h3>
            </div>
            
            <div>
              <label htmlFor="resume" className="block text-sm font-medium text-slate-700 mb-1">
                1. Your resume text
              </label>
              <textarea
                id="resume"
                rows={8}
                className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="Paste the text from your resume here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                disabled={isLoading}
              ></textarea>
            </div>
            
            <div className="my-4">
              <button
                onClick={handleGenerateClick}
                disabled={isLoading || !resumeText}
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
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    2. Generate Cover Letter
                  </>
                )}
              </button>
            </div>

            <div>
              <label htmlFor="cover-letter" className="block text-sm font-medium text-slate-700 mb-1">
                3. Your tailored cover letter
              </label>
              <textarea
                id="cover-letter"
                rows={12}
                className="w-full p-2 border border-slate-300 rounded-md bg-slate-100 shadow-inner focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="Your generated cover letter will appear here..."
                value={generatedLetter}
                readOnly
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
