import React from 'react';
import { Topic, AIFeedback, Importance } from '../types';
interface FeedbackStateProps {
    topic: Topic;
    feedback: AIFeedback;
    onStartNewDrill: () => void;
    onPracticeAgain?: () => void;
    onPracticeFollowUp?: (question: string) => void;
}
function formatScore(value: number, digits = 1): string {
    if (!Number.isFinite(value))
        return '—';
    return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}
const DIMENSIONS: {
    key: keyof AIFeedback['scores'];
    label: string;
}[] = [
    { key: 'technicalAccuracy', label: 'Accuracy' },
    { key: 'conceptCoverage', label: 'Coverage' },
    { key: 'communication', label: 'Clarity' },
    { key: 'structure', label: 'Structure' },
    { key: 'depth', label: 'Depth' },
];
const IMPORTANCE_STYLES: Record<Importance, string> = {
    high: 'bg-red-50 text-red-600 border-red-200',
    medium: 'bg-[#FFF3EA] text-[#E87333] border-[#F8D8C2]',
    low: 'bg-gray-50 text-gray-500 border-gray-200',
};
export const FeedbackState: React.FC<FeedbackStateProps> = ({ topic: _topic, feedback, onStartNewDrill, onPracticeAgain, onPracticeFollowUp, }) => {
    const summary = feedback.summary ||
        'Your mentor reviewed this presentation. See the details below.';
    const followUpQuestion = feedback.interviewerFollowUp?.question?.trim() ?? '';
    const nextInstruction = feedback.nextPractice?.instruction?.trim() ?? '';
    return (<section className="fade-in space-y-10 sm:space-y-12 max-w-200 mx-auto w-full px-4">
      <div className="text-center space-y-4">
        <div className="inline-block px-4 py-1 bg-[#E8F3E8] text-[#5C7A56] rounded-full font-bold text-[11px] uppercase tracking-widest">
          Session Review
        </div>
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[44px] text-[#1A1A24] font-bold wrap-break-word">
          Feedback from your mentor
        </h2>
        <p className="font-handwriting text-xl sm:text-2xl md:text-3xl text-[#685F58] italic max-w-2xl mx-auto leading-tight pt-2 px-2 wrap-break-word">
          {summary}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 sm:gap-5 py-6 sm:py-8 border-y border-[#F2EDE6]">
        <div className="text-center space-y-1 flex flex-col items-center justify-center">
          <div className="text-[#E87333] font-display text-3xl sm:text-4xl md:text-4xl font-bold">
            {formatScore(feedback.overallScore, 0)}
          </div>
          <div className="text-[10px] sm:text-[12px] font-bold text-[#D3C7BF] tracking-wider uppercase">
            Overall /100
          </div>
        </div>

        {DIMENSIONS.map(({ key, label }) => (<div key={key} className="text-center space-y-1 flex flex-col items-center justify-center">
            <div className="text-[#1A1A24] font-display text-2xl sm:text-3xl font-bold">
              {formatScore(feedback.scores?.[key])}
            </div>
            <div className="text-[10px] sm:text-[12px] font-bold text-[#D3C7BF] tracking-wider uppercase">
              {label}
            </div>
          </div>))}
      </div>

      <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-4xl space-y-5 shadow-sm border border-[#F2EDE6]">
        <h3 className="text-[12px] font-bold text-[#6B8B67] tracking-widest uppercase flex items-center gap-2">
          <span className="material-symbols-outlined text-base">thumb_up</span>
          What's Working
        </h3>
        {feedback.strengths?.length > 0 ? (<ul className="space-y-4">
            {feedback.strengths.map((item, idx) => (<li key={idx} className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#82A87D] text-sm mt-1 shrink-0">
                  check_circle
                </span>
                <span className="font-sans text-base md:text-[17px] text-[#685F58] leading-relaxed wrap-break-word">
                  {item.point}
                  {item.evidence && (<span className="block text-sm text-[#8D827A] italic mt-0.5">
                      "{item.evidence}"
                    </span>)}
                </span>
              </li>))}
          </ul>) : (<p className="italic text-gray-500 text-sm">
            No clear strengths identified for this session.
          </p>)}
      </div>

      <div className="grid md:grid-cols-2 gap-5 sm:gap-6 md:gap-8">

        <div className="space-y-4 bg-white/50 p-5 sm:p-6 rounded-2xl border border-[#F2EDE6]">
          <h3 className="text-[12px] font-bold text-[#6B8B67] tracking-widest uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              trending_up
            </span>
            Where You Can Improve
          </h3>
          <ul className="space-y-4">
            {feedback.missingConcepts?.length > 0 ? (feedback.missingConcepts.map((item, idx) => (<li key={idx} className="flex items-start gap-2.5 text-[#685F58] text-sm md:text-base">
                  <span className="material-symbols-outlined text-[#F28C56] text-sm mt-1 shrink-0">
                    add_circle
                  </span>
                  <span className="wrap-break-word">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#1A1A24]">
                        {item.concept}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${IMPORTANCE_STYLES[item.importance] ?? IMPORTANCE_STYLES.medium}`}>
                        {item.importance}
                      </span>
                    </span>
                    {item.explanation && (<span className="block mt-1 leading-relaxed">
                        {item.explanation}
                      </span>)}
                  </span>
                </li>))) : (<li className="text-sm text-gray-500 italic">
                No major missing concepts identified!
              </li>)}
          </ul>
        </div>

        <div className="space-y-4 bg-white/50 p-5 sm:p-6 rounded-2xl border border-[#F2EDE6]">
          <h3 className="text-[12px] font-bold text-[#6B8B67] tracking-widest uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              contact_support
            </span>
            Your Interviewer Might Ask
          </h3>
          {followUpQuestion ? (<div className="space-y-4">
              <p className="font-display text-lg sm:text-xl text-[#1A1A24] font-semibold leading-snug wrap-break-word">
                "{followUpQuestion}"
              </p>
              {feedback.interviewerFollowUp?.reason && (<p className="text-sm text-[#8D827A] leading-relaxed wrap-break-word">
                  {feedback.interviewerFollowUp.reason}
                </p>)}
              {onPracticeFollowUp && (<button onClick={() => onPracticeFollowUp(followUpQuestion)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#F28C56]/40 text-[#944a19] rounded-xl text-sm font-medium shadow-sm hover:bg-[#FFF9F5] hover:border-[#F28C56]/70 transition-colors cursor-pointer active:scale-95" aria-label="Practice the follow-up question now">
                  <span className="material-symbols-outlined text-base">
                    mic
                  </span>
                  Practice Follow-Up
                </button>)}
            </div>) : (<p className="text-sm text-gray-500 italic">
              No follow-up question generated for this session.
            </p>)}
        </div>
      </div>

      {feedback.corrections?.length > 0 && (<div className="space-y-4 bg-white/50 p-5 sm:p-6 rounded-2xl border border-[#F8D8C2]">
          <h3 className="text-[12px] font-bold text-[#E87333] tracking-widest uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              error_outline
            </span>
            Corrections
          </h3>
          <ul className="space-y-4">
            {feedback.corrections.map((item, idx) => (<li key={idx} className="flex items-start gap-2.5 text-[#685F58] text-sm md:text-base">
                <span className="material-symbols-outlined text-[#E87333] text-sm mt-1 shrink-0">
                  close
                </span>
                <span className="wrap-break-word">
                  <span className="block">{item.misconception}</span>
                  <span className="flex items-start gap-2 mt-1.5">
                    <span className="material-symbols-outlined text-[#82A87D] text-sm mt-0.5 shrink-0">
                      check
                    </span>
                    <span className="leading-relaxed">{item.correction}</span>
                  </span>
                </span>
              </li>))}
          </ul>
        </div>)}

      {nextInstruction && (<div className="space-y-3 bg-[#FFF9F5] p-5 sm:p-6 rounded-2xl border border-[#FDEAE0]">
          <h3 className="text-[12px] font-bold text-[#6B8B67] tracking-widest uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              flag
            </span>
            Try This Next
          </h3>
          <p className="font-sans text-base md:text-[17px] text-[#685F58] leading-relaxed wrap-break-word">
            {nextInstruction}
          </p>
        </div>)}

      <div className="pt-4 sm:pt-8 pb-4 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4">
        {onPracticeAgain && (<button onClick={onPracticeAgain} title="Retry this same topic — your focus areas will be shown during the attempt" className="w-full sm:w-auto order-2 sm:order-1 bg-white border border-[#F2EDE6] shadow-sm hover:bg-gray-50 text-[#1A1A24] font-medium text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 cursor-pointer" aria-label="Practice the same topic again">
            <span className="material-symbols-outlined font-light text-xl">
              replay
            </span>
            Practice Again
          </button>)}
        <button onClick={onStartNewDrill} className="w-full sm:w-auto order-1 sm:order-2 bg-linear-to-r from-[#F28C56] to-[#EE7738] hover:from-[#E67D45] hover:to-[#E06626] text-white font-medium text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 rounded-full transition-all duration-200 shadow-[0_8px_20px_rgba(242,140,86,0.3)] flex items-center justify-center gap-2 active:scale-95 cursor-pointer" aria-label="Start a new drill">
          Start New Drill
          <span className="material-symbols-outlined font-light text-xl">
            refresh
          </span>
        </button>
      </div>
    </section>);
};
