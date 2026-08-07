import React, { useState } from 'react';
import { Topic, Track, Mode } from '../types';
import { MOTIVATIONAL_QUOTES, TRACKS } from '../data/questions';

interface TopicSelectionStateProps {
  selectedTrack: Track;
  setSelectedTrack: (track: Track) => void;
  selectedMode: Mode;
  setSelectedMode: (mode: Mode) => void;
  currentTopic: Topic;
  allTopics: Topic[];
  onSpinAgain: () => void;
  onGetStarted: () => void;
  onGenerateCustomTopic?: () => void;
  isGeneratingCustom?: boolean;
  customTopicError?: string | null;
}

export const TopicSelectionState: React.FC<TopicSelectionStateProps> = ({
  selectedTrack,
  setSelectedTrack,
  selectedMode,
  setSelectedMode,
  currentTopic,
  allTopics: _allTopics,
  onSpinAgain,
  onGetStarted,
  onGenerateCustomTopic,
  isGeneratingCustom = false,
  customTopicError = null,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const handleSpinClick = () => {
    setIsSpinning(true);
    onSpinAgain();
    setTimeout(() => {
      setIsSpinning(false);
    }, 800);
  };

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
  };

  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];
  const showResearchBadge = selectedMode === 'Deep Research';

  return (
    <section className="fade-in w-full max-w-225 mx-auto">
      <div className="mb-10 text-center space-y-4">
        <h1 className="font-display text-4xl md:text-5xl lg:text-[56px]  font-bold tracking-tight leading-tight">
          Practice Technical Interviews
        </h1>
        <p className="font-sans text-lg md:text-[18px] text-[#685F58] max-w-2xl mx-auto font-light leading-relaxed">
          Research a concept. Explain it clearly. Improve your communication.
        </p>
        <div className="flex justify-center mt-6">
          <svg
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
          </svg>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-12">
        <div className="relative">
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value as Track)}
            className="appearance-none bg-white shadow-sm border border-[#F2EDE6] text-[#1A1A24] font-medium rounded-xl py-3 pl-12 pr-12 cursor-pointer hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-[#F28C56]/20 outline-none text-sm"
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

        <div className="relative">
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as Mode)}
            className="appearance-none bg-white shadow-sm border border-[#F2EDE6] text-[#1A1A24] font-medium rounded-xl py-3 pl-12 pr-12 cursor-pointer hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-[#F28C56]/20 outline-none text-sm"
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

      <div className="relative bg-linear-to-br from-[#FFF9F5] to-[#FEF3EB] rounded-4xl p-6 sm:p-10 border border-[#FDEAE0] shadow-[0_4px_20px_rgba(242,140,86,0.05)] max-w-4xl mx-auto mt-6 mb-12 flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="w-20 h-20 md:w-25 md:h-25 rounded-full bg-[#FFEADF] flex items-center justify-center border-4 border-[#FFFDF8] shadow-[0_0_20px_rgba(242,140,86,0.15)] shrink-0 relative">
          <div className="absolute inset-0 rounded-full border border-[#F28C56]/20" />
          <span className="text-[36px] md:text-[44px] text-[#E87333] font-bold font-mono">
            &#123;&#125;
          </span>
        </div>

        <div className="flex-1 space-y-3 text-center md:text-left w-full overflow-hidden">
          <div className="text-[12px] font-bold text-[#6B8B67] tracking-widest uppercase">
            YOUR TOPIC • {selectedTrack}
          </div>

          <div className="relative overflow-hidden min-h-14 flex items-center justify-center md:justify-start">
            <h2
              className={`font-display text-2xl sm:text-3xl md:text-[40px] text-[#1A1A24] tracking-tight font-bold transition-all duration-300 ${
                isSpinning ? 'opacity-30 scale-95 blur-[1px]' : 'opacity-100 scale-100 blur-0'
              }`}
            >
              {currentTopic.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-sm text-[#7D7068] font-medium pt-2">
            <span className="bg-[#FFE5D6] text-[#C45E20] px-3.5 py-1 rounded-full text-[13px] font-semibold">
              {currentTopic.diff}
            </span>
            {showResearchBadge && (
              <>
                <span className="text-[#D3C7BF]">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#D27E4B]">
                    schedule
                  </span>
                  <span>{currentTopic.res}</span>
                </span>
              </>
            )}
            <span className="text-[#D3C7BF]">•</span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#D27E4B]">
                mic
              </span>
              <span>{currentTopic.pres}</span>
            </span>
          </div>
        </div>

        <svg
          className="absolute top-4 right-4 text-[#E6C6AC] opacity-30 w-16 h-16 pointer-events-none hidden sm:block"
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

      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-8">
        <button
          onClick={handleSpinClick}
          disabled={isSpinning}
          className="bg-white border border-[#F2EDE6] shadow-sm hover:bg-gray-50 text-[#1A1A24] font-medium text-[15px] px-6 py-3.5 rounded-2xl transition-all duration-200 flex items-center gap-2.5 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <span
            className={`material-symbols-outlined text-[#5C5C5C] ${
              isSpinning ? 'spin-icon-anim' : ''
            }`}
          >
            casino
          </span>
          Spin Again
        </button>

        {onGenerateCustomTopic && (
          <button
            onClick={onGenerateCustomTopic}
            disabled={isGeneratingCustom}
            title="Generate a fresh topic using AI"
            className="bg-[#E8F3E8] border border-[#C5DEC5] text-[#3B5436] font-medium text-[15px] px-5 py-3.5 rounded-2xl transition-all duration-200 flex items-center gap-2 active:scale-95 cursor-pointer hover:bg-[#d9ebd9]"
          >
            {isGeneratingCustom ? 'AI Generating...' : 'AI Custom Topic'}
          </button>
        )}

        <button
          onClick={onGetStarted}
          className="bg-linear-to-r from-[#F28C56] to-[#EE7738] hover:from-[#E67D45] hover:to-[#E06626] text-white font-medium text-[16px] px-8 py-3.5 rounded-full transition-all duration-200 shadow-[0_8px_20px_rgba(242,140,86,0.3)] flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          Get Started
          <span className="material-symbols-outlined font-light text-xl">
            arrow_forward
          </span>
        </button>
      </div>

      {customTopicError && (
        <p className="mt-4 text-center text-sm text-red-600">{customTopicError}</p>
      )}

      <div className="flex items-center justify-center gap-2 mt-8 text-sm text-[#8D827A]">
        <span className="material-symbols-outlined text-[18px]">verified_user</span>
        <span>
          {selectedMode === 'Quick Pitch'
            ? 'Quick Pitch skips research — you present immediately.'
            : 'You can use any resources while researching.'}
        </span>
      </div>

      <div
        onClick={handleNextQuote}
        title="Click to see another quote"
        className="mt-16 mx-auto max-w-2xl bg-white/60 border border-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-sm hover:bg-white/80 transition-colors cursor-pointer"
      >
        <p className="font-sans text-[17px] text-[#5C7A56] italic">
          "{currentQuote.quote}"
        </p>
        <p className="text-sm text-[#8D827A] mt-2">— {currentQuote.author}</p>
      </div>
    </section>
  );
};
