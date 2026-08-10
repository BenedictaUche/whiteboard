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
    <section className="fade-in space-y-8 sm:space-y-10 w-full max-w-200 mx-auto px-4">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#E8F3E8] text-[#5C7A56] mx-auto rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-sm">
          <span
            className="material-symbols-outlined text-2xl sm:text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#1A1A24] font-bold">
          Presentation Complete
        </h2>
        <p className="text-sm text-[#685F58] px-2 break-words">
          Review your transcript below. You can make quick edits before submitting to your AI
          mentor.
        </p>
      </div>

      <div className="bg-white p-5 sm:p-6 md:p-8 rounded-3xl sm:rounded-4xl shadow-sm border border-[#F2EDE6] space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
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
        <p className="text-center text-sm text-red-600 px-2 break-words" role="alert">
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
          className="w-full sm:w-auto bg-linear-to-r from-[#F28C56] to-[#EE7738] hover:from-[#E67D45] hover:to-[#E06626] text-white font-medium text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-2 rounded-full transition-all duration-200 shadow-[0_8px_20px_rgba(242,140,86,0.3)] flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Get AI Feedback"
        >
          {isLoadingFeedback ? (
            <>
              <span className="material-symbols-outlined text-white animate-spin">sync</span>
              Analyzing Presentation ...
            </>
          ) : (
            <>Get Feedback</>
          )}
        </button>
      </div>
    </section>
  );
};