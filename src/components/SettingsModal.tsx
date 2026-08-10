import React from 'react';
import { Theme } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  setTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-[#FDFCF5] border border-[#F2EDE6] rounded-3xl sm:rounded-4xl p-5 sm:p-6 md:p-8 max-w-md w-full shadow-xl space-y-5 sm:space-y-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-[#F2EDE6]">
          <h3 className="font-display text-lg sm:text-xl font-bold text-[#1A1A24] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F28C56]">settings</span>
            Whiteboard Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1 cursor-pointer shrink-0"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Theme Settings */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[#6B8B67]">
            Visual Aesthetic Theme
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              onClick={() => setTheme('cream')}
              className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer min-h-[88px] ${
                theme === 'cream'
                  ? 'border-[#F28C56] bg-white text-[#1A1A24] ring-2 ring-[#F28C56]/20'
                  : 'border-[#F2EDE6] bg-white/50 text-[#685F58]'
              }`}
              aria-label="Surface Cream Theme"
            >
              <span className="material-symbols-outlined text-base">light_mode</span>
              <span className="text-center leading-tight">Surface Cream</span>
            </button>

            <button
              onClick={() => setTheme('sage')}
              className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer min-h-[88px] ${
                theme === 'sage'
                  ? 'border-[#82A87D] bg-[#E8F3E8] text-[#3B5436] ring-2 ring-[#82A87D]/30'
                  : 'border-[#F2EDE6] bg-white/50 text-[#685F58]'
              }`}
              aria-label="Sage Green Theme"
            >
              <span className="material-symbols-outlined text-base">eco</span>
              <span className="text-center leading-tight">Zen Sage</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer min-h-[88px] ${
                theme === 'dark'
                  ? 'border-[#1A1A24] bg-[#1A1A24] text-white ring-2 ring-gray-400/30'
                  : 'border-[#F2EDE6] bg-white/50 text-[#685F58]'
              }`}
              aria-label="Dark Zen Theme"
            >
              <span className="material-symbols-outlined text-base">dark_mode</span>
              <span className="text-center leading-tight">Dark Zen</span>
            </button>
          </div>
        </div>

        {/* Backend & AI status */}
        <div className="bg-white p-4 rounded-2xl border border-[#F2EDE6] space-y-2 text-xs text-[#685F58]">
          <div className="flex justify-between items-center font-semibold text-[#1A1A24] gap-2">
            <span>AI Mentor Engine</span>
            <span className="flex items-center gap-1 text-[#5C7A56] shrink-0">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              OpenRouter
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500 break-words">
            Interview feedback runs server-side via OpenRouter. Configure OPENROUTER_API_KEY in
            your environment — the app never invents scores when AI is unavailable.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-[#F28C56] text-white text-sm font-medium px-6 py-2.5 rounded-full shadow-sm hover:bg-[#e07742] transition-colors cursor-pointer"
            aria-label="Close Settings Modal"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};