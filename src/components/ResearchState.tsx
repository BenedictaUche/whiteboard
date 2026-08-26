import React, { useState, useEffect } from 'react';
import { Topic } from '../types';
interface ResearchStateProps {
    topic: Topic;
    notes: string;
    setNotes: (notes: string) => void;
    onBeginPresentation: () => void;
}
export const ResearchState: React.FC<ResearchStateProps> = ({ topic, notes, setNotes, onBeginPresentation, }) => {
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
            if (interval)
                clearInterval(interval);
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
    return (<section className="fade-in flex flex-col items-center justify-center min-h-137.5 text-center space-y-6 sm:space-y-8 w-full max-w-200 mx-auto px-4">

      <div className="space-y-2 w-full">
        <span className="inline-block text-[11px] sm:text-[12px] font-bold text-[#685F58] uppercase tracking-widest px-3 sm:px-4 py-1 sm:py-1.5  text-[#5C7A56] max-w-full break-words">
         {topic.title}
        </span>

        <div className="font-display text-5xl sm:text-6xl md:text-7xl font-mono tabular-nums tracking-tighter pt-4">
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 pt-2 text-sm text-[#7D7068] flex-wrap">
          <button onClick={() => setIsRunning(!isRunning)} className="px-3 py-1 bg-white border border-[#F2EDE6] rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-1 cursor-pointer text-sm" aria-label={isRunning ? 'Pause' : 'Resume'}>
            <span className="material-symbols-outlined text-base">
              {isRunning ? 'pause' : 'play_arrow'}
            </span>
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button onClick={() => setTimeLeft(defaultMinutes * 60)} className="px-3 py-1 bg-white border border-[#F2EDE6] rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-1 cursor-pointer text-sm" aria-label="Reset">
            <span className="material-symbols-outlined text-base">restart_alt</span>
            Reset
          </button>
        </div>
      </div>

      <div className="pt-2 sm:pt-4">
        <button onClick={onBeginPresentation} className="w-full sm:w-auto bg-linear-to-r from-[#F28C56] to-[#EE7738] hover:from-[#E67D45] hover:to-[#E06626] text-white font-medium text-base sm:text-lg px-6 sm:px-6 py-3 sm:py-2 rounded-2xl transition-all duration-200 shadow-[0_8px_20px_rgba(242,140,86,0.3)] flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer" aria-label="Begin Presentation">
          Begin Presentation
          <span className="material-symbols-outlined text-xl">mic</span>
        </button>
      </div>
    </section>);
};
