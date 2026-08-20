import React, { useEffect, useRef, useState } from 'react';
import { Topic, Track, Mode } from '../types';
import { MOTIVATIONAL_QUOTES, TRACKS } from '../data/questions';
import {
  pickFromPool,
  runSpinAnimation,
} from '../lib/topicPool';
import {
  unlockSpinAudio,
  playSpinTick,
  playSpinLand,
  prefersReducedMotion,
} from '../lib/spinSound';

interface TopicSelectionStateProps {
  selectedTrack: Track;
  setSelectedTrack: (track: Track) => void;
  selectedMode: Mode;
  setSelectedMode: (mode: Mode) => void;
  currentTopic: Topic;
  poolTopics: Topic[];
  recentTopicIds: string[];
  onSpinAgain: (topic: Topic) => void;
  onGetStarted: () => void;
  onGenerateCustomTopic?: () => void;
  isGeneratingCustom?: boolean;
  customTopicError?: string | null;
  poolLoading?: boolean;
  poolError?: string | null;
  onRefreshPool?: () => void;
}

export const TopicSelectionState: React.FC<TopicSelectionStateProps> = ({
  selectedTrack,
  setSelectedTrack,
  selectedMode,
  setSelectedMode,
  currentTopic,
  poolTopics,
  recentTopicIds,
  onSpinAgain,
  onGetStarted,
  onGenerateCustomTopic,
  isGeneratingCustom = false,
  customTopicError = null,
  poolLoading = false,
  poolError = null,
  onRefreshPool,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayTopic, setDisplayTopic] = useState<Topic>(currentTopic);
  const [quoteIndex] = useState(0);

  const cancelSpinRef = useRef<(() => void) | null>(null);
  const lastTickTimeRef = useRef(0);
  const lastTickIndexRef = useRef(-1);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onChange = () => {
      reducedMotionRef.current = mq.matches;
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);


  useEffect(() => {
    if (!isSpinning) setDisplayTopic(currentTopic);
  }, [currentTopic, isSpinning]);

  const handleSpinClick = () => {
    if (isSpinning) return;

    unlockSpinAudio();

    const candidates = poolTopics.length > 0 ? poolTopics : [currentTopic];
    const recent = recentTopicIds;
    const target = (() => {
      const picked = pickFromPool(
        { track: selectedTrack, topics: candidates, aiRemaining: [] },
        currentTopic.id,
        recent
      );
      return picked ?? candidates[Math.floor(Math.random() * candidates.length)] ?? currentTopic;
    })();

    if (!target) return;

    setIsSpinning(true);
    setDisplayTopic(currentTopic);
    lastTickTimeRef.current = 0;
    lastTickIndexRef.current = -1;

    const cyclePool = candidates.filter(
      (t) => t.id !== target.id && t.id !== currentTopic.id
    );

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
        if (
          display.id !== lastTickIndexRef.current &&
          sinceLast >= minGap &&
          !reduced
        ) {
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

  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];
  const showResearchBadge = selectedMode === 'Deep Research';
  const shownTopic = isSpinning ? displayTopic : currentTopic;

  return (
    <section className="fade-in w-full max-w-225 mx-auto">
      <div className="mb-8 sm:mb-10 text-center space-y-4 px-1">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight leading-tight wrap-break-word">
          Practice Technical Interviews
        </h1>
        <div className="flex justify-center mt-4 sm:mt-6">
          <svgs
            fill="none"
            height="12"
            viewBox="0 0 40 12"
            width="40"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 6C6.5 6 9.5 1 15 1C20.5 1 19.5 11 25 11C30.5 11 34.5 6 40 6"
              stroke="#82A87D"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svgs>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 mb-10 sm:mb-12 px-1">
        <div className="relative w-full sm:w-auto">
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value as Track)}
            className="appearance-none w-full bg-white shadow-sm border border-[#F2EDE6] text-[#1A1A24] font-medium rounded-xl py-3 pl-12 pr-12 cursor-pointer hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-[#F28C56]/20 outline-none text-sm"
          >
            {TRACKS.map((track) => (
              <option key={track} value={track}>
                {track}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#82A87D] text-xl">
            desktop_windows
          </span>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-sm">
            expand_more
          </span>
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as Mode)}
            className="appearance-none w-full bg-white shadow-sm border border-[#F2EDE6] text-[#1A1A24] font-medium rounded-xl py-3 pl-12 pr-12 cursor-pointer hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-[#F28C56]/20 outline-none text-sm"
          >
            <option value="Deep Research">Deep Research</option>
            <option value="Quick Pitch">Quick Pitch</option>
          </select>
          <span
            className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A79E2] text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            radio_button_checked
          </span>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-sm">
            expand_more
          </span>
        </div>
      </div>

      <div className="relative bg-linear-to-br from-[#FFF9F5] to-[#FEF3EB] rounded-3xl sm:rounded-4xl p-5 sm:p-8 md:p-10 border border-[#FDEAE0] shadow-[0_4px_20px_rgba(242,140,86,0.05)] max-w-4xl mx-auto mt-6 mb-10 sm:mb-12 flex flex-col md:flex-row items-center gap-5 sm:gap-6 md:gap-10">
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 md:w-25 md:h-25 rounded-full bg-[#FFEADF] flex items-center justify-center border-4 border-[#FFFDF8] shadow-[0_0_20px_rgba(242,140,86,0.15)] shrink-0 relative transition-transform duration-300 ${
            isSpinning ? 'scale-95' : 'scale-100'
          }`}
        >
          <div
            className={`absolute inset-0 rounded-full border border-[#F28C56]/20 transition-opacity duration-300 ${
              isSpinning ? 'opacity-60' : 'opacity-100'
            }`}
          />
          <span className="text-[28px] sm:text-[36px] md:text-[44px] text-[#E87333] font-bold font-mono">
            &#123;&#125;
          </span>
        </div>

        <div className="flex-1 space-y-3 text-center md:text-left w-full overflow-hidden">
          <div className="relative overflow-hidden min-h-14 flex items-center justify-center md:justify-start">
            <h2
              key={shownTopic.id}
              className={`font-display text-xl sm:text-2xl md:text-3xl lg:text-[40px] text-[#1A1A24] tracking-tight font-bold break-words transition-all duration-200 ${
                isSpinning
                  ? 'opacity-90 translate-y-0 blur-[0.5px]'
                  : 'opacity-100 translate-y-0 blur-0'
              }`}
            >
              {shownTopic.title}
            </h2>
          </div>

          <div
            className={`flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 md:gap-4 text-sm text-[#7D7068] font-medium pt-2 transition-opacity duration-200 ${
              isSpinning ? 'opacity-60' : 'opacity-100'
            }`}
          >
            <span className="bg-[#FFE5D6] text-[#C45E20] px-3 py-1 rounded-full text-[12px] sm:text-[13px] font-semibold whitespace-nowrap">
              {shownTopic.diff}
            </span>
            {showResearchBadge && (
              <>
                <span className="text-[#D3C7BF] hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#D27E4B]">
                    schedule
                  </span>
                  <span>{shownTopic.res}</span>
                </span>
              </>
            )}
            <span className="text-[#D3C7BF] hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#D27E4B]">
                mic
              </span>
              <span>{shownTopic.pres}</span>
            </span>
          </div>
        </div>

        <svg
          className={`absolute top-4 right-4 text-[#E6C6AC] opacity-30 w-12 h-12 sm:w-16 sm:h-16 pointer-events-none hidden sm:block transition-transform duration-300 ${
            isSpinning ? 'rotate-12 scale-105' : ''
          }`}
          fill="none"
          viewBox="0 0 100 100"
        >
          <path
            d="M20 80 Q 50 20 80 80 T 20 80"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M30 70 Q 50 30 70 70"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* {(poolLoading || poolError) && (
        <div
          className={`max-w-3xl mx-auto mb-6 sm:mb-8 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm text-center break-words ${
            poolError
              ? 'bg-[#FFF1EC] border-[#F28C56]/40 text-[#944a19]'
              : 'bg-white/70 border-[#F2EDE6] text-[#7D7068]'
          }`}
          role={poolError ? 'alert' : 'status'}
        >
          {poolError
            ? `${poolError} Falling back to built-in topics.`
            : 'Loading fresh interview topics…'}
        </div>
      )} */}

      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 px-1">
        <button
          onClick={handleSpinClick}
          disabled={isSpinning}
          className="w-full sm:w-auto bg-white border border-[#F2EDE6] shadow-sm hover:bg-gray-50 text-[#1A1A24] font-medium text-[15px] px-6 py-3 sm:py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Spin Again"
        >
          <span
            className={`material-symbols-outlined text-[#5C5C5C] ${
              isSpinning ? 'spin-icon-anim' : ''
            }`}
          >
            casino
          </span>
          {isSpinning ? 'Spinning…' : 'Spin Again'}
        </button>

        {onRefreshPool && (
          <button
            onClick={onRefreshPool}
            disabled={poolLoading || isSpinning}
            title="Generate a fresh AI topic pool"
            className="w-full sm:w-auto bg-[#E8F3E8] border border-[#C5DEC5] text-[#3B5436] font-medium text-[15px] px-5 py-3 sm:py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 cursor-pointer hover:bg-[#d9ebd9] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh Topic Pool"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            New Pool
          </button>
        )}

        {/* {onGenerateCustomTopic && (
          <button
            onClick={onGenerateCustomTopic}
            disabled={isGeneratingCustom || isSpinning}
            title="Generate a fresh topic using AI"
            className="w-full sm:w-auto bg-[#E8F3E8] border border-[#C5DEC5] text-[#3B5436] font-medium text-[15px] px-5 py-3 sm:py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 cursor-pointer hover:bg-[#d9ebd9] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Generate Custom Topic"
          >
            {isGeneratingCustom ? 'AI Generating...' : 'AI Custom Topic'}
          </button>
        )} */}

        <button
          onClick={onGetStarted}
          disabled={isSpinning}
          className="w-full sm:w-auto bg-linear-to-r from-[#F28C56] to-[#EE7738] hover:from-[#E67D45] hover:to-[#E06626] text-white font-medium text-[15px] sm:text-[16px] px-6 py-3 sm:py-3.5 rounded-2xl transition-all duration-200 shadow-[0_8px_20px_rgba(242,140,86,0.3)] flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Get Started"
        >
          Get Started
          <span className="material-symbols-outlined font-light text-xl">
            arrow_forward
          </span>
        </button>
      </div>

      {customTopicError && (
        <p className="mt-4 text-center text-sm text-red-600 px-4 break-words">
          {customTopicError}
        </p>
      )}
    </section>
  );
};
