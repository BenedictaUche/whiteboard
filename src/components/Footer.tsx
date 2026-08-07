import React from 'react';

interface FooterProps {
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenSupport?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPrivacy,
  onOpenTerms,
  onOpenSupport,
}) => {
  return (
    <footer className="w-full py-12 bg-transparent max-w-250 mx-auto px-6 flex flex-col items-center gap-6 mt-auto text-center">
      <div className="flex gap-8">
        <button
          onClick={onOpenPrivacy}
          className="text-[#8D827A] text-[13px] font-medium hover:text-[#1A1A24] transition-colors duration-200 cursor-pointer"
        >
          Privacy
        </button>
        <button
          onClick={onOpenTerms}
          className="text-[#8D827A] text-[13px] font-medium hover:text-[#1A1A24] transition-colors duration-200 cursor-pointer"
        >
          Terms
        </button>
        <button
          onClick={onOpenSupport}
          className="text-[#8D827A] text-[13px] font-medium hover:text-[#1A1A24] transition-colors duration-200 cursor-pointer"
        >
          Support
        </button>
      </div>
      <div className="text-[#8D827A] text-[13px]">
        © 2026 Whiteboard. <a href="https://tiktok.com/@techwriterb" className="hover:text-[#1A1A24] text-[#8D827A] font-bold transition-colors duration-200 cursor-pointer">@techwriterb</a>
      </div>
    </footer>
  );
};
