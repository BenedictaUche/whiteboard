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
    <header className="w-full z-50 pt-8 pb-4 transition-all duration-200 ease-out">
      <div className="flex justify-between items-center px-6 md:px-12 max-w-300 mx-auto">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('selection')}
          className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
        >
          <img src="/logo.png" alt="Whiteboard Logo" className="w-10 h-10" />
          <span className="font-display text-[22px] font-bold text-[#1A1A24] tracking-tight">
            Whiteboard
          </span>
        </button>

        {/* Middle Nav Links */}
        <div className="flex items-center gap-10 font-medium text-[15px]">
          <button
            onClick={() => onNavigate('selection')}
            className={`relative transition-colors duration-200 cursor-pointer ${
              currentStep !== 'history'
                ? 'text-[#3B5436] font-semibold'
                : 'text-[#7D7068] hover:text-[#944a19]'
            }`}
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
          >
            History
            {currentStep === 'history' && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#82A87D] rounded-full" />
            )}
          </button>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 md:gap-4 text-[#7D7068]">
          <button
            onClick={onToggleTheme}
            title={`Current theme: ${theme}. Click to change.`}
            className="hover:bg-[#d8e3d8] transition-colors duration-200 rounded-full p-2 flex items-center justify-center active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined font-light text-[22px]">
              {theme === 'dark' ? 'dark_mode' : theme === 'sage' ? 'eco' : 'light_mode'}
            </span>
          </button>

          <button
            onClick={onOpenHelp}
            title="Help & Info"
            className="hover:bg-[#d8e3d8] transition-colors duration-200 rounded-full p-2 flex items-center justify-center active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined font-light text-[22px]">help_outline</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Settings"
            className="hover:bg-[#d8e3d8] transition-colors duration-200 rounded-full p-2 flex items-center justify-center active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined font-light text-[22px]">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
