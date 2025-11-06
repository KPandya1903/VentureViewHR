
import React from 'react';
import { Job } from '../types';
import { JobCard } from './JobCard';

interface JobListProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
}

export const JobList: React.FC<JobListProps> = ({ jobs, onSelectJob }) => {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-slate-700">No Jobs Found</h3>
        <p className="text-slate-500 mt-2">Try adjusting your search terms or filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map(job => (
        <JobCard key={job.id} job={job} onSelectJob={onSelectJob} />
      ))}
    </div>
  );
};
