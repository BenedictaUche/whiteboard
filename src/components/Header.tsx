import React from 'react';
import { AppStep, Theme } from '../types';

interface HeaderProps {
  currentStep: AppStep;
  onNavigate: (step: AppStep) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onNavigate,
  theme,
  onToggleTheme,
  onOpenHelp,
  onOpenSettings,
}) => {
  return (
    <header className="w-full z-50 pt-4 sm:pt-6 md:pt-8 pb-4 transition-all duration-200 ease-out">
      <div className="flex justify-between items-center px-4 sm:px-6 md:px-8 lg:px-12 max-w-300 mx-auto gap-2">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('selection')}
          className="flex items-center gap-2 sm:gap-3 text-left focus:outline-none group cursor-pointer shrink-0"
          aria-label="Whiteboard Logo"
        >
          <img src="/logo.png" alt="Whiteboard Logo" className="w-9 h-9 sm:w-10 sm:h-10" />
          <span className="font-display text-[18px] sm:text-[22px] font-bold tracking-tight whitespace-nowrap">
            Whiteboard
          </span>
        </button>

        {/* Middle Nav Links — hidden on small screens, shown sm+ */}
        <div className="hidden sm:flex items-center gap-6 lg:gap-10 font-medium text-[15px]">
          <button
            onClick={() => onNavigate('selection')}
            className={`relative transition-colors duration-200 cursor-pointer ${
              currentStep !== 'history'
                ? 'text-[#3B5436] font-semibold'
                : 'text-[#7D7068] hover:text-[#944a19]'
            }`}
            aria-label="Navigate to Practice"
          >
            Practice
            {currentStep !== 'history' && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#82A87D] rounded-full" />
            )}
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`relative transition-colors duration-200 cursor-pointer ${
              currentStep === 'history'
                ? 'text-[#3B5436] font-semibold'
                : 'text-[#7D7068] hover:text-[#944a19]'
            }`}
            aria-label="Navigate to History"
          >
            History
            {currentStep === 'history' && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#82A87D] rounded-full" />
            )}
          </button>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 text-[#7D7068] shrink-0">
          <button
            onClick={onToggleTheme}
            title={`Current theme: ${theme}. Click to change.`}
            className="hover:bg-[#d8e3d8] transition-colors duration-200 rounded-full p-1.5 sm:p-2 flex items-center justify-center active:scale-95 cursor-pointer"
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined font-light text-[20px] sm:text-[22px]">
              {theme === 'dark' ? 'dark_mode' : theme === 'sage' ? 'eco' : 'light_mode'}
            </span>
          </button>

          <button
            onClick={onOpenHelp}
            title="Help & Info"
            className="hover:bg-[#d8e3d8] transition-colors duration-200 rounded-full p-1.5 sm:p-2 flex items-center justify-center active:scale-95 cursor-pointer"
            aria-label="Open Help & Info"
          >
            <span className="material-symbols-outlined font-light text-[20px] sm:text-[22px]">help_outline</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Settings"
            className="hover:bg-[#d8e3d8] transition-colors duration-200 rounded-full p-1.5 sm:p-2 flex items-center justify-center active:scale-95 cursor-pointer"
            aria-label="Open Settings"
          >
            <span className="material-symbols-outlined font-light text-[20px] sm:text-[22px]">settings</span>
          </button>
        </div>
      </div>

      {/* Mobile-only nav links row, below the header bar */}
      <div className="sm:hidden flex items-center justify-center gap-8 px-4 mt-3 font-medium text-[14px]">
        <button
          onClick={() => onNavigate('selection')}
          className={`relative transition-colors duration-200 cursor-pointer py-1 ${
            currentStep !== 'history'
              ? 'text-[#3B5436] font-semibold'
              : 'text-[#7D7068]'
          }`}
          aria-label="Navigate to Practice"
        >
          Practice
          {currentStep !== 'history' && (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#82A87D] rounded-full" />
          )}
        </button>
        <button
          onClick={() => onNavigate('history')}
          className={`relative transition-colors duration-200 cursor-pointer py-1 ${
            currentStep === 'history'
              ? 'text-[#3B5436] font-semibold'
              : 'text-[#7D7068]'
          }`}
          aria-label="Navigate to History"
        >
          History
          {currentStep === 'history' && (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#82A87D] rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
};
