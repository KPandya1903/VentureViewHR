import React from 'react';
import { ScoreBreakdown } from '../types';

export const ScoreBar: React.FC<ScoreBreakdown> = ({ category, score, maxScore, feedback }) => {
  const percentage = (score / maxScore) * 100;
  const barColor = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <p className="font-medium text-slate-700 text-sm">{category}</p>
        <p className="font-semibold text-slate-800 text-sm">{score}/{maxScore}</p>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div className={`${barColor} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
      </div>
      <p className="text-xs text-slate-500 mt-1.5">{feedback}</p>
    </div>
  );
};