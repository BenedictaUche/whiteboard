import React from 'react';
import { Topic } from '../types';

interface ResultsStateProps {
  topic: Topic;
  transcript: string;
  setTranscript: (transcript: string) => void;
  onGetFeedback: () => void;
  isLoadingFeedback: boolean;
  feedbackError?: string | null;
}

export const ResultsState: React.FC<ResultsStateProps> = ({
  topic: _topic,
  transcript,
  setTranscript,
  onGetFeedback,
  isLoadingFeedback,
  feedbackError = null,
}) => {
  const canRequestFeedback = transcript.trim().length > 0 && !isLoadingFeedback;

  return (
    <section className="fade-in space-y-10 w-full max-w-[800px] mx-auto px-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-[#E8F3E8] text-[#5C7A56] mx-auto rounded-full flex items-center justify-center mb-6 shadow-sm">
          <span
            className="material-symbols-outlined text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>
        <h2 className="font-display text-3xl md:text-4xl text-[#1A1A24] font-bold">
          Presentation Complete
        </h2>
        <p className="text-sm text-[#685F58]">
          Review your transcript below. You can make quick edits before submitting to your AI
          mentor.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-[#F2EDE6] space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[12px] font-bold text-[#685F58] uppercase tracking-wider">
            TRANSCRIPT
          </h3>
          <span className="text-xs text-[#8D827A]">
            {transcript.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          className="w-full font-sans text-base md:text-[17px] text-[#685F58] leading-relaxed border border-[#F2EDE6] rounded-2xl p-4 focus:ring-2 focus:ring-[#F28C56]/30 focus:outline-none resize-none bg-gray-50/50"
        />
      </div>

      {feedbackError && (
        <p className="text-center text-sm text-red-600" role="alert">
          {feedbackError}
        </p>
      )}

      <div className="flex justify-center pt-2">
        <button
          onClick={onGetFeedback}
          disabled={!canRequestFeedback}
          title={
            !transcript.trim()
              ? 'Add a transcript before requesting feedback'
              : 'Get AI Feedback'
          }
          className="bg-gradient-to-r from-[#F28C56] to-[#EE7738] hover:from-[#E67D45] hover:to-[#E06626] text-white font-medium text-lg px-8 py-4 rounded-full transition-all duration-200 shadow-[0_8px_20px_rgba(242,140,86,0.3)] flex items-center gap-2.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingFeedback ? (
            <>
              <span className="material-symbols-outlined text-white animate-spin">sync</span>
              Analyzing Presentation with AI...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-white">auto_awesome</span>
              Get AI Feedback
            </>
          )}
        </button>
      </div>
    </section>
  );
};
