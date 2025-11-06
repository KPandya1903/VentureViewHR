import React from 'react';

interface MatchScoreBadgeProps {
  score: number;
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({ score }) => {
  const getBadgeClass = () => {
    if (score >= 80) {
      return 'bg-green-100 text-green-800';
    }
    if (score >= 60) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${getBadgeClass()}`}>
      <span>{score}%</span>
      <span className="font-medium hidden sm:inline">Match</span>
    </div>
  );
};
