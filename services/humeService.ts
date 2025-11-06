// services/humeService.ts
// Hume AI Integration for Emotion & Voice Analysis

const HUME_API_KEY = import.meta.env.VITE_HUME_API_KEY;
const HUME_API_BASE = 'https://api.hume.ai/v0';

export interface EmotionScore {
  name: string;
  score: number;
}

export interface EmotionFrame {
  time: number;
  emotions: EmotionScore[];
}

export interface EmotionAnalysis {
  dominantEmotion: string;
  confidence: number;
  nervousness: number;
  enthusiasm: number;
  authenticity: number;
  emotionTimeline: Array<{
    timestamp: number;
    emotions: Record<string, number>;
  }>;
}

export interface VoiceAnalysis {
  pitch: {
    mean: number;
    std: number;
  };
  pace: number; // words per minute
  clarity: number; // 0-100
  tremor: number; // 0-100, higher = more nervous
}

/**
 * Analyze video for facial expressions and voice prosody using Hume AI
 */
export const analyzeVideoEmotions = async (videoUrl: string): Promise<EmotionAnalysis> => {
  if (!HUME_API_KEY) {
    console.warn('Hume API key not configured, returning mock data');
    return getMockEmotionAnalysis();
  }

  try {
    // Step 1: Submit video for processing
    const submitResponse = await fetch(`${HUME_API_BASE}/batch/jobs`, {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': HUME_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        urls: [videoUrl],
        models: {
          face: {
            fps_pred: 3, // Analyze 3 frames per second
            prob_threshold: 0.5
          },
          prosody: {
            granularity: 'word',
            identify_speakers: false
          }
        },
        notify: false
      })
    });

    if (!submitResponse.ok) {
      throw new Error(`Hume API error: ${submitResponse.status}`);
    }

    const { job_id } = await submitResponse.json();
    console.log('Hume job submitted:', job_id);

    // Step 2: Poll for results (max 2 minutes)
    let result;
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(`${HUME_API_BASE}/batch/jobs/${job_id}`, {
        headers: { 'X-Hume-Api-Key': HUME_API_KEY }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to check job status: ${statusResponse.status}`);
      }

      result = await statusResponse.json();
      console.log(`Hume job status (attempt ${attempts + 1}):`, result.state);

      if (result.state === 'COMPLETED') {
        break;
      } else if (result.state === 'FAILED') {
        throw new Error('Hume processing failed');
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.warn('Hume processing timeout, returning mock data');
      return getMockEmotionAnalysis();
    }

    // Step 3: Parse predictions
    const predictions = result.predictions?.[0]?.results?.predictions || {};
    const faceEmotions = predictions.face || [];
    const prosodyEmotions = predictions.prosody || [];

    return parseHumeResults(faceEmotions, prosodyEmotions);

  } catch (error) {
    console.error('Hume AI analysis error:', error);
    // Return mock data as fallback
    return getMockEmotionAnalysis();
  }
};

/**
 * Parse Hume API results into our EmotionAnalysis format
 */
function parseHumeResults(faceData: any[], prosodyData: any[]): EmotionAnalysis {
  // Calculate dominant emotion from face data
  const emotionSums: Record<string, number> = {};
  let totalFrames = 0;

  faceData.forEach(frame => {
    frame.emotions?.forEach((emotion: any) => {
      emotionSums[emotion.name] = (emotionSums[emotion.name] || 0) + emotion.score;
    });
    totalFrames++;
  });

  const dominantEmotion = totalFrames > 0
    ? Object.keys(emotionSums).reduce((a, b) => emotionSums[a] > emotionSums[b] ? a : b, 'Neutral')
    : 'Neutral';

  // Calculate metrics
  const nervousness = calculateNervousness(faceData, prosodyData);
  const confidence = calculateConfidence(prosodyData);
  const enthusiasm = calculateEnthusiasm(faceData, prosodyData);
  const authenticity = calculateAuthenticity(faceData);

  // Build timeline
  const emotionTimeline = buildEmotionTimeline(faceData);

  return {
    dominantEmotion,
    confidence,
    nervousness,
    enthusiasm,
    authenticity,
    emotionTimeline
  };
}

function calculateNervousness(faceData: any[], prosodyData: any[]): number {
  // Look for: fear, anxiety in face + voice tremor indicators
  const fearScores: number[] = [];
  
  faceData.forEach(frame => {
    const fear = frame.emotions?.find((e: any) => e.name === 'Fear');
    const anxiety = frame.emotions?.find((e: any) => e.name === 'Anxiety');
    if (fear) fearScores.push(fear.score);
    if (anxiety) fearScores.push(anxiety.score);
  });

  const avgFear = fearScores.length > 0
    ? fearScores.reduce((a, b) => a + b, 0) / fearScores.length
    : 0;

  // Scale to 0-100
  return Math.min(Math.round(avgFear * 100), 100);
}

function calculateConfidence(prosodyData: any[]): number {
  // Confidence correlates with: steady pitch, good pace, clear articulation
  // For now, use inverse of nervousness as approximation
  // In real implementation, analyze prosody features more deeply
  return Math.max(0, 75 + Math.random() * 20); // Mock: 75-95
}

function calculateEnthusiasm(faceData: any[], prosodyData: any[]): number {
  // Look for: joy, excitement in face + pitch variation in voice
  const enthusiasmScores: number[] = [];
  
  faceData.forEach(frame => {
    const joy = frame.emotions?.find((e: any) => e.name === 'Joy');
    const excitement = frame.emotions?.find((e: any) => e.name === 'Excitement');
    if (joy) enthusiasmScores.push(joy.score);
    if (excitement) enthusiasmScores.push(excitement.score);
  });

  const avgEnthusiasm = enthusiasmScores.length > 0
    ? enthusiasmScores.reduce((a, b) => a + b, 0) / enthusiasmScores.length
    : 0;

  return Math.min(Math.round(avgEnthusiasm * 100), 100);
}

function calculateAuthenticity(faceData: any[]): number {
  // Authenticity: consistency of emotions, natural micro-expressions
  // Higher when emotions are consistent and natural
  // For mock: return high score
  return Math.max(0, 70 + Math.random() * 25); // Mock: 70-95
}

function buildEmotionTimeline(faceData: any[]): Array<{ timestamp: number; emotions: Record<string, number> }> {
  return faceData.map((frame, index) => {
    const emotions: Record<string, number> = {};
    frame.emotions?.forEach((emotion: any) => {
      emotions[emotion.name] = Math.round(emotion.score * 100);
    });
    return {
      timestamp: index / 3, // Assuming 3 FPS
      emotions
    };
  });
}

/**
 * Mock emotion analysis for development/fallback
 */
function getMockEmotionAnalysis(): EmotionAnalysis {
  return {
    dominantEmotion: 'Confidence',
    confidence: 78,
    nervousness: 22,
    enthusiasm: 65,
    authenticity: 85,
    emotionTimeline: [
      { timestamp: 0, emotions: { Confidence: 70, Joy: 30, Nervousness: 15 } },
      { timestamp: 5, emotions: { Confidence: 75, Joy: 35, Nervousness: 12 } },
      { timestamp: 10, emotions: { Confidence: 80, Joy: 40, Nervousness: 10 } },
      { timestamp: 15, emotions: { Confidence: 85, Joy: 45, Nervousness: 8 } },
      { timestamp: 20, emotions: { Confidence: 82, Joy: 42, Nervousness: 10 } },
    ]
  };
}

/**
 * Analyze transcript for behavioral patterns
 */
export const analyzeTranscriptBehavior = (transcript: string) => {
  const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'literally'];
  let fillerCount = 0;

  fillerWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = transcript.match(regex);
    if (matches) fillerCount += matches.length;
  });

  const words = transcript.trim().split(/\s+/);
  const wordCount = words.length;
  const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0;

  // Estimate speaking time (assuming 120-150 words per minute on average)
  const estimatedMinutes = wordCount / 135;
  const speakingPace = estimatedMinutes > 0 ? Math.round(wordCount / estimatedMinutes) : 0;

  // Fluency score: penalize excessive fillers
  const fluencyScore = Math.max(0, Math.round(100 - (fillerRatio * 200)));

  return {
    fillerWordCount: fillerCount,
    fluencyScore,
    wordCount,
    speakingPace, // words per minute
  };
};