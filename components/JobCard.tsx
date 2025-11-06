import React from 'react';
import { Job } from '../types';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { LocationIcon } from './icons/LocationIcon';
import { DollarIcon } from './icons/DollarIcon';
import { MatchScoreBadge } from './MatchScoreBadge';

interface JobCardProps {
  job: Job;
  onSelectJob: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onSelectJob }) => {
  return (
    <div 
      className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg border border-slate-200 transition-all duration-300 cursor-pointer"
      onClick={() => onSelectJob(job)}
    >
      <div className="flex items-start space-x-4">
        <img src={job.companyLogoUrl} alt={`${job.company} logo`} className="w-14 h-14 rounded-lg object-cover"/>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-indigo-600">{job.company}</p>
              <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              {job.isMatching && (
                <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                  <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Matching...
                </div>
              )}
              {job.matchResult && <MatchScoreBadge score={job.matchResult.matchScore} />}
              <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full hidden sm:block">{job.type}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-col md:flex-row md:items-center text-sm text-slate-600 gap-y-2 gap-x-6">
            <div className="flex items-center gap-1.5">
              <LocationIcon className="w-4 h-4 text-slate-400" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BriefcaseIcon className="w-4 h-4 text-slate-400" />
              <span>{job.tags.join(', ')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarIcon className="w-4 h-4 text-slate-400" />
              <span>{job.salary}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
