import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Topic, Track, Mode, Difficulty, DrillRecord } from '../types';
import { trackEvent } from '../lib/analytics';
import { pickFromPool, runSpinAnimation, } from '../lib/topicPool';
import { useTopicPool } from '../hooks/useTopicPool';
import { useCustomTopic } from '../hooks/useCustomTopic';
import { unlockSpinAudio, playSpinTick, playSpinLand, prefersReducedMotion, } from '../lib/spinSound';
export interface PracticeSummary {
    totalSessions: number;
    sessionsToday: number;
    lastTopicTitle: string;
    lastTrack: Track;
    lastPracticedAt: number;
}
interface TopicSelectionStateProps {
    selectedTrack: Track;
    setSelectedTrack: (track: Track) => void;
    selectedMode: Mode;
    setSelectedMode: (mode: Mode) => void;
    currentTopic: Topic;
    history: DrillRecord[];
    recentTopicIds: string[];
    onSpinAgain: (topic: Topic) => void;
    onGetStarted: () => void;
    practiceSummary?: PracticeSummary | null;
    onStartNextChallenge?: () => void;
    onPoolTopicPicked?: (topic: Topic) => void;
    onCustomTopicSelected?: (topic: Topic) => void;
}
export const TopicSelectionState: React.FC<TopicSelectionStateProps> = ({ selectedTrack, setSelectedTrack, selectedMode, setSelectedMode, currentTopic, history, onSpinAgain, onGetStarted,    practiceSummary = null,
    onStartNextChallenge,
    onPoolTopicPicked,
    onCustomTopicSelected,
    recentTopicIds = [],
}) => {
    const topicPool = useTopicPool(selectedTrack, history);
    const { error: customTopicError } = useCustomTopic((topic) => onCustomTopicSelected?.(topic));
    const poolLoading = topicPool.isLoading;
    const poolTopics = useMemo(() => topicPool.topics.filter((t) => t.category === selectedTrack), [topicPool.topics, selectedTrack]);
    const handleRefreshPool = async () => {
        await topicPool.refresh();
        const next = topicPool.pickNext(currentTopic.id, recentTopicIds);
        if (next && onPoolTopicPicked) {
            onPoolTopicPicked(next);
        }
    };
    const [isSpinning, setIsSpinning] = useState(false);
    const [displayTopic, setDisplayTopic] = useState<Topic>(currentTopic);
    const cancelSpinRef = useRef<(() => void) | null>(null);
    const lastTickTimeRef = useRef(0);
    const lastTickIndexRef = useRef<string | null>(null);
    const reducedMotionRef = useRef(false);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        reducedMotionRef.current = mq.matches;
        const onChange = () => {
            reducedMotionRef.current = mq.matches;
        };
        if (mq.addEventListener)
            mq.addEventListener('change', onChange);
        else
            mq.addListener(onChange);
        return () => {
            if (mq.removeEventListener)
                mq.removeEventListener('change', onChange);
            else
                mq.removeListener(onChange);
        };
    }, []);
    useEffect(() => {
        if (!isSpinning)
            setDisplayTopic(currentTopic);
    }, [currentTopic, isSpinning]);
    const handleSpinClick = () => {
        if (isSpinning)
            return;
        unlockSpinAudio();
        const candidates = poolTopics.length > 0 ? poolTopics : [currentTopic];
        const recent = recentTopicIds;
        const target = (() => {
            const picked = pickFromPool({ track: selectedTrack, topics: candidates, aiRemaining: [] }, currentTopic.id, recent);
            return picked ?? candidates[Math.floor(Math.random() * candidates.length)] ?? currentTopic;
        })();
        if (!target)
            return;
        setIsSpinning(true);
        setDisplayTopic(currentTopic);
        lastTickTimeRef.current = 0;
        lastTickIndexRef.current = null;
        const cyclePool = candidates.filter((t) => t.id !== target.id && t.id !== currentTopic.id);
        const reduced = prefersReducedMotion();
        const duration = reduced ? 0 : 1700;
        const animation = runSpinAnimation({
            cycleTopics: cyclePool,
            target,
            reducedMotion: reduced,
            durationMs: duration,
            onTick: (display, progress) => {
                setDisplayTopic(display);
                const now = performance.now();
                const sinceLast = now - lastTickTimeRef.current;
                const minGap = 40 + progress * 220;
                if (display.id !== lastTickIndexRef.current &&
                    sinceLast >= minGap &&
                    !reduced) {
                    lastTickTimeRef.current = now;
                    lastTickIndexRef.current = display.id;
                    const intensity = 1 - progress * 0.75;
                    const pitch = 0.92 + Math.random() * 0.18;
                    playSpinTick(intensity, pitch);
                }
            },
            onDone: (finalTopic) => {
                setDisplayTopic(finalTopic);
                if (!reduced) {
                    playSpinLand();
                }
                onSpinAgain(finalTopic);
                window.setTimeout(() => {
                    setIsSpinning(false);
                }, reduced ? 0 : 220);
            },
        });
        cancelSpinRef.current = animation.cancel;
    };
    useEffect(() => {
        return () => {
            cancelSpinRef.current?.();
        };
    }, []);
    const showResearchBadge = selectedMode === 'Deep Research';
    const shownTopic = isSpinning ? displayTopic : currentTopic;
    const kind = topicKind(shownTopic.title);
    const difficultyStyles: Record<Difficulty, string> = {
        Beginner: 'border-l-4 border-success bg-success/5',
        Intermediate: 'border-l-4 border-warning bg-warning/5',
        Hard: 'border-l-4 border-danger bg-danger/5',
    };
    const spinTransition = reducedMotionRef.current
        ? 'duration-0'
        : 'transition-opacity duration-200 ease-out';
    return (<section className="fade-in w-full max-w-225 mx-auto">
      <div className="mb-8 sm:mb-10 text-center space-y-4 px-1">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight leading-tight text-text wrap-break-word">
          Practice Technical Interviews
        </h1>
        <div className="flex justify-center mt-4 sm:mt-6">
          <svg fill="none" height="12" viewBox="0 0 40 12" width="40" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 6C6.5 6 9.5 1 15 1C20.5 1 19.5 11 25 11C30.5 11 34.5 6 40 6" stroke="#82A87D" strokeLinecap="round" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 mb-10 sm:mb-12 px-1">
        <div className="relative w-full sm:w-auto">
          <select value={selectedTrack} onChange={(e) => {
            const track = e.target.value as Track;
            trackEvent('track_selected', { track });
            setSelectedTrack(track);
        }} className="appearance-none w-full bg-surface shadow-sm border border-border text-text font-medium rounded-xl py-3 pl-12 pr-12 cursor-pointer hover:bg-surface-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 outline-none text-sm">
            {(['Frontend', 'Backend', 'System Design', 'DevOps'] as Track[]).map((track) => (<option key={track} value={track}>
                {track}
              </option>))}
          </select>
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-success text-xl">
            desktop_windows
          </span>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-sm">
            expand_more
          </span>
        </div>

        <div className="relative w-full sm:w-auto">
          <select value={selectedMode} onChange={(e) => setSelectedMode(e.target.value as Mode)} className="appearance-none w-full bg-surface shadow-sm border border-border text-text font-medium rounded-xl py-3 pl-12 pr-12 cursor-pointer hover:bg-surface-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 outline-none text-sm">
            <option value="Deep Research">Deep Research</option>
            <option value="Quick Pitch">Quick Pitch</option>
          </select>
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A79E2] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            radio_button_checked
          </span>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-sm">
            expand_more
          </span>
        </div>
      </div>

      {practiceSummary && onStartNextChallenge && (<div className="max-w-4xl mx-auto w-full mb-6 bg-surface/80 border border-border rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shadow-sm">
          <span className="material-symbols-outlined text-success text-2xl shrink-0">
            waving_hand
          </span>
          <div className="flex-1 min-w-0 text-sm text-text-muted">
            <span className="font-semibold text-text">Welcome back.</span>{' '}
            {practiceSummary.totalSessions} practice {' '}
            {practiceSummary.totalSessions === 1 ? ' session' : 'sessions'} so far
            {practiceSummary.sessionsToday > 0
            ? ` · ${practiceSummary.sessionsToday} today`
            : ''}
            . Ready for your next challenge?
          </div>
          <button onClick={onStartNextChallenge} className="shrink-0 bg-success hover:bg-success/90 text-primary-foreground font-medium text-sm px-5 py-2.5 rounded-xl transition-colors active:scale-95 cursor-pointer flex items-center gap-2 whitespace-nowrap">
            Your next challenge <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
        </div>)}

      <div className="relative bg-gradient-to-br from-background to-surface-muted rounded-3xl sm:rounded-4xl p-5 sm:p-8 md:p-10 border border-border shadow max-w-4xl mx-auto mt-6 mb-10 sm:mb-12 flex flex-col md:flex-row items-center gap-5 sm:gap-6 md:gap-10">
        <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-25 md:h-25 rounded-full bg-surface flex items-center justify-center border border-surface-muted shadow-sm shrink-0 relative transition-transform duration-200 ${isSpinning ? 'scale-95' : 'scale-100'}`}>
          <span className="text-[28px] sm:text-[36px] md:text-[44px] text-primary font-bold font-mono">
            &#123;&#125;
          </span>
        </div>

        <div className="flex-1 space-y-3 text-center md:text-left w-full min-w-0 overflow-hidden">
          <div className="relative overflow-hidden min-h-14 flex items-center justify-center md:justify-start">
            <h2 key={shownTopic.id} className={`font-display text-xl sm:text-2xl md:text-3xl lg:text-[40px] text-text tracking-tight font-bold wrap-break-word text-wrap-balance min-w-0 ${spinTransition} ${isSpinning
            ? 'opacity-70 translate-y-1'
            : 'opacity-100 translate-y-0'}`}>
              {shownTopic.title}
            </h2>
          </div>

          <div className={`flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 md:gap-4 text-sm sm:text-base font-medium pt-2 text-text-muted ${spinTransition} ${isSpinning ? 'opacity-70' : 'opacity-100'}`}>
            <span className={`${difficultyStyles[shownTopic.diff]} text-text font-semibold text-xs sm:text-xs px-3 py-1 rounded-full whitespace-nowrap border border-current/40`}>
              {shownTopic.diff}
            </span>
            {kind && (<span className="bg-accent text-accent-foreground border border-accent/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {kind}
            </span>)}
            {showResearchBadge && (<>
                <span className="text-text-muted/50 hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    schedule
                  </span>
                  <span className="text-text">{shownTopic.res}</span>
                </span>
              </>)}
            <span className="text-text-muted/50 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">
                mic
              </span>
              <span className="text-text">{shownTopic.pres}</span>
            </span>
          </div>
        </div>

        <svg className={`absolute top-4 right-4 text-accent opacity-15 w-12 h-12 sm:w-16 sm:h-16 pointer-events-none hidden sm:block transition-transform duration-200 ${isSpinning ? 'rotate-12 scale-105' : ''}`} fill="none" viewBox="0 0 100 100">
          <path d="M20 80 Q 50 20 80 80 T 20 80" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M30 70 Q 50 30 70 70" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 px-1">
        <button onClick={handleSpinClick} disabled={isSpinning} className="w-full sm:w-auto bg-surface border border-border text-text font-medium text-[15px] px-6 py-3 sm:py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:bg-surface-muted" aria-label="Spin Again">
          <span className={`material-symbols-outlined text-text-muted ${isSpinning ? 'spin-icon-anim' : ''}`}>
            casino
          </span>
          {isSpinning ? 'Spinning…' : 'Spin Again'}
        </button>

        <button onClick={() => void handleRefreshPool()} disabled={poolLoading || isSpinning} title="Generate a fresh set of topics" aria-label="Generate a fresh set of topics" className="w-full sm:w-auto bg-accent text-accent-foreground border border-accent/40 font-medium text-[15px] px-5 py-3 sm:py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 cursor-pointer hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            New topics
          </button>

        <button onClick={onGetStarted} disabled={isSpinning} className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium text-[15px] sm:text-[16px] px-6 py-3 sm:py-3.5 rounded-2xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Get Started">
          {selectedMode === 'Quick Pitch' ? 'Start Quick Pitch' : 'Start Deep Research'}
          <span className="material-symbols-outlined font-light text-xl">
            arrow_forward
          </span>
        </button>
      </div>

      {customTopicError && (<p className="mt-4 text-center text-sm text-danger px-4 wrap-break-word" role="alert">
          {customTopicError}
        </p>)}
    </section>);
};

function topicKind(title: string): 'Concept' | 'Scenario' | null {
    const t = title.trim();
    const lower = t.toLowerCase();
    const conceptPrefixes = ['explain', 'what is', 'how does'];
    const scenarioPrefixes = ['a user reports', 'walk me through', 'you are'];
    if (conceptPrefixes.some((p) => lower.startsWith(p)))
        return 'Concept';
    if (scenarioPrefixes.some((p) => lower.startsWith(p)))
        return 'Scenario';
    return null;
}
