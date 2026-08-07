import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Topic } from '../types';

interface PresentationStateProps {
  topic: Topic;
  notes: string;
  transcript: string;
  setTranscript: (text: string) => void;
  onFinishPresentation: () => void;
}

type SpeechStatus =
  | 'unsupported'
  | 'idle'
  | 'listening'
  | 'denied'
  | 'error'
  | 'stopped';

/**
 * Append only truly new final text. Drops exact duplicates and phrases the
 * engine re-emits after an automatic restart.
 */
function appendFinalTranscript(existing: string, incoming: string): string {
  const next = incoming.trim();
  if (!next) return existing;

  const base = existing.trim();
  if (!base) return next;

  if (base === next || base.endsWith(next)) return base;
  if (next.startsWith(base)) return next;

  // Avoid duplicating the last sentence when the engine overlaps
  const lastSentence = base.split(/(?<=[.!?])\s+/).pop() ?? '';
  if (lastSentence && next.startsWith(lastSentence)) {
    return `${base.slice(0, base.length - lastSentence.length)}${next}`.trim();
  }

  return `${base} ${next}`.trim();
}

export const PresentationState: React.FC<PresentationStateProps> = ({
  topic,
  notes,
  transcript,
  setTranscript,
  onFinishPresentation,
}) => {
  const targetMinutes = topic.presentationTime ?? (parseInt(topic.pres, 10) || 3);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isRecording, setIsRecording] = useState(true);
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>('idle');
  const [interimText, setInterimText] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(true);
  const finalTranscriptRef = useRef(transcript);
  const manualEditRef = useRef(false);

  // Keep ref in sync when parent transcript changes from outside
  useEffect(() => {
    if (!manualEditRef.current) {
      finalTranscriptRef.current = transcript;
    }
  }, [transcript]);

  const syncTranscript = useCallback(
    (nextFinal: string) => {
      finalTranscriptRef.current = nextFinal;
      setTranscript(nextFinal);
    },
    [setTranscript]
  );

  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSpeechStatus('unsupported');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (shouldListenRef.current) {
        setSpeechStatus('listening');
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const piece = result[0]?.transcript ?? '';
        if (!piece) continue;

        if (result.isFinal) {
          // Ignore finals while the user is manually editing the textarea
          if (manualEditRef.current) continue;
          const merged = appendFinalTranscript(finalTranscriptRef.current, piece);
          syncTranscript(merged);
        } else {
          interim += piece;
        }
      }

      setInterimText(interim.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const error = event.error;
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        shouldListenRef.current = false;
        setSpeechStatus('denied');
        return;
      }
      if (error === 'aborted' || error === 'no-speech') {
        // Benign — continuous mode / pause; restart handled in onend
        return;
      }
      console.warn('Speech recognition error:', error);
      setSpeechStatus('error');
    };

    recognition.onend = () => {
      setInterimText('');
      // Browser often stops continuous recognition after a pause — resume
      // without resetting the accumulated final transcript.
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          /* already starting */
        }
      } else {
        setSpeechStatus((prev) => (prev === 'denied' ? prev : 'stopped'));
      }
    };

    recognitionRef.current = recognition;
    shouldListenRef.current = true;

    try {
      recognition.start();
      setSpeechStatus('listening');
    } catch (e) {
      console.warn('Speech recognition init error:', e);
      setSpeechStatus('error');
    }

    return () => {
      shouldListenRef.current = false;
      try {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
        recognition.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, [syncTranscript]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isRecording) {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  const targetSeconds = targetMinutes * 60;
  const remainingSeconds = Math.max(0, targetSeconds - secondsElapsed);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleTranscriptChange = (value: string) => {
    manualEditRef.current = true;
    finalTranscriptRef.current = value;
    setTranscript(value);
    // Allow speech to resume appending after a short pause in typing
    window.setTimeout(() => {
      manualEditRef.current = false;
    }, 1500);
  };

  const handleStop = () => {
    setIsRecording(false);
    shouldListenRef.current = false;
    setInterimText('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    // Never inject placeholder / fake transcript
    onFinishPresentation();
  };

  const statusMessage = (() => {
    switch (speechStatus) {
      case 'unsupported':
        return 'Speech recognition is not supported in this browser — type your explanation below.';
      case 'denied':
        return 'Microphone access denied. Enable the mic or type your explanation below.';
      case 'error':
        return 'Speech recognition stopped unexpectedly. You can keep typing below.';
      case 'listening':
        return 'Live Speech Recognition active (speak into microphone or edit below)';
      case 'stopped':
        return 'Speech recognition stopped.';
      default:
        return 'Type or edit your presentation response below:';
    }
  })();

  const displayValue =
    interimText && speechStatus === 'listening'
      ? `${transcript}${transcript ? ' ' : ''}${interimText}`
      : transcript;

  return (
    <section className="fade-in flex flex-col min-h-[550px] w-full max-w-[900px] mx-auto space-y-8">
      <div className="flex justify-between items-center pb-6 border-b border-[#F2EDE6]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mic-pulse shadow-sm">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              mic
            </span>
          </div>
          <div>
            <div className="text-[12px] font-bold text-[#685F58] uppercase tracking-widest">
              RECORDING PRESENTATION • {topic.title}
            </div>
            <div className="font-display text-2xl md:text-3xl font-bold text-[#1A1A24] tabular-nums tracking-tight">
              {formatTimer(remainingSeconds)}
            </div>
          </div>
        </div>

        <button
          onClick={handleStop}
          className="bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium text-base px-6 py-2.5 rounded-full flex items-center gap-2 active:scale-95 cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-xl">stop_circle</span>
          Stop Presentation
        </button>
      </div>

      {notes && (
        <div className="bg-[#FFF9F5] border border-[#FDEAE0] p-4 rounded-2xl text-xs text-[#685F58] space-y-1">
          <span className="font-bold text-[#6B8B67] uppercase tracking-wider block">
            Your Research Notes Reference:
          </span>
          <p className="line-clamp-2 italic">{notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-[#7D7068]">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              speechStatus === 'listening' && isRecording
                ? 'bg-red-500 animate-ping'
                : 'bg-gray-400'
            }`}
          />
          {statusMessage}
        </span>
        <span className="text-gray-400">Target Time: {topic.pres}</span>
      </div>

      <div className="flex-grow flex flex-col space-y-2">
        <label className="text-xs font-bold text-[#685F58] uppercase tracking-wider">
          Presentation Transcript (Live Speech or Text Input)
        </label>
        <textarea
          value={displayValue}
          onChange={(e) => handleTranscriptChange(e.target.value)}
          placeholder="Speak into your mic or start typing your explanation here..."
          className="w-full flex-grow min-h-[220px] bg-white border border-[#F2EDE6] rounded-2xl p-5 text-base md:text-lg text-[#1A1A24] leading-relaxed focus:ring-2 focus:ring-[#F28C56]/30 focus:outline-none resize-none shadow-sm font-sans"
        />
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={handleStop}
          className="bg-gradient-to-r from-[#F28C56] to-[#EE7738] hover:from-[#E67D45] hover:to-[#E06626] text-white font-medium text-lg px-8 py-3.5 rounded-full transition-all duration-200 shadow-[0_8px_20px_rgba(242,140,86,0.3)] flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          Finish & Review Presentation
          <span className="material-symbols-outlined font-light text-xl">
            arrow_forward
          </span>
        </button>
      </div>
    </section>
  );
};
