import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { createBlob } from '../utils/audio';
import { MicIcon } from './icons/MicIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';

interface InterviewRecorderProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  onRecordingComplete: (transcript: string, videoUrl: string) => void;
}

// Get API keys from environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

type Status = 'idle' | 'awaiting_permission' | 'ready' | 'recording' | 'processing' | 'uploading' | 'error';

export const InterviewRecorder: React.FC<InterviewRecorderProps> = ({ 
  question, 
  questionNumber, 
  totalQuestions, 
  onRecordingComplete 
}) => {
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef('');

  // Refs for Gemini Live session
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const cleanupMedia = useCallback(() => {
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    // Clean up video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    // Disconnect script processor
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    // Close live session
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close()).catch(() => {});
      sessionPromiseRef.current = null;
    }
    // Stop media recorder if it's still running
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
  }, []);

  // Ensure cleanup on component unmount
  useEffect(() => {
    return cleanupMedia;
  }, [cleanupMedia]);

  const initMedia = async () => {
    if (status !== 'idle') return;

    // Reset state
    setError(null);
    setTranscript('');
    transcriptRef.current = '';
    recordedChunksRef.current = [];

    // Check configuration
    if (!GEMINI_API_KEY || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setError("API keys are not configured. Please check your .env.local file.");
      setStatus('error');
      return;
    }

    setStatus('awaiting_permission');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus('ready');
    } catch (err) {
      console.error("Error getting media devices:", err);
      setError("Could not access camera and microphone. Please check browser permissions.");
      setStatus('error');
    }
  };
  
  const startRecordingAndTranscription = async () => {
    if (status !== 'ready' || !streamRef.current) return;
    
    setStatus('recording');
    recordedChunksRef.current = [];

    // 1. Start MediaRecorder
    try {
      // Use webm with vp9 codec for better compatibility
      const options = { mimeType: 'video/webm;codecs=vp9' };
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
    } catch (e) {
      // Fallback to default if vp9 not supported
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
    }

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorderRef.current.onstop = handleUpload;
    
    // Record in chunks every 100ms for smoother data
    mediaRecorderRef.current.start(100);

    // 2. Start Live Transcription
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      // @ts-ignore
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
      scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    
      scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        sessionPromiseRef.current?.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
        }).catch(() => {});
      };
    
      mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
      scriptProcessorRef.current.connect(audioContextRef.current.destination);
    
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onmessage: (message) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              transcriptRef.current += text;
              setTranscript(prev => prev + text);
            }
          },
          onerror: (e) => {
            console.error('Live session error:', e);
          },
        },
        config: {
          inputAudioTranscription: {},
          responseModalities: [Modality.AUDIO],
        },
      });
    } catch (err) {
      console.error("Failed to start transcription:", err);
      setError("Could not start live transcription service. Recording will continue without transcript.");
    }
  };

  const stopRecording = () => {
    if (status !== 'recording' || !mediaRecorderRef.current) return;
    
    setStatus('processing');
    
    // Stop the transcription audio chain first
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close()).catch(() => {});
      sessionPromiseRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop recording - this will trigger onstop which calls handleUpload
    mediaRecorderRef.current.stop();
  };

  const handleUpload = async () => {
    if (recordedChunksRef.current.length === 0) {
      setError("No video was recorded. Please try again.");
      setStatus('ready');
      return;
    }

    setStatus('uploading');
    console.log('Starting upload...', recordedChunksRef.current.length, 'chunks');

    const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
    console.log('Video blob size:', videoBlob.size, 'bytes');

    const formData = new FormData();
    formData.append('file', videoBlob, `interview-q${questionNumber}-${Date.now()}.webm`);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('resource_type', 'video');

    try {
      console.log('Uploading to Cloudinary...');
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary error:', errorData);
        throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data.secure_url);

      // Store the transcript before cleanup
      const finalTranscript = transcriptRef.current || "No transcript available";
      const videoUrl = data.secure_url;

      // Cleanup media resources
      cleanupMedia();
      
      // Small delay to ensure cleanup completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Pass transcript and video URL to parent - THIS MOVES TO NEXT QUESTION
      console.log('Calling onRecordingComplete with:', { transcript: finalTranscript, videoUrl });
      onRecordingComplete(finalTranscript, videoUrl);

    } catch (err) {
      console.error("Upload failed:", err);
      setError(`Failed to upload video: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
      setStatus('error');
    }
  };

  const renderButton = () => {
    switch (status) {
      case 'idle':
        return (
          <button 
            onClick={initMedia} 
            className="bg-indigo-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Prepare Camera & Mic
          </button>
        );
      case 'awaiting_permission':
        return (
          <button 
            disabled 
            className="bg-slate-400 text-white font-semibold py-3 px-8 rounded-lg cursor-not-allowed"
          >
            Awaiting Permissions...
          </button>
        );
      case 'ready':
        return (
          <button 
            onClick={startRecordingAndTranscription} 
            className="bg-green-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors"
          >
            Start Recording Answer
          </button>
        );
      case 'recording':
        return (
          <button 
            onClick={stopRecording} 
            className="bg-red-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-red-700 transition-colors"
          >
            Stop Recording
          </button>
        );
      case 'processing':
        return (
          <button 
            disabled 
            className="bg-slate-400 text-white font-semibold py-3 px-8 rounded-lg flex items-center gap-2 cursor-not-allowed"
          >
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </button>
        );
      case 'uploading':
        return (
          <button 
            disabled 
            className="bg-slate-400 text-white font-semibold py-3 px-8 rounded-lg flex items-center gap-2 cursor-not-allowed"
          >
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading to Cloud...
          </button>
        );
      case 'error':
        return (
          <button 
            onClick={initMedia} 
            className="bg-slate-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Try Again
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border max-w-4xl mx-auto">
      <div className="text-center mb-4">
        <p className="text-sm font-semibold text-indigo-600">Question {questionNumber} of {totalQuestions}</p>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{question}</h2>
      </div>

      <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden mb-4 shadow-inner flex items-center justify-center">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover"></video>
        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-black bg-opacity-50">
            <VideoCameraIcon className="w-16 h-16 mb-4" />
            <h3 className="text-lg font-semibold text-white">Camera Preview</h3>
          </div>
        )}
        {status === 'recording' && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>REC</span>
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border min-h-[80px]">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-1">
          <MicIcon className="w-4 h-4" />
          <span>Live Transcript:</span>
        </div>
        <p className="text-slate-700 text-sm">{transcript || "Your transcribed answer will appear here..."}</p>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-6 text-center">
        {renderButton()}
      </div>
    </div>
  );
};