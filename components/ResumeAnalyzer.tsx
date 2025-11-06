import React, { useState, useCallback, useRef } from 'react';
import { analyzeResume } from '../services/geminiService';
import { ResumeAnalysis } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ScoreBar } from './ScoreBar';
import { UploadIcon } from './icons/UploadIcon';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for pdfjs-dist from the import map
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.mjs';


interface ResumeAnalyzerProps {
  resumeText: string;
  setResumeText: (text: string) => void;
}

export const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({ resumeText, setResumeText }) => {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyzeClick = useCallback(async () => {
    if (!resumeText.trim()) {
      setError('Please paste your resume text or upload a PDF first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await analyzeResume(resumeText);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError('An error occurred while analyzing your resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [resumeText]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      return;
    }

    setIsParsingPdf(true);
    setError(null);
    setAnalysis(null);
    setResumeText('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
          fullText += pageText + '\n\n';
        }
        setResumeText(fullText.trim());
      } catch (pdfError) {
        console.error("Error parsing PDF:", pdfError);
        setError('Could not read the PDF file. It might be corrupted or protected.');
      } finally {
        setIsParsingPdf(false);
      }
    };
    reader.onerror = () => {
        setError('Failed to read the file.');
        setIsParsingPdf(false);
    }
    reader.readAsArrayBuffer(file);

    // Reset file input value to allow re-uploading the same file
    if(event.target) event.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const scoreColor = analysis ? (analysis.overallScore >= 80 ? 'text-green-500' : analysis.overallScore >= 50 ? 'text-yellow-500' : 'text-red-500') : 'text-slate-800';


  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">AI Resume Analyzer</h1>
        <p className="text-slate-600 text-lg">Get instant feedback to improve your resume and land more interviews.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
          <div className="flex items-start gap-2">
              <DocumentTextIcon className="w-6 h-6 text-indigo-600 mt-1 flex-shrink-0" />
              <div>
                  <h2 className="block text-lg font-semibold text-slate-800">
                      Your Resume
                  </h2>
                  <p className="text-sm text-slate-500">Paste your resume text below or upload a PDF to get started.</p>
              </div>
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf"
              className="hidden"
              disabled={isLoading || isParsingPdf}
            />
            <button 
              onClick={handleUploadClick}
              disabled={isLoading || isParsingPdf}
              className="w-full sm:w-auto flex justify-center items-center gap-2 bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
            >
              {isParsingPdf ? (
                <>
                   <svg className="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Parsing PDF...
                </>
              ) : (
                <>
                  <UploadIcon className="w-5 h-5" />
                  Upload PDF
                </>
              )}
            </button>
          </div>
        </div>

        <textarea
          id="resume"
          rows={10}
          className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          placeholder="e.g. John Doe - Software Engineer..."
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          disabled={isLoading || isParsingPdf}
        ></textarea>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <div className="mt-4 text-center">
            <button
                onClick={handleAnalyzeClick}
                disabled={isLoading || !resumeText || isParsingPdf}
                className="w-full md:w-auto flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors text-base"
            >
                {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                </>
                ) : (
                <>
                    <SparklesIcon className="w-5 h-5" />
                    Analyze My Resume
                </>
                )}
            </button>
        </div>
      </div>

      {analysis && (
        <div className="mt-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">Your Resume Analysis Report</h2>
            
            {/* --- SCORE & SUMMARY --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md border flex flex-col justify-center items-center">
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Overall Score</h3>
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path className="text-slate-200" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className={`${scoreColor.replace('text-','stroke-')} transition-all duration-1000`} strokeWidth="3" fill="none" strokeDasharray={`${analysis.overallScore}, 100`} strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className={`absolute inset-0 flex items-center justify-center text-4xl font-bold ${scoreColor}`}>
                            {analysis.overallScore}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">AI Summary</h3>
                    <p className="text-slate-600">{analysis.summary}</p>
                </div>
            </div>

            {/* --- SCORE BREAKDOWN --- */}
            <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Score Breakdown</h3>
                <div className="space-y-4">
                    {analysis.scoreBreakdown.map(item => <ScoreBar key={item.category} {...item} />)}
                </div>
            </div>

            {/* --- SUGGESTIONS --- */}
             <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Suggestions for Improvement</h3>
                <div className="space-y-4">
                    {analysis.suggestionsForImprovement.map((sugg, i) => (
                        <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                           <div className="bg-slate-50 p-2 border-b">
                                <p className="text-sm font-semibold text-slate-600">{sugg.area}</p>
                           </div>
                           <div className="p-4 text-sm">
                               <p className="text-slate-500 mb-1">Original:</p>
                               <p className="p-2 bg-red-50 text-red-800 rounded text-xs">"{sugg.originalText}"</p>
                               <p className="text-slate-500 mt-3 mb-1">Suggestion:</p>
                               <p className="p-2 bg-green-50 text-green-800 rounded text-xs">"{sugg.suggestion}"</p>
                           </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- SIDE-BY-SIDE --- */}
            <div>
                 <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">Optimized Resume Comparison</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <h4 className="font-semibold text-center mb-2">Original</h4>
                         <textarea readOnly value={resumeText} rows={20} className="w-full p-3 text-sm bg-slate-100 border border-slate-200 rounded-md shadow-inner" />
                     </div>
                     <div>
                         <h4 className="font-semibold text-center mb-2">AI Optimized</h4>
                         <textarea readOnly value={analysis.optimizedResume} rows={20} className="w-full p-3 text-sm bg-indigo-50 border border-indigo-200 rounded-md shadow-inner" />
                     </div>
                 </div>
            </div>
        </div>
      )}
    </div>
  );
};