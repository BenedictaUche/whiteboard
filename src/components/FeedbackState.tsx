import React from 'react';
import { Topic, AIFeedback } from '../types';

interface FeedbackStateProps {
  topic: Topic;
  feedback: AIFeedback;
  onStartNewDrill: () => void;
  onSelectSuggestedTopic?: (topicTitle: string) => void;
}

function formatScore(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

export const FeedbackState: React.FC<FeedbackStateProps> = ({
  topic: _topic,
  feedback,
  onStartNewDrill,
  onSelectSuggestedTopic,
}) => {
  const summary =
    feedback.strengths?.[0] ||
    'Your mentor reviewed this presentation. See the details below.';

  return (
    <section className="fade-in space-y-12 max-w-[800px] mx-auto w-full px-4">
      <div className="text-center space-y-4">
        <div className="inline-block px-4 py-1 bg-[#E8F3E8] text-[#5C7A56] rounded-full font-bold text-[11px] uppercase tracking-widest">
          Session Review
        </div>
        <h2 className="font-display text-3xl md:text-4xl lg:text-[44px] text-[#1A1A24] font-bold">
          Feedback from your mentor
        </h2>
        <p className="font-handwriting text-2xl md:text-3xl text-[#685F58] italic max-w-2xl mx-auto leading-tight pt-2">
          "{summary}"
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-[#F2EDE6]">
        <div className="text-center space-y-1 relative flex flex-col items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg className="w-16 h-16 text-[#F28C56]/20" viewBox="0 0 100 100">
              <path
                d="M50,10 A40,40 0 1,1 49.9,10"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="3"
                style={{
                  strokeDasharray: 300,
                  strokeDashoffset: 0,
                  transform: 'rotate(-15deg)',
                  transformOrigin: 'center',
                }}
              />
            </svg>
          </div>
          <div className="text-[#E87333] font-display text-3xl md:text-4xl font-bold">
            {formatScore(feedback.overallScore, 0)}
          </div>
          <div className="text-[12px] font-bold text-[#D3C7BF] tracking-wider uppercase">
            Overall /100
          </div>
        </div>

        <div className="text-center space-y-1 flex flex-col items-center justify-center">
          <div className="text-[#1A1A24] font-display text-3xl md:text-4xl font-bold">
            {formatScore(feedback.technicalAccuracy)}
          </div>
          <div className="text-[12px] font-bold text-[#D3C7BF] tracking-wider uppercase">
            Accuracy
          </div>
        </div>

        <div className="text-center space-y-1 flex flex-col items-center justify-center">
          <div className="text-[#1A1A24] font-display text-3xl md:text-4xl font-bold">
            {formatScore(feedback.communication)}
          </div>
          <div className="text-[12px] font-bold text-[#D3C7BF] tracking-wider uppercase">
            Clarity
          </div>
        </div>

        <div className="text-center space-y-1 flex flex-col items-center justify-center">
          <div className="text-[#1A1A24] font-display text-3xl md:text-4xl font-bold">
            {formatScore(feedback.structure)}
          </div>
          <div className="text-[12px] font-bold text-[#D3C7BF] tracking-wider uppercase">
            Structure
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-[32px] space-y-6 shadow-sm border border-[#F2EDE6]">
        <h3 className="font-display text-xl md:text-2xl text-[#1A1A24] font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[#F28C56]">edit_note</span>
          Detailed Review
        </h3>
        <div className="space-y-4 font-sans text-base md:text-[17px] text-[#685F58] leading-relaxed">
          {feedback.strengths?.length > 0 ? (
            <ul className="space-y-3">
              {feedback.strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#82A87D] text-sm mt-1">
                    check_circle
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="italic text-gray-500">No strengths listed for this session.</p>
          )}
          <p className="text-sm text-[#8D827A] pt-2">
            Confidence: {formatScore(feedback.confidence)} / 10
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-4 bg-white/50 p-6 rounded-2xl border border-[#F2EDE6]">
          <h4 className="text-[12px] font-bold text-[#6B8B67] tracking-widest uppercase">
            Missing Concepts
          </h4>
          <ul className="space-y-3">
            {feedback.missingConcepts?.length > 0 ? (
              feedback.missingConcepts.map((concept, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-[#685F58] text-sm md:text-base"
                >
                  <span className="material-symbols-outlined text-[#F28C56] text-sm mt-1">
                    add_circle
                  </span>
                  <span>{concept}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-500 italic">
                No major missing concepts identified!
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-4 bg-white/50 p-6 rounded-2xl border border-[#F2EDE6]">
          <h4 className="text-[12px] font-bold text-[#6B8B67] tracking-widest uppercase">
            Suggested Follow-Up Topics
          </h4>
          <div className="flex flex-wrap gap-2">
            {feedback.recommendedTopics?.length > 0 ? (
              feedback.recommendedTopics.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectSuggestedTopic?.(item)}
                  className="px-4 py-2 bg-white border border-[#F2EDE6] text-[#685F58] rounded-xl text-sm shadow-sm hover:border-[#F28C56]/50 hover:text-[#944a19] transition-colors cursor-pointer active:scale-95"
                >
                  {item}
                </button>
              ))
            ) : (
              <span className="text-sm text-gray-500 italic">No suggested topics.</span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-8 flex justify-center">
        <button
          onClick={onStartNewDrill}
          className="bg-gradient-to-r from-[#F28C56] to-[#EE7738] hover:from-[#E67D45] hover:to-[#E06626] text-white font-medium text-lg px-10 py-4 rounded-full transition-all duration-200 shadow-[0_8px_20px_rgba(242,140,86,0.3)] flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          Start New Drill
          <span className="material-symbols-outlined font-light text-xl">refresh</span>
        </button>
      </div>
    </section>
  );
};
