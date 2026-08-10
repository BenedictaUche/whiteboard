import React, { useState } from 'react';
import { DrillRecord, Track } from '../types';

interface HistoryViewProps {
  records: DrillRecord[];
  onSelectRecord: (record: DrillRecord) => void;
  onClearHistory: () => void;
  onStartNewDrill: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onSelectRecord,
  onClearHistory,
  onStartNewDrill,
}) => {
  const [filterTrack, setFilterTrack] = useState<string>('All');

  const filtered = records.filter((r) => {
    if (filterTrack === 'All') return true;
    return r.track === filterTrack;
  });

  return (
    <section className="fade-in space-y-6 sm:space-y-8 max-w-225 mx-auto w-full px-4">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F2EDE6]">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1A1A24]">
            Drill History
          </h2>
          <p className="text-sm text-[#685F58] pt-1 break-words">
            Review past presentation drills and AI mentor feedback scores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Track filter */}
          <select
            value={filterTrack}
            onChange={(e) => setFilterTrack(e.target.value)}
            className="bg-white border border-[#F2EDE6] text-sm font-medium text-[#1A1A24] rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="All">All Tracks</option>
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="System Design">System Design</option>
            <option value="DevOps">DevOps</option>
          </select>

          {records.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-2 border border-red-200 rounded-xl bg-white hover:bg-red-50 cursor-pointer"
              aria-label="Clear History"
            >
              Clear History
            </button>
          )}

          <button
            onClick={onStartNewDrill}
            className="bg-[#F28C56] text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm hover:bg-[#e07742] transition-colors cursor-pointer"
            aria-label="Start New Drill"
          >
            New Drill
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/60 border border-[#F2EDE6] rounded-3xl sm:rounded-4xl p-8 sm:p-12 text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-[#82A87D]">
            history_edu
          </span>
          <h3 className="text-lg font-bold text-[#1A1A24]">No drill records found</h3>
          <p className="text-sm text-[#685F58] max-w-md mx-auto break-words">
            Complete a practice presentation to save your transcript and AI mentor review here.
          </p>
          <button
            onClick={onStartNewDrill}
            className="bg-[#F28C56] text-white font-medium px-6 py-2.5 rounded-full text-sm shadow-sm hover:bg-[#e07742] transition-colors cursor-pointer"
            aria-label="Start Your First Practice Drill"
          >
            Start Your First Practice Drill
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filtered.map((record) => {
            const dateStr = new Date(record.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={record.id}
                onClick={() => onSelectRecord(record)}
                className="bg-white hover:bg-[#FFF9F5] border border-[#F2EDE6] hover:border-[#F28C56]/40 p-4 sm:p-6 rounded-2xl shadow-sm transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#6B8B67] bg-[#E8F3E8] px-2 sm:px-2.5 py-0.5 rounded-full">
                      {record.track}
                    </span>
                    <span className="text-xs text-[#8D827A]">• {record.mode}</span>
                    <span className="text-xs text-[#8D827A] ml-auto md:ml-0 break-words">• {dateStr}</span>
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1A24] break-words">
                    {record.topic.title}
                  </h3>
                  <p className="text-xs text-[#685F58] line-clamp-1 italic break-words">
                    "{record.transcript}"
                  </p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 shrink-0">
                  {record.feedback && (
                    <div className="text-right">
                      <div className="text-xl sm:text-2xl font-bold font-display text-[#E87333]">
                        {Number.isFinite(record.feedback.overallScore)
                          ? Math.round(record.feedback.overallScore)
                          : '—'}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-[#D3C7BF]">
                        Overall Score
                      </div>
                    </div>
                  )}

                  <span className="material-symbols-outlined text-[#82A87D]">
                    chevron_right
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};