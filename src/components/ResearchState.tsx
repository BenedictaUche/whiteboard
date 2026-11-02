import React, { useState, useEffect, useRef } from 'react';
import { Topic } from '../types';
interface ResearchStateProps {
    topic: Topic;
    notes: string;
    setNotes: (notes: string) => void;
    onBeginPresentation: () => void;
}
const MILESTONES = [300, 60, 0];
const LOW_TIME_SECONDS = 60;
export const ResearchState: React.FC<ResearchStateProps> = ({ topic, notes, setNotes, onBeginPresentation, }) => {
    const defaultMinutes = topic.researchTime ?? (parseInt(topic.res, 10) || 10);
    const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60);
    const [isRunning, setIsRunning] = useState(true);
    const announcedRef = useRef<Set<number>>(new Set());
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
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
    // Coarse screen-reader milestone announcements (polite, non-spammy).
    useEffect(() => {
        if (timeLeft <= 0) {
            if (!announcedRef.current.has(0)) {
                announcedRef.current.add(0);
                // handled by the live region text below
            }
            return;
        }
        const hit = MILESTONES.find((m) => m > 0 && timeLeft === m);
        if (hit && !announcedRef.current.has(hit)) {
            announcedRef.current.add(hit);
        }
    }, [timeLeft]);
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
            .toString()
            .padStart(2, '0');
        const s = (seconds % 60)
            .toString()
            .padStart(2, '0');
        return `${m}:${s}`;
    };
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isLowTime = timeLeft > 0 && timeLeft <= LOW_TIME_SECONDS;
    const isTimeUp = timeLeft <= 0;
    const liveMessage = isTimeUp
        ? 'Time is up. Begin your presentation.'
        : timeLeft === 300
            ? 'Five minutes remaining.'
            : timeLeft === 60
                ? 'One minute remaining.'
                : '';
    const handleRestart = () => {
        if (timeLeft === defaultMinutes * 60)
            return;
        if (!window.confirm('Restarting the timer will discard your research progress. Continue?'))
            return;
        setTimeLeft(defaultMinutes * 60);
        announcedRef.current.clear();
    };
    return (<section className="fade-in flex flex-col items-center justify-center min-h-[30rem] text-center space-y-6 sm:space-y-8 w-full max-w-200 mx-auto px-4">

      {/* Polite milestone announcements for screen readers */}

      <span aria-live="polite" className="sr-only">
        {liveMessage}
      </span>

      <div className="space-y-2 w-full">
        <span className="inline-block text-base sm:text-lg font-semibold text-text tracking-tight max-w-[40rem] wrap-break-word">
          {topic.title}
        </span>

        <div className={`font-display text-6xl sm:text-7xl md:text-8xl font-mono tabular-nums tracking-tighter pt-4 ${isLowTime ? 'text-danger' : 'text-text'} transition-colors duration-300`} aria-label={`Time remaining, ${minutes} minutes ${seconds} seconds`}>
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 pt-2 text-sm text-text-muted flex-wrap">
          <button onClick={() => setIsRunning(!isRunning)} className="px-3 py-1 bg-surface border border-border rounded-lg shadow-sm hover:bg-surface-muted flex items-center gap-1 cursor-pointer text-sm" aria-label={isRunning ? 'Pause timer' : 'Resume timer'}>
            <span className="material-symbols-outlined text-base">
              {isRunning ? 'pause' : 'play_arrow'}
            </span>
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button onClick={handleRestart} className="px-3 py-1 bg-surface border border-border rounded-lg shadow-sm hover:bg-surface-muted flex items-center gap-1 cursor-pointer text-sm" aria-label="Restart timer">
            <span className="material-symbols-outlined text-base">restart_alt</span>
            Restart timer
          </button>
        </div>
      </div>

      <div className="w-full max-w-[40rem] space-y-3">
        <label className="block text-sm sm:text-base font-semibold text-text">
          Research notes
        </label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full bg-surface border border-border rounded-xl p-3 sm:p-4 text-base text-text leading-relaxed focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 outline-none resize-none shadow-sm placeholder:text-text-muted/60" placeholder="Jot down key points, links, or anything you want to reference while presenting..." />
      </div>

      <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
        <button onClick={onBeginPresentation} className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer" aria-label="Begin Presentation">
          Begin Presentation
          <span className="material-symbols-outlined text-xl">mic</span>
        </button>
        <button onClick={onBeginPresentation} className="w-full sm:w-auto bg-surface border border-border text-text font-medium text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl transition-all duration-200 shadow-sm hover:bg-surface-muted flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer" aria-label="Start presenting now">
          Start presenting now
        </button>
      </div>

      {isTimeUp && (<p className="text-xs sm:text-sm text-warning font-medium mt-2">
          Research time is up — you can still begin your presentation.
        </p>)}
    </section>);
};
