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

// --- Configuration ---
// IMPORTANT: You must configure both Gemini and Cloudinary below for video recording to work.

// 1. Get your Gemini API Key from Google AI Studio: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = "AIzaSyBqMJ--2s3mSMOpEv1bJTObV3INOkezthk";

// 2. Get your Cloudinary Cloud Name from your dashboard: https://cloudinary.com/console
const CLOUDINARY_CLOUD_NAME = "dnsq5kvpj";

// 3. Create an "Unsigned" Upload Preset in Cloudinary Settings > Upload
const CLOUDINARY_UPLOAD_PRESET = "ventureview";


type Status = 'idle' | 'awaiting_permission' | 'ready' | 'recording' | 'processing' | 'error';


export const InterviewRecorder: React.FC<InterviewRecorderProps> = ({ question, questionNumber, totalQuestions, onRecordingComplete }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    if(mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }
    // Close live session
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
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
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE' || CLOUDINARY_CLOUD_NAME === 'YOUR_CLOUDINARY_CLOUD_NAME_HERE' || CLOUDINARY_UPLOAD_PRESET === 'YOUR_CLOUDINARY_UPLOAD_PRESET_HERE') {
      setError("API keys are not configured. Please add them in components/InterviewRecorder.tsx.");
      setStatus('error');
      return;
    }

    setStatus('awaiting_permission');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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
    mediaRecorderRef.current = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
        }
    };
    mediaRecorderRef.current.onstop = handleUpload;
    mediaRecorderRef.current.start();

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
            });
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
                    setError("A live transcription error occurred.");
                },
            },
            config: {
                inputAudioTranscription: {},
                responseModalities: [Modality.AUDIO], // Required but we won't use audio output
            },
        });
    } catch (err) {
        console.error("Failed to start transcription:", err);
        setError("Could not start live transcription service.");
        // Stop recording if transcription fails to start
        if(mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setStatus('error');
    }
  };

  const stopRecording = () => {
    if (status !== 'recording' || !mediaRecorderRef.current) return;
    setStatus('processing');
    mediaRecorderRef.current.stop(); // This will trigger onstop which calls handleUpload
    
    // Stop the transcription audio chain
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
  };

  const handleUpload = async () => {
    if (recordedChunksRef.current.length === 0) {
        setError("No video was recorded. Please try again.");
        setStatus('ready');
        return;
    }

    const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
    const formData = new FormData();
    formData.append('file', videoBlob, 'interview-answer.webm');
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'Cloudinary upload failed');
        }

        const data = await response.json();
        cleanupMedia();
        onRecordingComplete(transcriptRef.current, data.secure_url);

    } catch (err) {
        console.error("Upload failed:", err);
        setError(`Failed to upload video: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setStatus('error');
    }
  };

  const renderButton = () => {
    switch (status) {
        case 'idle':
            return <button onClick={initMedia} className="bg-indigo-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-indigo-700">Prepare Camera & Mic</button>;
        case 'awaiting_permission':
            return <button disabled className="bg-slate-400 text-white font-semibold py-3 px-8 rounded-lg">Awaiting Permissions...</button>;
        case 'ready':
            return <button onClick={startRecordingAndTranscription} className="bg-green-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-green-700">Start Recording Answer</button>;
        case 'recording':
            return <button onClick={stopRecording} className="bg-red-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-red-700">Stop Recording</button>;
        case 'processing':
            return <button disabled className="bg-slate-400 text-white font-semibold py-3 px-8 rounded-lg flex items-center gap-2"><svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Uploading...</button>;
        case 'error':
            return <button onClick={initMedia} className="bg-slate-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-slate-700">Try Again</button>;
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

      {error && <p className="text-sm text-red-600 text-center mt-2">{error}</p>}

      <div className="mt-6 text-center">
        {renderButton()}
      </div>
    </div>
  );
};
