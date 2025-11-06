import React from 'react';
import { View, PortalView } from '../App';

interface HeaderProps {
  setView: (view: View) => void;
  activeView: View;
  portalView: PortalView;
  setPortalView: (portalView: PortalView) => void;
}

export const Header: React.FC<HeaderProps> = ({ setView, activeView, portalView, setPortalView }) => {
  const navLinkClasses = (view: View) => 
    `cursor-pointer font-medium px-3 py-2 rounded-md text-sm transition-colors ${
      activeView === view
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;
    
  const portalToggleClasses = (pView: PortalView) =>
    `px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
      portalView === pView ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'
    }`;


  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <nav className="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <button onClick={() => setView('jobs')} className="flex items-center space-x-3">
            <div className="bg-slate-900 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-800">VentureView HR</span>
          </button>
          
          <div className="bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setPortalView('candidate')} className={portalToggleClasses('candidate')}>Candidate Portal</button>
            <button onClick={() => setPortalView('hr')} className={portalToggleClasses('hr')}>HR Portal</button>
          </div>

          {portalView === 'candidate' && (
            <div className="hidden md:flex items-center space-x-2">
              <button onClick={() => setView('jobs')} className={navLinkClasses('jobs')}>Job Board</button>
              <button onClick={() => setView('analyzer')} className={navLinkClasses('analyzer')}>Resume Analyzer</button>
              <button onClick={() => setView('interviewer')} className={navLinkClasses('interviewer')}>Mock Interview</button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <a href="#" className="text-slate-600 hover:text-slate-900 font-medium hidden md:block">For Employers</a>
          <button className="bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors">
            Sign In
          </button>
        </div>
      </nav>
    </header>
  );
};