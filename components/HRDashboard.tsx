import React, { useState } from 'react';
import { MOCK_CANDIDATES } from '../constants';
import { Candidate } from '../types';
import { UsersIcon } from './icons/UsersIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { FeedbackModal } from './FeedbackModal';

export const HRDashboard: React.FC = () => {
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-800';
        if (score >= 60) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">HR Dashboard</h1>
                <p className="text-slate-600 text-lg">Review candidate interview performance and provide feedback.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex items-center gap-3 mb-4">
                    <UsersIcon className="w-6 h-6 text-slate-500" />
                    <h2 className="text-xl font-bold text-slate-800">Interview Candidates</h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Candidate</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Overall Score</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">View Report</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {MOCK_CANDIDATES.map((candidate) => (
                                <tr key={candidate.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full object-cover" src={candidate.avatarUrl} alt={candidate.name} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-slate-900">{candidate.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{candidate.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreColor(candidate.interviewReport.overallScore)}`}>
                                            {candidate.interviewReport.overallScore}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => setSelectedCandidate(candidate)}
                                            className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1.5"
                                        >
                                            <ClipboardListIcon className="w-4 h-4" />
                                            View Report
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedCandidate && (
                <FeedbackModal 
                    candidate={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                />
            )}
        </div>
    );
};