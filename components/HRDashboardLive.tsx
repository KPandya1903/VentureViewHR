import React, { useState, useEffect } from 'react';

interface Application {
  id: number;
  candidate_name: string;
  candidate_email: string;
  company_name: string;
  position_title: string;
  status: string;
  overall_score: number;
  applied_at: string;
}

interface ApplicationDetail extends Application {
  resume_text: string;
  questions: Array<{
    id: number;
    question_text: string;
    question_type: string;
  }>;
  answers: Array<{
    video_url: string;
    transcript: string;
    clarity_score: number;
    confidence_score: number;
    relevance_score: number;
    feedback: string;
    dominant_emotion: string;
    nervousness_score: number;
    enthusiasm_score: number;
    authenticity_score: number;
    emotion_timeline: string;
    filler_word_count: number;
    fluency_score: number;
    word_count: number;
    speaking_pace: number;
  }>;
}

interface HRDashboardLiveProps {
  user: any;
}

export const HRDashboardLive: React.FC<HRDashboardLiveProps> = ({ user }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<ApplicationDetail | null>(null);
  const [filter, setFilter] = useState('all');
  const [hrNotes, setHrNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchApplications, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchApplications = async () => {
    const query = filter === 'all' ? '' : `?status=${filter}`;
    const res = await fetch(`http://localhost:3001/api/applications/hr${query}`);
    const data = await res.json();
    setApplications(data);
  };

  const fetchApplicationDetail = async (appId: number) => {
    setIsLoading(true);
    const res = await fetch(`http://localhost:3001/api/applications/${appId}`);
    const data = await res.json();
    setSelectedApp(data);
    setHrNotes(data.hr_notes || '');
    setIsLoading(false);
  };

  const handleDecision = async (status: 'accepted' | 'rejected' | 'next_round') => {
    if (!selectedApp) return;

    await fetch(`http://localhost:3001/api/applications/${selectedApp.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        hr_notes: hrNotes,
        reviewed_by: user.id,
      }),
    });

    alert(`Application ${status}!`);
    setSelectedApp(null);
    fetchApplications();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'next_round': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const parseEmotionTimeline = (timeline: string) => {
    try {
      return JSON.parse(timeline);
    } catch {
      return [];
    }
  };

  if (selectedApp) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <button
          onClick={() => setSelectedApp(null)}
          className="mb-4 text-indigo-600 hover:underline flex items-center gap-2"
        >
          ← Back to Applications
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{selectedApp.candidate_name}</h1>
              <p className="text-slate-600">{selectedApp.candidate_email}</p>
              <p className="text-lg mt-2">
                <strong>{selectedApp.position_title}</strong> at {selectedApp.company_name}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-indigo-600">{selectedApp.overall_score || 'N/A'}</div>
              <div className="text-sm text-slate-600">Overall Score</div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${getStatusColor(selectedApp.status)}`}>
                {selected App.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="border-t pt-4 mb-6">
            <h3 className="font-bold text-lg mb-2">Resume</h3>
            <div className="bg-slate-50 p-4 rounded-lg max-h-40 overflow-y-auto text-sm">
              {selectedApp.resume_text}
            </div>
          </div>
        </div>

        {/* Interview Answers */}
        <div className="space-y-6">
          {selectedApp.answers.map((answer, idx) => {
            const question = selectedApp.questions[idx];
            const emotionTimeline = parseEmotionTimeline(answer.emotion_timeline);

            return (
              <div key={idx} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start gap-2 mb-4">
                  <div className="bg-indigo-100 text-indigo-800 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{question.question_text}</p>
                    <span className="text-xs text-slate-500">{question.question_type.toUpperCase()}</span>
                  </div>
                </div>

                {/* Video */}
                <div className="mb-4 rounded-lg overflow-hidden border">
                  <video src={answer.video_url} controls className="w-full max-h-96"></video>
                </div>

                {/* Transcript */}
                <div className="bg-slate-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold text-slate-600 mb-1">Transcript:</p>
                  <p className="text-sm text-slate-700 italic">"{answer.transcript}"</p>
                </div>

                {/* AI Evaluation */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{answer.clarity_score}%</div>
                    <div className="text-xs text-blue-800">Clarity</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{answer.confidence_score}%</div>
                    <div className="text-xs text-purple-800">Confidence</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{answer.relevance_score}%</div>
                    <div className="text-xs text-green-800">Relevance</div>
                  </div>
                </div>

                <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold text-indigo-800 mb-1">AI Feedback:</p>
                  <p className="text-sm text-indigo-700">{answer.feedback}</p>
                </div>

                {/* Emotion & Behavioral Analysis */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-3">Emotion Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Dominant Emotion:</span>
                        <span className="font-bold">{answer.dominant_emotion}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Nervousness:</span>
                        <span className="font-bold">{answer.nervousness_score}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Enthusiasm:</span>
                        <span className="font-bold">{answer.enthusiasm_score}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Authenticity:</span>
                        <span className="font-bold">{answer.authenticity_score}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-3">Speech Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Word Count:</span>
                        <span className="font-bold">{answer.word_count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Filler Words:</span>
                        <span className="font-bold">{answer.filler_word_count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Fluency Score:</span>
                        <span className="font-bold">{answer.fluency_score}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Speaking Pace:</span>
                        <span className="font-bold">{answer.speaking_pace} wpm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* HR Decision Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6 sticky bottom-0">
          <h3 className="font-bold text-lg mb-4">Make Decision</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">HR Notes</label>
            <textarea
              value={hrNotes}
              onChange={(e) => setHrNotes(e.target.value)}
              rows={3}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Add notes about this candidate..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleDecision('accepted')}
              className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700"
            >
              ✓ Accept
            </button>
            <button
              onClick={() => handleDecision('next_round')}
              className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700"
            >
              → Next Round
            </button>
            <button
              onClick={() => handleDecision('rejected')}
              className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700"
            >
              ✗ Reject
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">HR Dashboard</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex gap-2">
        {['all', 'pending', 'completed', 'accepted', 'rejected', 'next_round'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Applied</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {applications.map(app => (
              <tr key={app.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{app.candidate_name}</div>
                  <div className="text-sm text-slate-500">{app.candidate_email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{app.position_title}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{app.company_name}</td>
                <td className="px-6 py-4">
                  <span className="text-lg font-bold text-indigo-600">{app.overall_score || 'N/A'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                    {app.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(app.applied_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => fetchApplicationDetail(app.id)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                  >
                    View Details →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};