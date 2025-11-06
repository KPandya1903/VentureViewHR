import React, { useState, useCallback } from 'react';
import { generateInterviewQuestions, evaluateInterviewAnswers } from '../services/geminiService';
import { analyzeVideoEmotions, analyzeTranscriptBehavior } from '../services/humeService';
import { InterviewAnswer, InterviewAnalysisReport } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { InterviewRecorder } from './InterviewRecorder';
import { InterviewResults } from './InterviewResults';

interface MockInterviewProps {
  resumeText: string;
  setResumeText: (text: string) => void;
}

type InterviewStage = 'setup' | 'generating_questions' | 'ready' | 'in_progress' | 'analyzing' | 'complete';

export const MockInterview: React.FC<MockInterviewProps> = ({ resumeText, setResumeText }) => {
  const [stage, setStage] = useState<InterviewStage>('setup');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [analysisReport, setAnalysisReport] = useState<InterviewAnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateQuestions = useCallback(async () => {
    if (!resumeText.trim()) {
      setError('Please paste your resume to generate questions.');
      return;
    }
    setStage('generating_questions');
    setError(null);
    try {
      const generatedQuestions = await generateInterviewQuestions(resumeText);
      setQuestions(generatedQuestions);
      setStage('ready');
    } catch (err) {
      console.error(err);
      setError('Failed to generate interview questions. Please try again.');
      setStage('setup');
    }
  }, [resumeText]);

  const handleRecordingComplete = useCallback(async (transcript: string, videoUrl: string) => {
    console.log('🎯 handleRecordingComplete called!', { transcript, videoUrl });
    
    const newAnswer: InterviewAnswer = {
      question: questions[currentQuestionIndex],
      transcript: transcript,
      videoUrl: videoUrl,
    };
    const updatedAnswers = [...answers, newAnswer];
    console.log('📝 Updated answers:', updatedAnswers);
    setAnswers(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      console.log('➡️ Moving to next question:', currentQuestionIndex + 1);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, now analyze
      console.log('✅ All questions done, analyzing...');
      setStage('analyzing');
      
      try {
        // Run analysis in parallel for speed
        const analysisPromise = evaluateInterviewAnswers(updatedAnswers);
        
        // Analyze emotions for each video (this runs in background)
        const emotionPromises = updatedAnswers.map(async (answer) => {
          if (answer.videoUrl) {
            try {
              const [emotionData, behavioralData] = await Promise.all([
                analyzeVideoEmotions(answer.videoUrl),
                Promise.resolve(analyzeTranscriptBehavior(answer.transcript))
              ]);
              return { emotionData, behavioralData };
            } catch (err) {
              console.error('Emotion analysis failed:', err);
              return { emotionData: null, behavioralData: analyzeTranscriptBehavior(answer.transcript) };
            }
          }
          return { emotionData: null, behavioralData: analyzeTranscriptBehavior(answer.transcript) };
        });

        const [report, emotionResults] = await Promise.all([
          analysisPromise,
          Promise.all(emotionPromises)
        ]);

        // Merge emotion data into report
        const finalReport = {
          ...report,
          answers: report.answers.map((ans, idx) => ({
            ...ans,
            videoUrl: updatedAnswers[idx].videoUrl,
            emotionAnalysis: emotionResults[idx].emotionData,
            behavioralMetrics: emotionResults[idx].behavioralData,
          })),
        };

        setAnalysisReport(finalReport);
        setStage('complete');
      } catch (err) {
        console.error(err);
        setError('Failed to analyze your interview answers. Please try again.');
        setStage('in_progress');
      }
    }
  }, [questions, currentQuestionIndex, answers]);

  const handleStartOver = () => {
    setStage('setup');
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setAnalysisReport(null);
    setError(null);
  };

  const renderContent = () => {
    switch (stage) {
      case 'setup':
      case 'generating_questions':
        return (
          <div className="bg-white p-6 rounded-lg shadow-md border max-w-3xl mx-auto">
            <div className="flex items-start gap-2 mb-2">
              <DocumentTextIcon className="w-6 h-6 text-indigo-600 mt-1" />
              <div>
                <h2 className="block text-lg font-semibold text-slate-800">Your Resume</h2>
                <p className="text-sm text-slate-500">Paste your resume to generate a personalized mock interview.</p>
              </div>
            </div>
            <textarea
              id="resume-interview"
              rows={10}
              className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              disabled={stage === 'generating_questions'}
            ></textarea>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <div className="mt-4 text-center">
              <button
                onClick={handleGenerateQuestions}
                disabled={stage === 'generating_questions' || !resumeText}
                className="w-full md:w-auto flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
              >
                {stage === 'generating_questions' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    Generate Interview Questions
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="bg-white p-6 rounded-lg shadow-md border max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Your Interview is Ready</h2>
            <p className="text-slate-600 mb-6">Here are the questions we've prepared based on your resume. You'll answer them one by one.</p>
            <ul className="text-left space-y-2 mb-8 list-decimal list-inside bg-slate-50 p-4 rounded-md">
              {questions.map((q, i) => <li key={i} className="text-slate-700">{q}</li>)}
            </ul>
            <button
              onClick={() => setStage('in_progress')}
              className="bg-indigo-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start Interview
            </button>
          </div>
        );

      case 'in_progress':
        return (
          <InterviewRecorder
            key={currentQuestionIndex}
            question={questions[currentQuestionIndex]}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onRecordingComplete={handleRecordingComplete}
          />
        );

      case 'analyzing':
        return (
          <div className="text-center py-20">
            <svg className="animate-spin mx-auto h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <h2 className="mt-4 text-2xl font-bold text-slate-800">Analyzing Your Performance...</h2>
            <p className="text-slate-600">Our AI coach is reviewing your answers.</p>
          </div>
        );

      case 'complete':
        return analysisReport ? (
          <InterviewResults report={analysisReport} onStartOver={handleStartOver} />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">AI Mock Interview</h1>
        <p className="text-slate-600 text-lg">Practice your interview skills and get instant, AI-powered feedback.</p>
      </div>
      {renderContent()}
    </div>
  );
};