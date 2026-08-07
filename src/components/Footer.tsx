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
      <div className="text-[#8D827A] text-[13px]">
        © 2026 Whiteboard. <a href="https://tiktok.com/@techwriterb" className="hover:text-[#1A1A24] text-[#8D827A] font-bold transition-colors duration-200 cursor-pointer">@techwriterb</a>
      </div>
    </footer>
  );
};
