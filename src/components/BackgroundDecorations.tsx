import React from 'react';

export const BackgroundDecorations: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* Top Left Dots */}
      <div className="absolute top-32 sm:top-40 left-4 sm:left-12 md:left-32 flex flex-wrap w-15 gap-3 opacity-20">
        <div className="w-1.5 h-1.5 rounded-full bg-[#6B8B67]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#6B8B67]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#6B8B67]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#6B8B67]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#6B8B67]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#6B8B67]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#6B8B67]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#6B8B67]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#6B8B67]" />
      </div>

      {/* Top Right Sparkle */}
      <svg
        className="absolute top-28 sm:top-32 right-4 sm:right-12 md:right-32 text-[#F28C56] opacity-30 w-6 h-6 sm:w-8 sm:h-8"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" />
      </svg>

      {/* Bottom Right Sparkle */}
      <svg
        className="absolute bottom-32 sm:bottom-40 right-6 sm:right-24 md:right-48 text-[#F28C56] opacity-40 w-8 h-8 sm:w-10 sm:h-10"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 0l1.5 8.5 8.5 1.5-8.5 1.5-1.5 8.5-1.5-8.5-8.5-1.5 8.5-1.5z" />
      </svg>

      {/* Soft Green blobs bottom left */}
      <svg
        className="absolute bottom-0 left-0 w-75 sm:w-100 md:w-125 h-62.5 sm:h-75 md:h-100 opacity-[0.12] sm:opacity-[0.15]"
        fill="none"
        viewBox="0 0 500 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M-50 400C-50 400 30 250 150 280C270 310 350 200 450 250C550 300 500 400 500 400H-50Z"
          fill="#7EA477"
        />
        <path
          d="M-100 400C-100 400 -20 150 120 180C260 210 320 80 480 150C640 220 550 400 550 400H-100Z"
          fill="#A8C9A2"
          opacity="0.6"
        />
      </svg>

      {/* Soft Orange blobs bottom right */}
      <svg
        className="absolute bottom-0 right-0 w-62.5 sm:w-75 md:w-100 h-50 sm:h-62.5 md:h-75 opacity-[0.12] sm:opacity-[0.15]"
        fill="none"
        viewBox="0 0 400 300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M450 300C450 300 350 150 250 180C150 210 50 120 -50 200C-150 280 -50 300 -50 300H450Z"
          fill="#F28C56"
        />
      </svg>

      {/* Leaves illustration bottom left */}
      <svg
        className="absolute bottom-8 sm:bottom-10 left-4 sm:left-10 md:left-20 w-25 sm:w-37.5 h-37.5 sm:h-62.5 opacity-50 sm:opacity-70 hidden sm:block"
        fill="none"
        viewBox="0 0 150 250"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 250C20 250 40 150 100 50"
          stroke="#5C7A56"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <path
          d="M100 50C100 50 120 40 130 60C140 80 120 100 100 50Z"
          fill="#A8C9A2"
        />
        <path
          d="M60 120C60 120 80 90 100 100C120 110 100 140 60 120Z"
          fill="#A8C9A2"
        />
        <path
          d="M40 180C40 180 20 140 0 160C-20 180 10 200 40 180Z"
          fill="#A8C9A2"
        />
        <path
          d="M45 220C45 220 70 190 90 200C110 210 90 240 45 220Z"
          fill="#8BB585"
        />
      </svg>
    </div>
  );
};