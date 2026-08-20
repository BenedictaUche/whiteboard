import React, { useState, useEffect } from 'react';
import { Topic } from '../types';

interface ResearchStateProps {
  topic: Topic;
  notes: string;
  setNotes: (notes: string) => void;
  onBeginPresentation: () => void;
}

export const ResearchState: React.FC<ResearchStateProps> = ({
  topic,
  notes,
  setNotes,
  onBeginPresentation,
}) => {
  // Parse research minutes from string e.g. "10 min research" -> 10
  const defaultMinutes = topic.researchTime ?? (parseInt(topic.res, 10) || 10);
  const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [showKeyPoints, setShowKeyPoints] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <section className="fade-in flex flex-col items-center justify-center min-h-137.5 text-center space-y-6 sm:space-y-8 w-full max-w-200 mx-auto px-4">
      {/* Header */}
      <div className="space-y-2 w-full">
        <span className="inline-block text-[11px] sm:text-[12px] font-bold text-[#685F58] uppercase tracking-widest px-3 sm:px-4 py-1 sm:py-1.5  text-[#5C7A56] max-w-full break-words">
         {topic.title}
        </span>

        <div className="font-display text-5xl sm:text-6xl md:text-7xl font-mono tabular-nums tracking-tighter pt-4">
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 pt-2 text-sm text-[#7D7068] flex-wrap">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-3 py-1 bg-white border border-[#F2EDE6] rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-1 cursor-pointer text-sm"
            aria-label={isRunning ? 'Pause' : 'Resume'}
          >
            <span className="material-symbols-outlined text-base">
              {isRunning ? 'pause' : 'play_arrow'}
            </span>
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => setTimeLeft(defaultMinutes * 60)}
            className="px-3 py-1 bg-white border border-[#F2EDE6] rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-1 cursor-pointer text-sm"
            aria-label="Reset"
          >
            <span className="material-symbols-outlined text-base">restart_alt</span>
            Reset
          </button>
        </div>
      </div>
{/*
      <p className="font-sans text-base md:text-lg text-[#685F58] max-w-lg mx-auto font-light leading-relaxed px-2">
        You may use any resources while researching. Prepare your thoughts and jottings below to explain the topic clearly.
      </p> */}

      {/* Hints & Key points toggle */}
      {/* {topic.hint && (
        <div className="w-full text-left bg-white/80 border border-[#F2EDE6] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span className="font-semibold text-sm text-[#3B5436] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[#82A87D]">
                lightbulb
              </span>
              Topic Research Hint
            </span>
            {topic.keyPoints && topic.keyPoints.length > 0 && (
              <button
                onClick={() => setShowKeyPoints(!showKeyPoints)}
                className="text-xs text-[#944a19] font-medium underline cursor-pointer self-start sm:self-auto"
                aria-label={showKeyPoints ? 'Hide Key Talking Points' : 'Show Key Talking Points'}
              >
                {showKeyPoints ? 'Hide Key Talking Points' : 'Show Key Talking Points'}
              </button>
            )}
          </div>
          <p className="text-sm text-[#685F58] leading-relaxed break-words">{topic.hint}</p>

          {showKeyPoints && topic.keyPoints && (
            <ul className="text-xs text-[#54433a] space-y-1.5 pt-2 border-t border-[#F2EDE6] list-disc list-inside break-words">
              {topic.keyPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          )}
        </div>
      )} */}

      {/* <div className="w-full space-y-2 text-left">
        <label className="text-xs font-bold text-[#6B8B67] uppercase tracking-wider block">
          Your Research Notes & Outline (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down bullet points, key terms, trade-offs, or code examples to guide your presentation..."
          className="w-full h-32 bg-white border border-[#F2EDE6] rounded-2xl p-4 text-sm text-[#1A1A24] focus:ring-2 focus:ring-[#F28C56]/30 focus:outline-none resize-none shadow-sm"
        />
      </div> */}

      {/* Begin Presentation Action */}
      <div className="pt-2 sm:pt-4">
        <button
          onClick={onBeginPresentation}
          className="w-full sm:w-auto bg-linear-to-r from-[#F28C56] to-[#EE7738] hover:from-[#E67D45] hover:to-[#E06626] text-white font-medium text-base sm:text-lg px-6 sm:px-6 py-3 sm:py-2 rounded-2xl transition-all duration-200 shadow-[0_8px_20px_rgba(242,140,86,0.3)] flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer"
          aria-label="Begin Presentation"
        >
          Begin Presentation
          <span className="material-symbols-outlined text-xl">mic</span>
        </button>
      </div>
    </section>
  );
};
