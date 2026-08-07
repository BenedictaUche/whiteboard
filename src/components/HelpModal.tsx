import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-[#FDFCF5] border border-[#F2EDE6] rounded-4xl p-6 sm:p-8 max-w-lg w-full shadow-xl space-y-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-[#F2EDE6]">
          <h3 className="font-display text-xl font-bold text-[#1A1A24] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#82A87D]">help_outline</span>
            How Whiteboard Works
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1 cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4 text-sm text-[#685F58] leading-relaxed">
          <p>
            <strong>Whiteboard</strong> applies the "Technical Zen" philosophy to technical interview preparation, replacing anxiety with structured practice and actionable AI mentor feedback.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-[#F2EDE6]">
              <span className="w-6 h-6 rounded-full bg-[#FFE5D6] text-[#C45E20] flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <div>
                <strong className="text-[#1A1A24] block">Select & Spin Topic</strong>
                Choose your track (Frontend, Backend, System Design, etc.) and spin for a targeted technical topic or request a custom AI topic.
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-[#F2EDE6]">
              <span className="w-6 h-6 rounded-full bg-[#E8F3E8] text-[#5C7A56] flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <div>
                <strong className="text-[#1A1A24] block">Choose Mode &amp; Get Started</strong>
                Deep Research starts a timed research phase. Quick Pitch skips research and goes
                straight into presentation.
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-[#F2EDE6]">
              <span className="w-6 h-6 rounded-full bg-[#E1F0F7] text-[#3c4a4f] flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <div>
                <strong className="text-[#1A1A24] block">Verbal Presentation</strong>
                Deliver your 2–5 minute presentation out loud via live microphone speech recognition or type your explanation.
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-[#F2EDE6]">
              <span className="w-6 h-6 rounded-full bg-[#FFEADF] text-[#E87333] flex items-center justify-center font-bold text-xs shrink-0">
                4
              </span>
              <div>
                <strong className="text-[#1A1A24] block">AI Mentor Feedback</strong>
                Receive detailed scoring on accuracy, clarity, and structure, along with missing edge cases and follow-up topics.
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#F28C56] text-white text-sm font-medium px-6 py-2.5 rounded-full shadow-sm hover:bg-[#e07742] transition-colors cursor-pointer"
            aria-label="Close Help Modal"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
