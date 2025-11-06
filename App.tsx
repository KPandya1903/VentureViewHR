import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { JobDetailModal } from './components/JobDetailModal';
import { ResumeAnalyzer } from './components/ResumeAnalyzer';
import { JobDiscoveryEngine } from './components/JobDiscoveryEngine';
import { MockInterview } from './components/MockInterview';
import { HRDashboard } from './components/HRDashboard';
import { Job } from './types';

export type View = 'jobs' | 'analyzer' | 'interviewer';
export type PortalView = 'candidate' | 'hr';

export default function App() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [view, setView] = useState<View>('jobs');
  const [resumeText, setResumeText] = useState('');
  const [portalView, setPortalView] = useState<PortalView>('candidate');

  const handleSelectJob = useCallback((job: Job) => {
    setSelectedJob(job);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedJob(null);
  }, []);

  const renderCandidateView = () => {
    switch(view) {
      case 'jobs':
        return <JobDiscoveryEngine 
                  onSelectJob={handleSelectJob} 
                  resumeText={resumeText}
                  setResumeText={setResumeText}
                />;
      case 'analyzer':
        return <ResumeAnalyzer 
                  resumeText={resumeText}
                  setResumeText={setResumeText}
                />;
      case 'interviewer':
        return <MockInterview
                  resumeText={resumeText}
                  setResumeText={setResumeText}
                />;
      default:
        return null;
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      <Header 
        setView={setView} 
        activeView={view} 
        portalView={portalView}
        setPortalView={setPortalView}
      />
      <main className="container mx-auto p-4 md:p-8">
        {portalView === 'candidate' ? renderCandidateView() : <HRDashboard />}
      </main>
      {selectedJob && (
        <JobDetailModal 
          job={selectedJob} 
          onClose={handleCloseModal} 
          resumeText={resumeText}
          setResumeText={setResumeText}
        />
      )}
    </div>
  );
}