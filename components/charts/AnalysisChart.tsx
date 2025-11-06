import React from 'react';
import { InterviewAnswer } from '../../types';

interface AnalysisChartProps {
  answers: InterviewAnswer[];
}

export const AnalysisChart: React.FC<AnalysisChartProps> = ({ answers }) => {
  const data = answers.map((a, i) => ({
    name: `Q${i + 1}`,
    clarity: a.evaluation?.clarity || 0,
    confidence: a.evaluation?.confidence || 0,
    relevance: a.evaluation?.relevance || 0,
  }));

  const maxScore = 100;

  return (
    <div className="w-full h-72 p-4">
      <div className="flex h-full">
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between text-xs text-slate-500 h-full py-2">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
        </div>
        
        {/* Chart Area */}
        <div className="flex-grow flex justify-around border-l border-b border-slate-200 ml-2">
          {data.map((item) => (
            <div key={item.name} className="flex flex-col justify-end items-center h-full w-full px-2">
              <div className="flex justify-center items-end h-full w-full gap-1">
                {/* Clarity Bar */}
                <div 
                  className="w-1/3 bg-blue-400 rounded-t-sm" 
                  style={{ height: `${(item.clarity / maxScore) * 100}%` }}
                  title={`Clarity: ${item.clarity}%`}
                ></div>
                {/* Confidence Bar */}
                <div 
                  className="w-1/3 bg-purple-400 rounded-t-sm" 
                  style={{ height: `${(item.confidence / maxScore) * 100}%` }}
                  title={`Confidence: ${item.confidence}%`}
                ></div>
                {/* Relevance Bar */}
                <div 
                  className="w-1/3 bg-green-400 rounded-t-sm" 
                  style={{ height: `${(item.relevance / maxScore) * 100}%` }}
                  title={`Relevance: ${item.relevance}%`}
                ></div>
              </div>
              <span className="text-xs font-medium text-slate-600 mt-1">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
       <div className="flex justify-center items-center space-x-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-400"></div><span>Clarity</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-purple-400"></div><span>Confidence</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-400"></div><span>Relevance</span></div>
      </div>
    </div>
  );
};