import React from 'react';
import { InterviewAnalysisReport } from '../types';
import { AnalysisChart } from './charts/AnalysisChart';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface InterviewResultsProps {
  report: InterviewAnalysisReport;
  onStartOver: () => void;
}

export const InterviewResults: React.FC<InterviewResultsProps> = ({ report, onStartOver }) => {
  
  const scoreColor = report.overallScore >= 80 ? 'text-green-500' : report.overallScore >= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Your Interview Report</h1>
            <p className="text-slate-600 text-lg">Here's the AI-powered feedback on your performance.</p>
        </div>
        
        {/* --- SCORE & SUMMARY --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md border flex flex-col justify-center items-center">
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Overall Score</h3>
                <div className={`relative w-32 h-32`}>
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="text-slate-200" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className={`${scoreColor.replace('text-','stroke-')} transition-all duration-1000`} strokeWidth="3" fill="none" strokeDasharray={`${report.overallScore}, 100`} strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className={`absolute inset-0 flex items-center justify-center text-4xl font-bold ${scoreColor}`}>
                        {report.overallScore}
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-lg font-semibold text-slate-700 mb-2">AI Summary</h3>
                <p className="text-slate-600">{report.summary}</p>
            </div>
        </div>

        {/* --- CHART --- */}
        <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
             <h3 className="text-lg font-semibold text-slate-700 mb-4">Performance Breakdown</h3>
            <AnalysisChart answers={report.answers} />
        </div>

        {/* --- DETAILED FEEDBACK --- */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
             <h3 className="text-lg font-semibold text-slate-700 mb-4">Detailed Feedback</h3>
             <div className="space-y-6">
                 {report.answers.map((answer, index) => (
                    <div key={index} className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0">
                        <p className="font-semibold text-slate-800 mb-2">Q{index+1}: {answer.question}</p>
                        
                        {answer.videoUrl && (
                            <div className="my-3 rounded-lg overflow-hidden border shadow-sm bg-slate-100">
                                <video src={answer.videoUrl} controls className="w-full"></video>
                            </div>
                        )}
                        
                        <p className="text-sm text-slate-500 italic p-2 bg-slate-50 rounded-md mb-3">Your Answer: "{answer.transcript}"</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 text-center">
                            <div className="bg-blue-50 text-blue-800 p-2 rounded-md text-sm"><span className="font-bold">{answer.evaluation?.clarity}%</span> Clarity</div>
                             <div className="bg-purple-50 text-purple-800 p-2 rounded-md text-sm"><span className="font-bold">{answer.evaluation?.confidence}%</span> Confidence</div>
                             <div className="bg-green-50 text-green-800 p-2 rounded-md text-sm"><span className="font-bold">{answer.evaluation?.relevance}%</span> Relevance</div>
                        </div>
                        <div className="flex items-start gap-2">
                             <CheckCircleIcon className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-slate-700"><span className="font-semibold">Feedback:</span> {answer.evaluation?.feedback}</p>
                        </div>
                    </div>
                 ))}
             </div>
        </div>
        
        <div className="mt-8 text-center">
            <button
                onClick={onStartOver}
                className="bg-slate-800 text-white font-semibold py-3 px-8 rounded-lg hover:bg-slate-700 transition-colors"
            >
                Start New Interview
            </button>
        </div>
    </div>
  );
};