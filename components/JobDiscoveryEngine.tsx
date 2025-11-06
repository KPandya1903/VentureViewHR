import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { JobSearch } from './JobSearch';
import { JobList } from './JobList';
import { MOCK_JOBS } from '../constants';
import { Job } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { matchResumeToJob } from '../services/geminiService';

interface JobDiscoveryEngineProps {
    onSelectJob: (job: Job) => void;
    resumeText: string;
    setResumeText: (text: string) => void;
}

export const JobDiscoveryEngine: React.FC<JobDiscoveryEngineProps> = ({ onSelectJob, resumeText, setResumeText }) => {
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [isMatching, setIsMatching] = useState(false);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const titleMatch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
      const companyMatch = job.company.toLowerCase().includes(searchTerm.toLowerCase());
      const locationMatch = locationFilter === '' || job.location.toLowerCase() === locationFilter.toLowerCase();
      return (titleMatch || companyMatch) && locationMatch;
    });
  }, [jobs, searchTerm, locationFilter]);

  const uniqueLocations = useMemo(() => {
    const locations = new Set(MOCK_JOBS.map(job => job.location));
    return Array.from(locations);
  }, []);

  // Reset match results when resume text changes
  useEffect(() => {
    setJobs(currentJobs => currentJobs.map(j => ({...j, matchResult: null, isMatching: false})))
  }, [resumeText]);


  const handleFindMatch = useCallback(async () => {
    if (!resumeText.trim()) {
        alert("Please paste your resume before matching.");
        return;
    }

    setIsMatching(true);

    // Set loading state for visible jobs
    setJobs(currentJobs => currentJobs.map(j => 
        filteredJobs.some(fj => fj.id === j.id) 
        ? { ...j, isMatching: true, matchResult: null } 
        : j
    ));

    const matchPromises = filteredJobs.map(job => 
        matchResumeToJob(resumeText, job.description)
            .then(matchResult => ({ jobId: job.id, matchResult }))
            .catch(error => {
                console.error(`Failed to match job ${job.id}:`, error);
                return { jobId: job.id, matchResult: null }; // Handle error for individual job
            })
    );

    const results = await Promise.all(matchPromises);

    setJobs(currentJobs => {
        const jobsWithScores = new Map(results.map(r => [r.jobId, r.matchResult]));
        return currentJobs.map(job => {
            if (jobsWithScores.has(job.id)) {
                return { ...job, isMatching: false, matchResult: jobsWithScores.get(job.id) };
            }
            return job;
        });
    });

    setIsMatching(false);

  }, [resumeText, filteredJobs]);


  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 text-center">Find Your Next Opportunity</h1>
      <p className="text-slate-600 mb-8 text-center text-lg">Paste your resume to find the best job matches for you.</p>

      <div className="bg-white p-6 rounded-lg shadow-md border mb-8">
        <div className="flex items-start gap-2 mb-2">
            <DocumentTextIcon className="w-6 h-6 text-indigo-600 mt-1" />
            <div>
                <label htmlFor="resume-job-search" className="block text-lg font-semibold text-slate-800">
                    Your Resume
                </label>
                <p className="text-sm text-slate-500">Paste your resume to enable AI-powered job matching.</p>
            </div>
        </div>
        <textarea
            id="resume-job-search"
            rows={6}
            className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            placeholder="e.g. John Doe - Software Engineer..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            disabled={isMatching}
        ></textarea>
      </div>

      <JobSearch
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        locationFilter={locationFilter}
        onLocationFilterChange={setLocationFilter}
        locations={uniqueLocations}
      />
       <div className="my-6 text-center">
            <button
                onClick={handleFindMatch}
                disabled={isMatching || !resumeText}
                className="w-full md:w-auto flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors text-base"
            >
                {isMatching ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Matching Jobs...
                </>
                ) : (
                <>
                    <SparklesIcon className="w-5 h-5" />
                    Find My Match
                </>
                )}
            </button>
        </div>

      <JobList jobs={filteredJobs} onSelectJob={onSelectJob} />
    </div>
  );
};
